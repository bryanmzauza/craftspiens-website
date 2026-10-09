import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getNloginById } from "@/lib/nlogin";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";
import { siteUrl } from "@/lib/env";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request.headers);

    const rateLimit = await checkRateLimit(
      `password-reset:${ip}`,
      RATE_LIMITS.passwordReset
    );
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit, "Muitas tentativas. Tente novamente mais tarde.");
    }

    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email é obrigatório." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email inválido." },
        { status: 400 }
      );
    }

    // Resposta genérica independente do resultado (anti-enumeração)
    const genericResponse = NextResponse.json({
      message:
        "Se o email estiver cadastrado, enviaremos instruções para recuperação de senha.",
    });

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return genericResponse;
    }

    const nlogin = await getNloginById(user.nloginId);
    if (!nlogin) {
      return genericResponse;
    }

    // Invalidar tokens anteriores não usados
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });

    // Gerar token (64 chars hex = 32 bytes)
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
      },
    });

    const resetUrl = `${siteUrl()}/redefinir-senha?token=${rawToken}`;

    try {
      await sendPasswordResetEmail(
        user.email,
        nlogin.last_name,
        resetUrl
      );
    } catch (emailError) {
      console.error("Erro ao enviar email de recuperação:", emailError);
      // Não expor erro de email ao usuário
    }

    return genericResponse;
  } catch (error) {
    console.error("Erro na recuperação de senha:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
