import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/forum/access";
import { canBan, canModerate } from "@/lib/forum/permissions";
import { BAN_MAX_DAYS, BAN_REASON_MAX, banExpiry, describeBan } from "@/lib/forum/ban";
import { notify } from "@/lib/forum/notifications";

// POST /api/forum/banimentos — suspende um usuário do fórum: { userId, dias: number | null, motivo }
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!canModerate(user.role)) {
    return NextResponse.json({ error: "Apenas a moderação pode suspender usuários" }, { status: 403 });
  }

  let body: { userId?: unknown; dias?: unknown; motivo?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const userId = typeof body.userId === "string" ? body.userId : "";
  const motivo = typeof body.motivo === "string" ? body.motivo.trim() : "";
  const dias = body.dias === null ? null : Number(body.dias);

  if (!userId || !motivo) {
    return NextResponse.json({ error: "Usuário e motivo são obrigatórios" }, { status: 400 });
  }
  if (motivo.length > BAN_REASON_MAX) {
    return NextResponse.json({ error: `Motivo deve ter no máximo ${BAN_REASON_MAX} caracteres` }, { status: 400 });
  }
  if (dias !== null && (!Number.isInteger(dias) || dias < 1 || dias > BAN_MAX_DAYS)) {
    return NextResponse.json(
      { error: `Duração deve ser de 1 a ${BAN_MAX_DAYS} dias, ou nula para permanente` },
      { status: 400 }
    );
  }
  if (userId === user.id) {
    return NextResponse.json({ error: "Não é possível suspender a si mesmo" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, deactivatedAt: true },
  });
  if (!target || target.deactivatedAt) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }
  if (!canBan(user.role, target.role)) {
    return NextResponse.json({ error: "Não é possível suspender membros da moderação" }, { status: 403 });
  }

  const until = banExpiry(dias);
  await prisma.user.update({
    where: { id: target.id },
    data: { forumBannedUntil: until, forumBanReason: motivo, forumBannedById: user.id },
  });

  await notify({
    userId: target.id,
    type: "MODERATION",
    actorId: user.id,
    message: `Você foi suspenso do fórum ${describeBan(until)}. Motivo: ${motivo}`.slice(0, 255),
  });

  return NextResponse.json({ success: true, until });
}

// DELETE /api/forum/banimentos — encerra a suspensão: { userId }
export async function DELETE(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!canModerate(user.role)) {
    return NextResponse.json({ error: "Apenas a moderação pode encerrar suspensões" }, { status: 403 });
  }

  let body: { userId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const userId = typeof body.userId === "string" ? body.userId : "";
  if (!userId) {
    return NextResponse.json({ error: "Usuário é obrigatório" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, forumBannedUntil: true } });
  if (!target) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: target.id },
    data: { forumBannedUntil: null, forumBanReason: null, forumBannedById: null },
  });

  if (target.forumBannedUntil) {
    await notify({
      userId: target.id,
      type: "MODERATION",
      actorId: user.id,
      message: "Sua suspensão do fórum foi encerrada. Você já pode participar de novo",
    });
  }

  return NextResponse.json({ success: true });
}
