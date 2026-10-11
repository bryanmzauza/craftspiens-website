import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNloginById, verifyPassword } from "@/lib/nlogin";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { createVerificationCode, isPlaceholderEmail } from "@/lib/email-verification";
import { sendEmailVerificationCode } from "@/lib/email";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/conta/email/enviar — envia um código de 6 dígitos para o e-mail informado.
// O e-mail da conta só muda quando o código é confirmado.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const rateCheck = await checkRateLimit(`email-code:${session.user.id}`, RATE_LIMITS.emailCode);
  if (!rateCheck.success) {
    return rateLimitResponse(rateCheck, "Muitos códigos pedidos. Aguarde alguns minutos para pedir outro.");
  }

  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_REGEX.test(email) || email.length > 255 || isPlaceholderEmail(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, emailVerifiedAt: true, nloginId: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const nlogin = await getNloginById(user.nloginId);
  const alreadyVerified = !!user.emailVerifiedAt && !isPlaceholderEmail(user.email);

  if (alreadyVerified && email === user.email) {
    return NextResponse.json({ error: "Este já é o e-mail confirmado da sua conta." }, { status: 400 });
  }

  // Trocar um e-mail já confirmado permite recuperar a senha por ele: exige a senha do jogo
  if (alreadyVerified && nlogin?.password) {
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    if (!currentPassword || !(await verifyPassword(currentPassword, nlogin.password))) {
      return NextResponse.json({ error: "Senha atual incorreta." }, { status: 403 });
    }
  }

  const inUse = await prisma.user.findFirst({
    where: { email, id: { not: user.id } },
    select: { id: true },
  });
  if (inUse) {
    return NextResponse.json({ error: "Este e-mail já está em uso por outra conta." }, { status: 409 });
  }

  const code = await createVerificationCode(user.id, email);

  try {
    await sendEmailVerificationCode(email, session.user.username, code);
  } catch (error) {
    console.error("[email] Falha ao enviar o código de verificação:", error);
    // Em desenvolvimento o código aparece no terminal, para testar sem SMTP
    if (process.env.NODE_ENV !== "production") {
      console.info(`[dev] Código de verificação para ${email}: ${code}`);
      return NextResponse.json({ success: true, devCodeInTerminal: true });
    }
    return NextResponse.json(
      { error: "Não foi possível enviar o e-mail agora. Tente novamente em alguns minutos." },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
