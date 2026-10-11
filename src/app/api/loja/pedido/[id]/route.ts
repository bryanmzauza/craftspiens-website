import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { summarizeDeliveries } from "@/lib/deliveries";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

// GET /api/loja/pedido/[id] — situação do pedido. A página do Pix consulta esta
// rota a cada poucos segundos até o webhook aprovar o pagamento.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const rl = await checkRateLimit(`order-poll:${session.user.id}`, RATE_LIMITS.orderPoll);
  if (!rl.success) {
    return rateLimitResponse(rl, "Muitas consultas. Aguarde um momento.");
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              category: true,
              imageUrl: true,
              shortDescription: true,
              durationDays: true,
              color: true,
            },
          },
        },
      },
      coupon: { select: { code: true, discount: true } },
      deliveries: { select: { status: true, kind: true, productName: true, requiresOnline: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  if (order.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const pending = order.status === "PENDING";
  const pixExpired = !!order.pixExpiresAt && order.pixExpiresAt.getTime() <= Date.now();

  return NextResponse.json({
    id: order.id,
    status: order.status,
    total: Number(order.total),
    // Cartão parcelado: parcelas e valor pago com juros (preenchidos na aprovação)
    installments: order.installments,
    paidAmount: order.paidAmount != null ? Number(order.paidAmount) : null,
    paymentMethod: order.paymentMethod,
    // "pix" quando o pedido nasceu com QR Code; "cartao" quando foi pelo Checkout Pro
    paymentKind: order.pixCode ? "pix" : order.checkoutUrl ? "cartao" : null,
    pix:
      pending && order.pixCode
        ? { code: order.pixCode, qrBase64: order.pixQrBase64, expiresAt: order.pixExpiresAt, expired: pixExpired }
        : null,
    checkoutUrl: pending ? order.checkoutUrl : null,
    coupon: order.coupon ? { code: order.coupon.code, discount: Number(order.coupon.discount) } : null,
    items: order.items.map((item) => ({
      id: item.id,
      product: item.product,
      quantity: item.quantity,
      price: Number(item.price),
      subtotal: Number(item.price) * item.quantity,
    })),
    delivery: {
      summary: summarizeDeliveries(order.deliveries),
      items: order.deliveries
        .filter((d) => d.kind === "DELIVER")
        .map((d) => ({ name: d.productName, status: d.status, requiresOnline: d.requiresOnline })),
    },
    paidAt: order.paidAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  });
}
