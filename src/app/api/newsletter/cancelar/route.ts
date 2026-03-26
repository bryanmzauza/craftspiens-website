import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token é obrigatório." },
        { status: 400 }
      );
    }

    const entry = await prisma.newsletter.findUnique({
      where: { confirmToken: token },
    });

    if (!entry) {
      return NextResponse.json(
        { error: "Token inválido." },
        { status: 400 }
      );
    }

    await prisma.newsletter.update({
      where: { id: entry.id },
      data: {
        confirmed: false,
        unsubscribedAt: new Date(),
        confirmToken: null,
      },
    });

    return NextResponse.json({
      message: "Inscrição cancelada com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao cancelar inscrição:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
