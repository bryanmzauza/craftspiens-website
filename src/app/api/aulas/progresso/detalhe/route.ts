import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/aulas/progresso/detalhe?disciplineId=xxx — retorna IDs das aulas completadas de uma disciplina
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const disciplineId = request.nextUrl.searchParams.get("disciplineId");
  if (!disciplineId) {
    return NextResponse.json(
      { error: "disciplineId é obrigatório" },
      { status: 400 }
    );
  }

  const progress = await prisma.userLessonProgress.findMany({
    where: {
      userId: session.user.id,
      lesson: { disciplineId },
    },
    select: { lessonId: true },
  });

  return NextResponse.json({
    completedLessonIds: progress.map((p) => p.lessonId),
  });
}
