import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { sendContactConfirmationEmail } from "@/lib/email";
import { headers } from "next/headers";

const VALID_CATEGORIES = [
  "Dúvidas sobre aulas",
  "Problemas com conta",
  "Suporte técnico",
  "Parcerias",
  "Sugestões",
  "Outro",
];

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateCheck = checkRateLimit(`contact:${ip}`, RATE_LIMITS.contact);

    if (!rateCheck.success) {
      const retryAfter = Math.ceil((rateCheck.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Muitos envios recentes. Tente novamente mais tarde." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const body = await request.json();
    const { name, email, category, subject, message, honeypot } = body;

    // Anti-bot: se o campo honeypot foi preenchido, rejeitar silenciosamente
    if (honeypot) {
      return NextResponse.json({ success: true });
    }

    if (!name || !email || !category || !subject || !message) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios." },
        { status: 400 }
      );
    }

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: "Nome deve ter entre 2 e 100 caracteres." },
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

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: "Categoria inválida." },
        { status: 400 }
      );
    }

    if (message.length < 10 || message.length > 2000) {
      return NextResponse.json(
        { error: "Mensagem deve ter entre 10 e 2000 caracteres." },
        { status: 400 }
      );
    }

    await prisma.contactMessage.create({
      data: {
        name,
        email,
        category,
        subject,
        message,
      },
    });

    // Email de confirmação para o remetente (fire-and-forget)
    sendContactConfirmationEmail(email, name).catch((err) =>
      console.error("Erro ao enviar email de confirmação de contato:", err)
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Erro ao enviar mensagem de contato:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}
