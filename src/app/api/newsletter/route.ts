import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendNewsletterConfirmationEmail } from "@/lib/email";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    const rateLimit = checkRateLimit(
      `newsletter:${ip}`,
      RATE_LIMITS.newsletter
    );
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente mais tarde." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
            ),
          },
        }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email é obrigatório." },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return NextResponse.json(
        { error: "Email inválido." },
        { status: 400 }
      );
    }

    const existing = await prisma.newsletter.findUnique({
      where: { email: emailLower },
    });

    if (existing) {
      if (existing.confirmed && !existing.unsubscribedAt) {
        return NextResponse.json({
          message: "Este email já está inscrito na newsletter!",
        });
      }

      // Se cancelou inscrição ou não confirmou, reenviar confirmação
      const confirmToken = crypto.randomBytes(32).toString("hex");

      await prisma.newsletter.update({
        where: { id: existing.id },
        data: {
          confirmToken,
          confirmed: false,
          unsubscribedAt: null,
        },
      });

      const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
      const confirmUrl = `${baseUrl}/newsletter/confirmar?token=${confirmToken}`;

      try {
        await sendNewsletterConfirmationEmail(emailLower, confirmUrl);
      } catch (emailError) {
        console.error("Erro ao enviar email de confirmação:", emailError);
      }

      return NextResponse.json({
        message:
          "Enviamos um email de confirmação. Verifique sua caixa de entrada.",
      });
    }

    const confirmToken = crypto.randomBytes(32).toString("hex");

    await prisma.newsletter.create({
      data: {
        email: emailLower,
        confirmToken,
      },
    });

    const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
    const confirmUrl = `${baseUrl}/newsletter/confirmar?token=${confirmToken}`;

    try {
      await sendNewsletterConfirmationEmail(emailLower, confirmUrl);
    } catch (emailError) {
      console.error("Erro ao enviar email de confirmação:", emailError);
    }

    return NextResponse.json(
      {
        message:
          "Enviamos um email de confirmação. Verifique sua caixa de entrada.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro na inscrição da newsletter:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
