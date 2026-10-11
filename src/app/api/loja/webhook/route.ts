import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEnv } from "@/lib/env";
import { getGameAccount, type GameAccount } from "@/lib/game-account";
import { getPaymentClient } from "@/lib/mercadopago";
import { verifyMpSignature } from "@/lib/mercadopago-signature";
import { isUnlimitedStock } from "@/lib/products";
import { buildDeliveryRows } from "@/lib/deliveries";
import { sendOrderConfirmationEmail } from "@/lib/email";

type OrderStatus = "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";

// Transições permitidas: uma notificação atrasada ou repetida nunca volta o pedido
const ALLOWED_FROM: Record<Exclude<OrderStatus, "PENDING">, OrderStatus[]> = {
  APPROVED: ["PENDING", "REJECTED"],
  REJECTED: ["PENDING"],
  REFUNDED: ["APPROVED"],
};

function mapStatus(mpStatus: string | undefined): Exclude<OrderStatus, "PENDING"> | null {
  switch (mpStatus) {
    case "approved":
      return "APPROVED";
    case "rejected":
    case "cancelled": // inclui Pix expirado
      return "REJECTED";
    case "refunded":
    case "charged_back":
      return "REFUNDED";
    default:
      return null; // pending, in_process, authorized... nada a fazer ainda
  }
}

function toCents(value: number): number {
  return Math.round(value * 100);
}

export async function POST(request: Request) {
  let secret: string;
  try {
    secret = getEnv().MERCADOPAGO_WEBHOOK_SECRET;
  } catch (err) {
    console.error("[webhook] Ambiente mal configurado:", (err as Error).message);
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const { searchParams } = new URL(request.url);

  // Só notificações de "payment" da API de Webhooks são tratadas.
  // Chamadas antigas (IPN, ?topic=...) e outros tipos são aceitas e ignoradas.
  const type = searchParams.get("type") ?? body?.type;
  const dataId = searchParams.get("data.id") ?? body?.data?.id?.toString();
  if (type !== "payment" || !dataId) {
    return NextResponse.json({ received: true });
  }

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  if (!xSignature || !xRequestId || !verifyMpSignature({ xSignature, xRequestId, dataId, secret })) {
    console.error("[webhook] Assinatura ausente ou inválida");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    // Nunca confiar no corpo da notificação: o pagamento é relido na API do MercadoPago
    const paymentData = await getPaymentClient().get({ id: dataId });

    const orderId = paymentData.external_reference;
    if (!orderId) {
      console.error(`[webhook] Pagamento ${paymentData.id} sem external_reference`);
      return NextResponse.json({ received: true });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: { include: { product: true } },
      },
    });

    if (!order) {
      console.error(`[webhook] Pedido ${orderId} não encontrado`);
      return NextResponse.json({ received: true });
    }

    const newStatus = mapStatus(paymentData.status);
    if (!newStatus) {
      return NextResponse.json({ received: true });
    }

    if (newStatus === "APPROVED") {
      const amountOk = toCents(paymentData.transaction_amount ?? 0) >= toCents(Number(order.total));
      if (paymentData.currency_id !== "BRL" || !amountOk) {
        console.error(
          `[webhook] Valor/moeda diferente no pedido ${order.id}: ` +
            `${paymentData.transaction_amount} ${paymentData.currency_id} (esperado ${order.total} BRL)`
        );
        return NextResponse.json({ received: true });
      }
    }

    // Parcelas e valor pago com juros (cartão parcelado); no Pix é o próprio total
    const installments = paymentData.installments ?? 1;
    const paidAmount = paymentData.transaction_details?.total_paid_amount ?? paymentData.transaction_amount ?? null;

    // Conta do jogo para a entrega (nick, UUID, Java ou Bedrock), lida antes da transação
    let player: GameAccount | null = null;
    if (newStatus === "APPROVED" || newStatus === "REFUNDED") {
      player = await getGameAccount(order.user.nloginId);
      if (!player) {
        console.error(`[webhook] Pedido ${order.id} sem conta do jogo vinculada: entrega não criada`);
      }
    }

    const applied = await prisma.$transaction(async (tx) => {
      // Atualização condicional: notificações repetidas ou simultâneas são idempotentes
      const updated = await tx.order.updateMany({
        where: { id: order.id, status: { in: ALLOWED_FROM[newStatus] } },
        data: {
          status: newStatus,
          paymentMethod: paymentData.payment_method_id || order.paymentMethod,
          paymentId: String(paymentData.id),
          ...(newStatus === "APPROVED" ? { paidAt: new Date(), installments, paidAmount } : {}),
        },
      });
      if (updated.count === 0) return false;

      if (newStatus === "APPROVED") {
        for (const item of order.items) {
          // Estoque limitado nunca fica negativo (-1 = ilimitado)
          const decremented = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (decremented.count === 0 && !isUnlimitedStock(item.product.stock)) {
            console.error(`[webhook] Estoque excedido: pedido ${order.id}, produto ${item.productId}`);
          }
        }
      }

      // Fila de entregas (ou de estorno) para o plugin do servidor
      if (player) {
        const rows = buildDeliveryRows(order, player, newStatus === "REFUNDED" ? "REVOKE" : "DELIVER");
        if (rows.length > 0) await tx.delivery.createMany({ data: rows });
      }

      return true;
    });

    // E-mail de confirmação em segundo plano, uma vez só por aprovação
    if (applied && newStatus === "APPROVED" && order.user.email) {
      const username = player?.username || "Jogador";
      const itemsList = order.items.map((item) =>
        item.quantity > 1 ? `${item.quantity}x ${item.product.name}` : item.product.name
      );

      sendOrderConfirmationEmail(
        order.user.email,
        username,
        order.id,
        Number(order.total),
        itemsList,
        paymentData.payment_method_id || "pix",
        { installments, paidAmount: paidAmount ?? Number(order.total) }
      ).catch((err) => {
        console.error("[webhook] Erro no e-mail:", (err as Error).message);
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook] Erro no processamento:", (err as Error).message);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
