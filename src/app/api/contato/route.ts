import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Erro ao enviar mensagem de contato:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}
