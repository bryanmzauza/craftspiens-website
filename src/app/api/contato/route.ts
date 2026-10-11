import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";
import { sendContactConfirmationEmail, sendContactToTeam } from "@/lib/email";

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
    const ip = getClientIp(request.headers);
    const rateCheck = await checkRateLimit(`contact:${ip}`, RATE_LIMITS.contact);

    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck, "Muitos envios recentes. Tente novamente mais tarde.");
    }

    const body = await request.json().catch(() => ({}));
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

    if ([name, email, category, subject, message].some((field) => typeof field !== "string")) {
      return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
    }

    if (subject.trim().length < 3 || subject.length > 150) {
      return NextResponse.json(
        { error: "Assunto deve ter entre 3 e 150 caracteres." },
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

    // Cópia para a caixa da equipe (CONTACT_INBOX), com resposta direta ao remetente
    sendContactToTeam({ name, email, category, subject, message }).catch((err) =>
      console.error("Erro ao encaminhar mensagem de contato para a equipe:", err)
    );

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
