import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/forum/access";
import { canModerate } from "@/lib/forum/permissions";
import { notify } from "@/lib/forum/notifications";

// DELETE /api/forum/fotos — a moderação remove a foto de perfil de um membro: { userId }
// O membro é avisado e volta a aparecer com a skin do jogo; pode enviar outra foto.
export async function DELETE(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!canModerate(user.role)) {
    return NextResponse.json({ error: "Apenas a moderação pode remover fotos" }, { status: 403 });
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

  const { count } = await prisma.userPhoto.deleteMany({ where: { userId } });
  if (count > 0 && userId !== user.id) {
    await notify({
      userId,
      type: "MODERATION",
      actorId: user.id,
      message: "Sua foto de perfil foi removida pela moderação por não seguir as regras da comunidade",
    });
  }

  return NextResponse.json({ success: true, removed: count > 0 });
}
