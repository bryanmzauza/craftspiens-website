import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logPanel, requirePanel } from "@/lib/painel/session";
import { couponSchema, parseBody } from "@/lib/painel/validation";
import { approvedTotals, couponState, round2, toPanelCoupon } from "@/lib/painel/store";

export const dynamic = "force-dynamic";

// GET /api/painel/cupons — cupons com situação e vendas aprovadas
export async function GET(request: Request) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;

  const [coupons, totals] = await Promise.all([
    prisma.coupon.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { orders: true } } } }),
    approvedTotals(),
  ]);

  return NextResponse.json({
    coupons: coupons.map((coupon) => {
      const stats = totals.byCoupon.get(coupon.id);
      return {
        ...toPanelCoupon(coupon),
        state: couponState(coupon),
        locked: coupon._count.orders > 0,
        stats: {
          orders: stats?.orders ?? 0,
          revenue: round2(stats?.revenue ?? 0),
          discount: round2(stats?.discount ?? 0),
        },
      };
    }),
  });
}

// POST /api/painel/cupons — cria um cupom
export async function POST(request: Request) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;

  const parsed = await parseBody(request, couponSchema);
  if ("error" in parsed) return parsed.error;
  const input = parsed.data;

  if (await prisma.coupon.findUnique({ where: { code: input.code }, select: { id: true } })) {
    return NextResponse.json({ error: "Já existe um cupom com este código.", field: "code" }, { status: 409 });
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: input.code,
      discount: input.discount,
      maxUses: input.maxUses ?? null,
      expiresAt: input.expiresAt ?? null,
      active: input.active,
    },
  });

  await logPanel(access.session, "cupom.criar", coupon.code, {
    desconto: input.discount,
    limite: input.maxUses ?? null,
    validade: input.expiresAt?.toISOString() ?? null,
  });
  return NextResponse.json({ coupon: toPanelCoupon(coupon) }, { status: 201 });
}
