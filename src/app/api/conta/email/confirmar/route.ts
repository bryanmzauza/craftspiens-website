import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma-pg";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { verifyCode, isPlaceholderEmail } from "@/lib/email-verification";
import { sendEmailChangedNotice } from "@/lib/email";

const MESSAGES = {
  "sem-codigo": "Nenhum código pendente. Peça um novo código.",
  expirado: "O código expirou. Peça um novo código.",
  tentativas: "Muitas tentativas com este código. Peça um novo código.",
  incorreto: "Código incorreto.",
} as const;

// POST /api/conta/email/confirmar — confirma o código e passa a usar o novo e-mail
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const rateCheck = await checkRateLimit(`email-confirm:${session.user.id}`, RATE_LIMITS.emailConfirm);
  if (!rateCheck.success) {
    return rateLimitResponse(rateCheck, "Muitas tentativas. Aguarde alguns minutos.");
  }

  const body = await request.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code.replace(/\D/g, "") : "";
  if (code.length !== 6) {
    return NextResponse.json({ error: "Digite o código de 6 dígitos." }, { status: 400 });
  }

  const result = await verifyCode(session.user.id, code);
  if (!result.ok) {
    return NextResponse.json({ error: MESSAGES[result.reason] }, { status: 400 });
  }

  const before = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, emailVerifiedAt: true },
  });

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { email: result.email, emailVerifiedAt: new Date() },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Este e-mail já está em uso por outra conta." }, { status: 409 });
    }
    throw error;
  }

  // Avisa o e-mail anterior quando um e-mail já confirmado foi trocado
  if (before?.emailVerifiedAt && !isPlaceholderEmail(before.email) && before.email !== result.email) {
    sendEmailChangedNotice(before.email, session.user.username, result.email).catch((err) =>
      console.error("Erro ao enviar aviso de troca de e-mail:", err)
    );
  }

  return NextResponse.json({ success: true, email: result.email });
}
