import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token de confirmação é obrigatório." },
        { status: 400 }
      );
    }

    const entry = await prisma.newsletter.findUnique({
      where: { confirmToken: token },
    });

    if (!entry) {
      return NextResponse.json(
        { error: "Token inválido ou já utilizado." },
        { status: 400 }
      );
    }

    if (entry.confirmed && !entry.unsubscribedAt) {
      return NextResponse.json({
        message: "Este email já está confirmado!",
      });
    }

    await prisma.newsletter.update({
      where: { id: entry.id },
      data: {
        confirmed: true,
        unsubscribedAt: null,
      },
    });

    return NextResponse.json({
      message: "Inscrição confirmada com sucesso!",
    });
  } catch (error) {
    console.error("Erro na confirmação da newsletter:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
