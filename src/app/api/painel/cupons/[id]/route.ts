import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logPanel, requirePanel } from "@/lib/painel/session";
import { couponSchema, parseBody } from "@/lib/painel/validation";
import { toPanelCoupon } from "@/lib/painel/store";

type Params = { params: Promise<{ id: string }> };

// PUT /api/painel/cupons/[id] — salva o formulário do cupom
export async function PUT(request: Request, { params }: Params) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;
  const { id } = await params;

  const current = await prisma.coupon.findUnique({ where: { id }, include: { _count: { select: { orders: true } } } });
  if (!current) return NextResponse.json({ error: "Cupom não encontrado." }, { status: 404 });

  const parsed = await parseBody(request, couponSchema);
  if ("error" in parsed) return parsed.error;
  const input = parsed.data;

  if (input.code !== current.code) {
    if (current._count.orders > 0) {
      return NextResponse.json(
        { error: "Este cupom já foi usado em pedidos: o código não pode mudar. Crie um cupom novo.", field: "code" },
        { status: 409 }
      );
    }
    if (await prisma.coupon.findUnique({ where: { code: input.code }, select: { id: true } })) {
      return NextResponse.json({ error: "Já existe um cupom com este código.", field: "code" }, { status: 409 });
    }
  }

  const coupon = await prisma.coupon.update({
    where: { id },
    data: {
      code: input.code,
      discount: input.discount,
      maxUses: input.maxUses ?? null,
      expiresAt: input.expiresAt ?? null,
      active: input.active,
    },
  });

  await logPanel(access.session, "cupom.editar", coupon.code, {
    desconto: input.discount,
    limite: input.maxUses ?? null,
    validade: input.expiresAt?.toISOString() ?? null,
    ativo: input.active,
  });
  return NextResponse.json({ coupon: toPanelCoupon(coupon) });
}

// PATCH /api/painel/cupons/[id] — { acao: "ativo", valor }: liga ou desliga
export async function PATCH(request: Request, { params }: Params) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;
  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  if (body.acao !== "ativo" || typeof body.valor !== "boolean") {
    return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
  }

  const found = await prisma.coupon.findUnique({ where: { id }, select: { id: true } });
  if (!found) return NextResponse.json({ error: "Cupom não encontrado." }, { status: 404 });

  const coupon = await prisma.coupon.update({ where: { id }, data: { active: body.valor } });
  await logPanel(access.session, body.valor ? "cupom.ativar" : "cupom.desativar", coupon.code);
  return NextResponse.json({ coupon: toPanelCoupon(coupon) });
}

// DELETE /api/painel/cupons/[id] — só cupons que nunca entraram em um pedido
export async function DELETE(request: Request, { params }: Params) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;
  const { id } = await params;

  const coupon = await prisma.coupon.findUnique({ where: { id }, include: { _count: { select: { orders: true } } } });
  if (!coupon) return NextResponse.json({ error: "Cupom não encontrado." }, { status: 404 });
  if (coupon._count.orders > 0) {
    return NextResponse.json(
      { error: "Este cupom já foi usado em pedidos e não pode ser excluído. Desative-o." },
      { status: 409 }
    );
  }

  await prisma.coupon.delete({ where: { id } });
  await logPanel(access.session, "cupom.excluir", coupon.code);
  return NextResponse.json({ ok: true });
}
