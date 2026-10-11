import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma, prismaMariaDb } from "@/lib/prisma";
import { hashPassword } from "@/lib/nlogin";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";

export async function POST(request: Request) {
  try {
    const rateCheck = await checkRateLimit(
      `password-reset-confirm:${getClientIp(request.headers)}`,
      RATE_LIMITS.passwordResetConfirm
    );
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck, "Muitas tentativas. Tente novamente mais tarde.");
    }

    const body = await request.json().catch(() => ({}));
    const { token, password, confirmPassword } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token é obrigatório." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Nova senha é obrigatória." },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { error: "A senha deve ter entre 8 e 128 caracteres." },
        { status: 400 }
      );
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "A senha deve conter pelo menos 1 letra e 1 número." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "As senhas não coincidem." },
        { status: 400 }
      );
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Reivindica o token de forma atômica: duas requisições simultâneas
    // com o mesmo link não conseguem usá-lo ao mesmo tempo
    const now = new Date();
    const claimed = await prisma.passwordResetToken.updateMany({
      where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });

    if (claimed.count !== 1) {
      return NextResponse.json(
        { error: "Link inválido, expirado ou já utilizado. Solicite um novo link de recuperação." },
        { status: 400 }
      );
    }

    const resetToken = await prisma.passwordResetToken.findUniqueOrThrow({
      where: { tokenHash },
      include: { user: true },
    });

    // Conta sem nick vinculado (criada pelo Google) não tem senha do jogo
    const nloginId = resetToken.user.nloginId;
    if (nloginId == null) {
      return NextResponse.json(
        { error: "Esta conta entra pelo Google e não tem senha. Use o botão Entrar com Google." },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(password);

    // Atualizar senha no nLogin (MariaDB); se falhar, libera o token de novo
    try {
      await prismaMariaDb.nlogin.update({
        where: { id: nloginId },
        data: { password: newHash },
      });
    } catch (error) {
      await prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: null },
      });
      throw error;
    }

    // Invalida os outros links pendentes e encerra as sessões abertas
    await prisma.$transaction([
      prisma.passwordResetToken.updateMany({
        where: { userId: resetToken.userId, usedAt: null },
        data: { usedAt: now },
      }),
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { sessionVersion: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({
      message: "Senha redefinida com sucesso! Faça login com sua nova senha.",
    });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
