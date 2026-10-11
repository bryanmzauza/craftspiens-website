import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGameAccount } from "@/lib/game-account";
import { createCardCheckout, createPixPayment } from "@/lib/mercadopago";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { isUnlimitedStock } from "@/lib/products";
import { isValidCpf, normalizeCpf } from "@/lib/cpf";

// POST /api/loja/pedidos — cria o pedido de UM produto e o pagamento correspondente.
// Body: { slug, method: "pix" | "cartao", couponCode?, cpf? }
// Pix: devolve o id do pedido; a página /loja/pedido/[id] mostra o QR Code.
// Cartão: devolve a URL do Checkout Pro para redirecionar.

const METHODS = new Set(["pix", "cartao"]);
// Um Pix recém-gerado para o mesmo produto é reaproveitado em vez de criar outro
const REUSE_MIN_REMAINING_MS = 5 * 60 * 1000;

function toCents(value: number): number {
  return Math.round(value * 100);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // Compras são entregues no jogo: exige um nick do Minecraft vinculado
  if (session.user.nloginId == null) {
    return NextResponse.json(
      { error: "Vincule seu nick do Minecraft em Configurações > Contas vinculadas para comprar.", code: "SemNick" },
      { status: 403 }
    );
  }

  // Compras exigem e-mail confirmado (recibo e avisos do pedido vão para ele)
  if (!session.user.emailConfirmed) {
    return NextResponse.json(
      { error: "Confirme seu e-mail para continuar.", code: "EmailNaoVerificado" },
      { status: 403 }
    );
  }

  const rl = await checkRateLimit(`checkout:${session.user.id}`, RATE_LIMITS.checkout);
  if (!rl.success) {
    return rateLimitResponse(rl, "Muitos pedidos em pouco tempo. Aguarde alguns minutos.");
  }

  const body = await request.json().catch(() => ({}));
  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const method = typeof body.method === "string" ? body.method : "pix";
  const couponCode = typeof body.couponCode === "string" ? body.couponCode.trim().toUpperCase() : "";

  if (!slug || !METHODS.has(method)) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product || !product.active) {
    return NextResponse.json({ error: "Produto não encontrado ou indisponível." }, { status: 404 });
  }
  if (!isUnlimitedStock(product.stock) && product.stock < 1) {
    return NextResponse.json({ error: "Produto esgotado." }, { status: 400 });
  }

  // A entrega é no jogo: a conta precisa existir no nLogin (o plugin recebe nick,
  // UUID e se é Java ou Bedrock). CPF de quem paga (o aluno ou um responsável)
  // fica salvo na conta e pode ser trocado em qualquer compra.
  const [account, game] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, payerCpf: true } }),
    getGameAccount(session.user.nloginId),
  ]);
  if (!account) {
    return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
  }
  if (!game) {
    return NextResponse.json(
      { error: "A conta do jogo vinculada não foi encontrada no servidor. Vincule o nick de novo em Configurações.", code: "ContaJogoNaoEncontrada" },
      { status: 403 }
    );
  }
  const informedCpf = typeof body.cpf === "string" ? normalizeCpf(body.cpf) : "";
  if (informedCpf && !isValidCpf(informedCpf)) {
    return NextResponse.json({ error: "CPF inválido. Confira os números.", code: "CpfInvalido" }, { status: 400 });
  }
  const payerCpf = informedCpf || account.payerCpf;
  if (!payerCpf || !isValidCpf(payerCpf)) {
    return NextResponse.json(
      { error: "Informe o CPF de quem vai pagar para finalizar a compra.", code: "CpfObrigatorio" },
      { status: 400 }
    );
  }
  if (payerCpf !== account.payerCpf) {
    await prisma.user.update({ where: { id: session.user.id }, data: { payerCpf } });
  }

  // Cupom percentual
  const price = Number(product.price);
  let couponId: string | null = null;
  let discountPercent = 0;
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (!coupon || !coupon.active) {
      return NextResponse.json({ error: "Cupom inválido." }, { status: 400 });
    }
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return NextResponse.json({ error: "Cupom expirado." }, { status: 400 });
    }
    if (coupon.maxUses && coupon.uses >= coupon.maxUses) {
      return NextResponse.json({ error: "Cupom esgotado." }, { status: 400 });
    }
    discountPercent = Number(coupon.discount);
    couponId = coupon.id;
  }
  const total = Math.max(toCents(price * (1 - discountPercent / 100)), 100) / 100;

  // Pix ainda válido para o mesmo produto e valor: devolve o pedido existente
  if (method === "pix") {
    const existing = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: "PENDING",
        paymentMethod: "pix",
        pixExpiresAt: { gt: new Date(Date.now() + REUSE_MIN_REMAINING_MS) },
        items: { every: { productId: product.id } },
      },
      orderBy: { createdAt: "desc" },
    });
    if (existing && toCents(Number(existing.total)) === toCents(total)) {
      return NextResponse.json({ orderId: existing.id, method: "pix", reused: true });
    }
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: session.user.id,
        total,
        couponId,
        status: "PENDING",
        paymentMethod: method === "pix" ? "pix" : null,
        items: { create: [{ productId: product.id, quantity: 1, price }] },
      },
    });
    if (couponId) {
      await tx.coupon.update({ where: { id: couponId }, data: { uses: { increment: 1 } } });
    }
    return created;
  });

  const payer = { email: account.email, cpf: payerCpf, name: game.username };
  const description = `${product.name} - CraftSapiens`;

  try {
    if (method === "pix") {
      const pix = await createPixPayment({ orderId: order.id, amount: total, description, payer });
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentId: pix.paymentId,
          pixCode: pix.qrCode,
          pixQrBase64: pix.qrCodeBase64,
          pixExpiresAt: pix.expiresAt,
        },
      });
      return NextResponse.json({ orderId: order.id, method: "pix" }, { status: 201 });
    }

    const checkout = await createCardCheckout({
      orderId: order.id,
      productId: product.id,
      title: product.name,
      description: product.shortDescription || product.description.slice(0, 200),
      amount: total,
      quantity: 1,
      payer,
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentId: checkout.preferenceId, checkoutUrl: checkout.initPoint },
    });
    return NextResponse.json({ orderId: order.id, method: "cartao", redirectUrl: checkout.initPoint }, { status: 201 });
  } catch (err) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "REJECTED" } });
    console.error("[pedidos] Erro no MercadoPago:", (err as Error).message);
    return NextResponse.json(
      { error: "Não foi possível iniciar o pagamento. Tente novamente em instantes." },
      { status: 502 }
    );
  }
}
