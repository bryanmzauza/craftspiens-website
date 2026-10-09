import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPreferenceClient, getMpConfig } from "@/lib/mercadopago";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { isUnlimitedStock } from "@/lib/products";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const rl = await checkRateLimit(`checkout:${session.user.id}`, RATE_LIMITS.checkout);
  if (!rl.success) {
    return rateLimitResponse(rl, "Muitas tentativas. Tente novamente mais tarde.");
  }

  const body = await request.json().catch(() => ({}));
  const couponCode = typeof body.couponCode === "string" ? body.couponCode.trim().toUpperCase() : "";

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    return NextResponse.json(
      { error: "Carrinho vazio" },
      { status: 400 }
    );
  }

  // Validate stock and active status
  for (const item of cartItems) {
    if (!item.product.active) {
      return NextResponse.json(
        { error: `Produto "${item.product.name}" não está mais disponível` },
        { status: 400 }
      );
    }
    if (!isUnlimitedStock(item.product.stock) && item.quantity > item.product.stock) {
      return NextResponse.json(
        { error: `Estoque insuficiente para "${item.product.name}"` },
        { status: 400 }
      );
    }
  }

  // Calculate subtotal
  let subtotal = 0;
  const orderItems: { productId: string; quantity: number; price: number }[] = [];

  for (const item of cartItems) {
    const price = Number(item.product.price);
    subtotal += price * item.quantity;
    orderItems.push({
      productId: item.productId,
      quantity: item.quantity,
      price,
    });
  }

  // Apply coupon
  let discount = 0;
  let couponId: string | null = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });

    if (!coupon || !coupon.active) {
      return NextResponse.json({ error: "Cupom inválido" }, { status: 400 });
    }
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return NextResponse.json({ error: "Cupom expirado" }, { status: 400 });
    }
    if (coupon.maxUses && coupon.uses >= coupon.maxUses) {
      return NextResponse.json({ error: "Cupom esgotado" }, { status: 400 });
    }

    discount = subtotal * (Number(coupon.discount) / 100);
    couponId = coupon.id;
  }

  // Discounted unit prices are computed before creating the order, so the stored
  // total is exactly what MercadoPago will charge (checked again by the webhook)
  const discountFactor = subtotal > 0 ? Math.max(subtotal - discount, 0) / subtotal : 1;
  const unitPrices = new Map(
    orderItems.map((item) => [item.productId, Math.round(item.price * discountFactor * 100) / 100])
  );
  const total =
    Math.round(
      orderItems.reduce((sum, item) => sum + unitPrices.get(item.productId)! * item.quantity, 0) * 100
    ) / 100;
  discount = Math.round((subtotal - total) * 100) / 100;

  // Create Order + OrderItems in transaction
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId: session.user.id,
        total: total,
        couponId,
        status: "PENDING",
        items: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    // Increment coupon usage
    if (couponId) {
      await tx.coupon.update({
        where: { id: couponId },
        data: { uses: { increment: 1 } },
      });
    }

    return newOrder;
  });

  // Create MercadoPago preference items (with the discount spread proportionally)
  const mpItems = order.items.map((item) => ({
    id: item.productId,
    title: item.product.name,
    description: item.product.shortDescription || item.product.description.slice(0, 200),
    quantity: item.quantity,
    unit_price: unitPrices.get(item.productId)!,
    currency_id: "BRL" as const,
  }));

  try {
    const mpConfig = getMpConfig();
    const mpPreference = await getPreferenceClient().create({
      body: {
        items: mpItems,
        back_urls: mpConfig.backUrls,
        auto_return: mpConfig.autoReturn,
        notification_url: mpConfig.notificationUrl,
        statement_descriptor: mpConfig.statementDescriptor,
        external_reference: order.id,
        payer: {
          email: session.user.email,
        },
        metadata: {
          order_id: order.id,
          user_id: session.user.id,
        },
      },
    });

    // Store MP preference/payment ID on order
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentId: mpPreference.id },
    });

    return NextResponse.json({
      orderId: order.id,
      preferenceId: mpPreference.id,
      initPoint: mpPreference.init_point,
      total,
      discount,
      subtotal,
    });
  } catch (err) {
    // Rollback order to failed state if MercadoPago fails
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "REJECTED" },
    });

    console.error("[checkout] MercadoPago error:", (err as Error).message);
    return NextResponse.json(
      { error: "Erro ao processar pagamento. Tente novamente." },
      { status: 500 }
    );
  }
}
