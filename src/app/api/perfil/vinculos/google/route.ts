import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNloginById } from "@/lib/nlogin";

// DELETE /api/perfil/vinculos/google — remove o vínculo com o Google. Só é
// permitido se a conta tiver outra forma de entrar (nick com senha ou conta
// original/Bedrock pela Microsoft), para o usuário não perder o acesso.
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, nloginId: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const nlogin = await getNloginById(user.nloginId);
  const hasOtherLogin = !!nlogin && (!!nlogin.password || !!nlogin.mojang_id || !!nlogin.bedrock_id);
  if (!hasOtherLogin) {
    return NextResponse.json(
      { error: "Vincule um nick do Minecraft antes de remover o Google, senão você perde o acesso à conta." },
      { status: 400 }
    );
  }

  await prisma.linkedAccount.deleteMany({ where: { userId: user.id, provider: "google" } });
  return NextResponse.json({ success: true });
}
