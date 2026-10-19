import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePanel } from "@/lib/painel/session";
import { SALE_INCLUDE, toPanelSales } from "@/lib/painel/sales";
import { dayKey, round2 } from "@/lib/painel/store";

export const dynamic = "force-dynamic";

const PERIODS = new Set([7, 30, 90]);
const DAY_MS = 24 * 60 * 60 * 1000;

type Totals = { revenue: number; orders: number; buyers: Set<string> };

function emptyTotals(): Totals {
  return { revenue: 0, orders: 0, buyers: new Set() };
}

/** Variação percentual; null quando não há base de comparação */
function change(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

// GET /api/painel/resumo?dias=7|30|90 — números da visão geral
export async function GET(request: Request) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;

  const requested = Number(new URL(request.url).searchParams.get("dias"));
  const days = PERIODS.has(requested) ? requested : 30;
  const now = Date.now();
  const start = new Date(now - days * DAY_MS);
  const previousStart = new Date(now - 2 * days * DAY_MS);

  const [paid, created, pending, refunds, recent, attention, activeCoupons, activeProducts, nextClasses, activity] =
    await Promise.all([
      // Aprovados (e os reembolsados depois, que também foram vendas) nos dois períodos
      prisma.order.findMany({
        where: { status: "APPROVED", paidAt: { gte: previousStart } },
        select: {
          userId: true,
          total: true,
          paidAt: true,
          pixCode: true,
          items: { select: { quantity: true, product: { select: { id: true, name: true, category: true, color: true } } } },
        },
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: { createdAt: { gte: start } },
        _count: { _all: true },
      }),
      prisma.order.aggregate({
        where: { status: "PENDING", OR: [{ pixExpiresAt: { gt: new Date() } }, { pixExpiresAt: null, createdAt: { gte: new Date(now - DAY_MS) } }] },
        _count: { _all: true },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: { status: "REFUNDED", updatedAt: { gte: start } },
        _count: { _all: true },
        _sum: { total: true },
      }),
      prisma.order.findMany({
        where: { status: "APPROVED" },
        include: SALE_INCLUDE,
        orderBy: { paidAt: "desc" },
        take: 8,
      }),
      prisma.delivery.count({
        where: {
          OR: [
            { status: "FAILED" },
            { status: "PROCESSING", claimedAt: { lt: new Date(now - 10 * 60 * 1000) } },
          ],
        },
      }),
      prisma.coupon.count({
        where: { active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      }),
      prisma.product.count({ where: { active: true } }),
      prisma.scheduledClass.findMany({
        where: { endsAt: { gte: new Date() }, cancelled: false },
        orderBy: { startsAt: "asc" },
        take: 4,
        select: { id: true, title: true, topic: true, teacher: true, color: true, startsAt: true, endsAt: true },
      }),
      prisma.panelLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    ]);

  const current = emptyTotals();
  const previous = emptyTotals();
  const daily = new Map<string, { revenue: number; orders: number }>();
  for (let i = days - 1; i >= 0; i--) daily.set(dayKey(new Date(now - i * DAY_MS)), { revenue: 0, orders: 0 });

  const categories = new Map<string, number>();
  const products = new Map<string, { name: string; color: string | null; category: string; revenue: number; sold: number }>();
  const methods = { pix: { orders: 0, revenue: 0 }, cartao: { orders: 0, revenue: 0 } };

  for (const order of paid) {
    const total = Number(order.total);
    const paidAt = order.paidAt!;
    const inCurrent = paidAt >= start;
    const bucket = inCurrent ? current : previous;
    bucket.revenue += total;
    bucket.orders += 1;
    bucket.buyers.add(order.userId);
    if (!inCurrent) continue;

    const day = daily.get(dayKey(paidAt));
    if (day) {
      day.revenue += total;
      day.orders += 1;
    }
    const method = order.pixCode ? methods.pix : methods.cartao;
    method.orders += 1;
    method.revenue += total;

    const units = order.items.reduce((sum, item) => sum + item.quantity, 0) || 1;
    for (const item of order.items) {
      const share = (total * item.quantity) / units;
      categories.set(item.product.category, (categories.get(item.product.category) ?? 0) + share);
      const entry = products.get(item.product.id) ?? {
        name: item.product.name,
        color: item.product.color,
        category: item.product.category,
        revenue: 0,
        sold: 0,
      };
      entry.revenue += share;
      entry.sold += item.quantity;
      products.set(item.product.id, entry);
    }
  }

  const createdCount = created.reduce((sum, row) => sum + row._count._all, 0);
  const approvedCreated = created.find((row) => row.status === "APPROVED")?._count._all ?? 0;

  return NextResponse.json({
    days,
    kpis: {
      revenue: round2(current.revenue),
      revenueChange: change(current.revenue, previous.revenue),
      orders: current.orders,
      ordersChange: change(current.orders, previous.orders),
      avgTicket: current.orders > 0 ? round2(current.revenue / current.orders) : 0,
      avgTicketChange: change(
        current.orders > 0 ? current.revenue / current.orders : 0,
        previous.orders > 0 ? previous.revenue / previous.orders : 0
      ),
      buyers: current.buyers.size,
      buyersChange: change(current.buyers.size, previous.buyers.size),
      // Pedidos criados no período que chegaram a ser pagos
      conversion: createdCount > 0 ? Math.round((approvedCreated / createdCount) * 1000) / 10 : null,
      createdOrders: createdCount,
    },
    daily: [...daily.entries()].map(([date, value]) => ({ date, revenue: round2(value.revenue), orders: value.orders })),
    categories: [...categories.entries()]
      .map(([category, revenue]) => ({ category, revenue: round2(revenue) }))
      .sort((a, b) => b.revenue - a.revenue),
    topProducts: [...products.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6)
      .map((p) => ({ ...p, revenue: round2(p.revenue) })),
    methods: {
      pix: { orders: methods.pix.orders, revenue: round2(methods.pix.revenue) },
      cartao: { orders: methods.cartao.orders, revenue: round2(methods.cartao.revenue) },
    },
    pending: { orders: pending._count._all, total: Number(pending._sum.total ?? 0) },
    refunds: { orders: refunds._count._all, total: Number(refunds._sum.total ?? 0) },
    attention,
    activeCoupons,
    activeProducts,
    recentSales: await toPanelSales(recent),
    nextClasses,
    activity,
  });
}
