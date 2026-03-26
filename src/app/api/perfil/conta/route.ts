import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nloginVerifyPassword } from "@/lib/nlogin-algorithms";

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { confirmation, password } = body as { confirmation?: string; password?: string };

  if (!confirmation || !password) {
    return NextResponse.json({ error: "Confirmação e senha são obrigatórios." }, { status: 400 });
  }

  // Verificar que a confirmação está correta (username + " CONFIRMAR")
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { nlogin: { select: { last_name: true, password: true } } },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const expectedConfirmation = `${user.nlogin.last_name} CONFIRMAR`;
  if (confirmation !== expectedConfirmation) {
    return NextResponse.json({ error: "Texto de confirmação incorreto." }, { status: 400 });
  }

  // Verificar senha atual
  if (!user.nlogin.password) {
    return NextResponse.json({ error: "Erro ao verificar credenciais." }, { status: 400 });
  }

  const passwordValid = await nloginVerifyPassword(password, user.nlogin.password);
  if (!passwordValid) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 403 });
  }

  // Deletar dados do site (Profile → User) mantendo dados do nLogin/Minecraft
  await prisma.$transaction([
    prisma.profile.deleteMany({ where: { userId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);

  return NextResponse.json({ message: "Conta excluída com sucesso." });
}
