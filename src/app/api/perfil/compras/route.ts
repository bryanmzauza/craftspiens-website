import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { summarizeDeliveries } from "@/lib/deliveries";

const PAGE_SIZE = 20;
const STATUSES = ["PENDING", "APPROVED", "REJECTED", "REFUNDED"] as const;
type Status = (typeof STATUSES)[number];

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status")?.toUpperCase();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const statusFilter = STATUSES.find((s) => s === status) as Status | undefined;

  const where = { userId: session.user.id, ...(statusFilter && { status: statusFilter }) };

  const [orders, total, totalApproved, planOrders] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: { name: true, slug: true, category: true, imageUrl: true, durationDays: true, color: true },
            },
          },
        },
        coupon: { select: { code: true, discount: true } },
        deliveries: { select: { status: true, kind: true, productName: true, requiresOnline: true } },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.order.count({ where }),
    prisma.order.aggregate({
      where: { userId: session.user.id, status: "APPROVED" },
      _sum: { total: true },
      _count: true,
    }),
    // Planos pagos, para calcular até quando cada um vale
    prisma.order.findMany({
      where: {
        userId: session.user.id,
        status: "APPROVED",
        items: { some: { product: { category: "VIP", durationDays: { not: null } } } },
      },
      select: {
        createdAt: true,
        paidAt: true,
        items: {
          where: { product: { category: "VIP", durationDays: { not: null } } },
          select: { product: { select: { name: true, slug: true, durationDays: true, color: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // O servidor acumula o tempo (uma renovação soma ao prazo que ainda falta),
  // por isso o cálculo segue a mesma regra, separado por família de plano.
  const plans = new Map<string, { name: string; color: string | null; expiresAt: Date }>();
  for (const order of planOrders) {
    const paidAt = order.paidAt ?? order.createdAt;
    for (const item of order.items) {
      const days = item.product.durationDays;
      if (!days) continue;
      const family = item.product.slug.startsWith("premium") ? "premium" : "vip";
      const current = plans.get(family);
      const base = current && current.expiresAt > paidAt ? current.expiresAt : paidAt;
      const expiresAt = new Date(base.getTime() + days * 86_400_000);
      plans.set(family, { name: family === "premium" ? "Premium" : "VIP", color: item.product.color, expiresAt });
    }
  }
  const now = Date.now();
  const activePlans = [...plans.values()]
    .filter((plan) => plan.expiresAt.getTime() > now)
    .map((plan) => ({ ...plan, expiresAt: plan.expiresAt.toISOString() }));

  return NextResponse.json({
    orders: orders.map((order) => ({
      id: order.id,
      status: order.status,
      total: Number(order.total),
      installments: order.installments,
      paidAmount: order.paidAmount != null ? Number(order.paidAmount) : null,
      paymentMethod: order.paymentMethod,
      paymentKind: order.pixCode ? "pix" : order.checkoutUrl ? "cartao" : null,
      pending: order.status === "PENDING",
      coupon: order.coupon ? { code: order.coupon.code, discount: Number(order.coupon.discount) } : null,
      items: order.items.map((item) => ({
        id: item.id,
        product: item.product,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      delivery: {
        summary: summarizeDeliveries(order.deliveries),
        items: order.deliveries
          .filter((d) => d.kind === "DELIVER")
          .map((d) => ({ name: d.productName, status: d.status, requiresOnline: d.requiresOnline })),
      },
      createdAt: order.createdAt,
      paidAt: order.paidAt,
    })),
    plans: activePlans,
    summary: {
      totalSpent: Number(totalApproved._sum.total || 0),
      totalOrders: total,
      approvedOrders: totalApproved._count,
    },
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  });
}
