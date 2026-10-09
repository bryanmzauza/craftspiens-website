import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, prismaMariaDb } from "@/lib/prisma";
import { nloginVerifyPassword } from "@/lib/nlogin-algorithms";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const rateCheck = await checkRateLimit(`account-delete:${session.user.id}`, RATE_LIMITS.accountDelete);
  if (!rateCheck.success) {
    return rateLimitResponse(rateCheck, "Muitas tentativas. Tente novamente mais tarde.");
  }

  const body = await request.json().catch(() => ({}));
  const { confirmation, password } = body as { confirmation?: unknown; password?: unknown };

  if (typeof confirmation !== "string" || typeof password !== "string" || !confirmation || !password) {
    return NextResponse.json({ error: "Confirmação e senha são obrigatórios." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, nloginId: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const nlogin = await prismaMariaDb.nlogin.findFirst({
    where: { id: user.nloginId },
    select: { last_name: true, password: true },
  });

  if (!nlogin) {
    return NextResponse.json({ error: "Erro ao verificar credenciais." }, { status: 400 });
  }

  const expectedConfirmation = `${nlogin.last_name} CONFIRMAR`;
  if (confirmation !== expectedConfirmation) {
    return NextResponse.json({ error: "Texto de confirmação incorreto." }, { status: 400 });
  }

  // Verificar senha atual
  if (!nlogin.password) {
    return NextResponse.json({ error: "Erro ao verificar credenciais." }, { status: 400 });
  }

  const passwordValid = await nloginVerifyPassword(password, nlogin.password);
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
