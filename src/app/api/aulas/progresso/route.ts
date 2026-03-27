import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/aulas/progresso — retorna progresso do usuário por disciplina
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const progress = await prisma.userLessonProgress.findMany({
    where: { userId: session.user.id },
    select: {
      lessonId: true,
      completedAt: true,
      lesson: {
        select: {
          id: true,
          disciplineId: true,
          discipline: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
              icon: true,
            },
          },
        },
      },
    },
  });

  // Busca todas as disciplinas ativas com contagem de aulas
  const disciplines = await prisma.discipline.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      color: true,
      icon: true,
      _count: { select: { lessons: { where: { active: true } } } },
    },
  });

  // Conta aulas completadas por disciplina
  const completedByDiscipline: Record<string, string[]> = {};
  for (const p of progress) {
    const discId = p.lesson.disciplineId;
    if (!completedByDiscipline[discId]) completedByDiscipline[discId] = [];
    completedByDiscipline[discId].push(p.lessonId);
  }

  const result = disciplines.map((d) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    color: d.color,
    icon: d.icon,
    totalLessons: d._count.lessons,
    completedLessons: completedByDiscipline[d.id]?.length || 0,
  }));

  return NextResponse.json({ progress: result });
}

// POST /api/aulas/progresso — marcar/desmarcar aula como concluída (toggle)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { lessonId } = body;

  if (!lessonId || typeof lessonId !== "string") {
    return NextResponse.json(
      { error: "lessonId é obrigatório" },
      { status: 400 }
    );
  }

  // Verifica se a aula existe e está ativa
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId, active: true },
    select: { id: true, disciplineId: true },
  });

  if (!lesson) {
    return NextResponse.json(
      { error: "Aula não encontrada" },
      { status: 404 }
    );
  }

  // Toggle: se já completou, remove; se não, cria
  const existing = await prisma.userLessonProgress.findUnique({
    where: {
      userId_lessonId: {
        userId: session.user.id,
        lessonId,
      },
    },
  });

  if (existing) {
    await prisma.userLessonProgress.delete({
      where: { id: existing.id },
    });
    return NextResponse.json({ completed: false });
  }

  await prisma.userLessonProgress.create({
    data: {
      userId: session.user.id,
      lessonId,
    },
  });

  // Atualiza contador de aulas concluídas no perfil
  const completedCount = await prisma.userLessonProgress.count({
    where: { userId: session.user.id },
  });

  await prisma.profile.updateMany({
    where: { userId: session.user.id },
    data: { aulasConcluidas: completedCount },
  });

  return NextResponse.json({ completed: true });
}
