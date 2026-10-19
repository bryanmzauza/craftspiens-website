import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePanel } from "@/lib/painel/session";
import { SALE_INCLUDE, toPanelSales } from "@/lib/painel/sales";

type Params = { params: Promise<{ id: string }> };

// GET /api/painel/vendas/[id] — pedido com as entregas (para a gaveta de detalhes)
export async function GET(request: Request, { params }: Params) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;
  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id }, include: SALE_INCLUDE });
  if (!order) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });

  const [[sale], deliveries, buyerOrders] = await Promise.all([
    toPanelSales([order]),
    prisma.delivery.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        kind: true,
        status: true,
        productName: true,
        username: true,
        platform: true,
        attempts: true,
        requiresOnline: true,
        claimedBy: true,
        deliveredBy: true,
        deliveredAt: true,
        lastError: true,
        createdAt: true,
      },
    }),
    prisma.order.aggregate({
      where: { userId: order.userId, status: "APPROVED" },
      _count: { _all: true },
      _sum: { total: true },
    }),
  ]);

  return NextResponse.json({
    sale,
    paymentId: order.paymentId,
    pixExpiresAt: order.pixExpiresAt,
    updatedAt: order.updatedAt,
    deliveries,
    buyerHistory: { orders: buyerOrders._count._all, total: Number(buyerOrders._sum.total ?? 0) },
  });
}
