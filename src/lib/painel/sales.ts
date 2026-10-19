// =============================================================================
// Painel: consulta de vendas (lista, detalhe e exportação)
// =============================================================================
// O comprador aparece pelo nick (nLogin) e pelo e-mail da conta. CPF, código
// Pix e dados de pagamento brutos nunca saem destas rotas.
import type { Prisma } from "@/generated/prisma-pg";
import { prisma } from "@/lib/prisma";
import { findNloginByUsername, getNloginMap } from "@/lib/nlogin";
import { summarizeDeliveries } from "@/lib/deliveries";

export const SALES_PAGE_SIZE = 25;
const STATUSES = new Set(["PENDING", "APPROVED", "REJECTED", "REFUNDED"]);
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Dia (AAAA-MM-DD) no fuso de São Paulo, que não tem horário de verão desde 2019 */
export function spDayStart(day: string): Date | null {
  if (!DAY_PATTERN.test(day)) return null;
  const date = new Date(`${day}T00:00:00-03:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Filtros da URL: status, q (nick, e-mail ou número do pedido), de, ate (dias) */
export async function salesWhere(params: URLSearchParams): Promise<Prisma.OrderWhereInput> {
  const where: Prisma.OrderWhereInput = {};
  const and: Prisma.OrderWhereInput[] = [];

  const status = params.get("status")?.toUpperCase() ?? "";
  if (STATUSES.has(status)) where.status = status as Prisma.OrderWhereInput["status"];

  const from = spDayStart(params.get("de") ?? "");
  const until = spDayStart(params.get("ate") ?? "");
  if (from || until) {
    where.createdAt = {
      ...(from ? { gte: from } : {}),
      ...(until ? { lt: new Date(until.getTime() + 24 * 60 * 60 * 1000) } : {}),
    };
  }

  const q = (params.get("q") ?? "").trim().slice(0, 100);
  if (q) {
    const or: Prisma.OrderWhereInput[] = [
      { id: q },
      { paymentId: q },
      { user: { email: { contains: q, mode: "insensitive" } } },
      { deliveries: { some: { username: { contains: q, mode: "insensitive" } } } },
      { coupon: { code: q.toUpperCase() } },
    ];
    if (/^[A-Za-z0-9_]{3,16}$/.test(q)) {
      const nlogin = await findNloginByUsername(q).catch(() => null);
      if (nlogin) or.push({ user: { nloginId: nlogin.id } });
    }
    and.push({ OR: or });
  }

  if (and.length > 0) where.AND = and;
  return where;
}

export const SALE_INCLUDE = {
  user: { select: { id: true, email: true, nloginId: true, displayName: true } },
  coupon: { select: { code: true, discount: true } },
  items: { select: { quantity: true, price: true, product: { select: { name: true, slug: true, category: true, color: true } } } },
  deliveries: { select: { status: true, kind: true, username: true } },
} satisfies Prisma.OrderInclude;

type SaleRow = Prisma.OrderGetPayload<{ include: typeof SALE_INCLUDE }>;

/** Lista no formato das telas, com o nick de cada comprador */
export async function toPanelSales(orders: SaleRow[]) {
  const nlogins = await getNloginMap(orders.map((o) => o.user.nloginId)).catch(() => null);
  return orders.map((order) => {
    const nick =
      nlogins?.get(order.user.nloginId)?.last_name ??
      order.deliveries.find((d) => d.username)?.username ??
      order.user.displayName ??
      null;
    return {
      id: order.id,
      status: order.status,
      total: Number(order.total),
      paidAmount: order.paidAmount != null ? Number(order.paidAmount) : null,
      installments: order.installments,
      paymentKind: order.pixCode ? "pix" : order.checkoutUrl ? "cartao" : null,
      paymentMethod: order.paymentMethod,
      coupon: order.coupon ? { code: order.coupon.code, discount: Number(order.coupon.discount) } : null,
      buyer: { id: order.user.id, nick, email: order.user.email },
      items: order.items.map((item) => ({
        name: item.product.name,
        slug: item.product.slug,
        category: item.product.category,
        color: item.product.color,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      delivery: summarizeDeliveries(order.deliveries),
      createdAt: order.createdAt,
      paidAt: order.paidAt,
    };
  });
}

export type PanelSale = Awaited<ReturnType<typeof toPanelSales>>[number];

export async function findSales(where: Prisma.OrderWhereInput, page: number) {
  const [orders, total, sums] = await Promise.all([
    prisma.order.findMany({
      where,
      include: SALE_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * SALES_PAGE_SIZE,
      take: SALES_PAGE_SIZE,
    }),
    prisma.order.count({ where }),
    prisma.order.aggregate({ where: { AND: [where, { status: "APPROVED" }] }, _sum: { total: true }, _count: { _all: true } }),
  ]);
  return {
    sales: await toPanelSales(orders),
    pagination: { page, total, totalPages: Math.max(Math.ceil(total / SALES_PAGE_SIZE), 1) },
    summary: { approvedCount: sums._count._all, approvedTotal: Number(sums._sum.total ?? 0) },
  };
}
