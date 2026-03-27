import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; lessonSlug: string }> }
) {
  const { slug, lessonSlug } = await params;

  const discipline = await prisma.discipline.findUnique({
    where: { slug, active: true },
    select: { id: true, name: true, slug: true, color: true, icon: true },
  });

  if (!discipline) {
    return NextResponse.json(
      { error: "Disciplina não encontrada" },
      { status: 404 }
    );
  }

  const lesson = await prisma.lesson.findFirst({
    where: {
      slug: lessonSlug,
      disciplineId: discipline.id,
      active: true,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      content: true,
      videoUrl: true,
      objectives: true,
      order: true,
      duration: true,
    },
  });

  if (!lesson) {
    return NextResponse.json(
      { error: "Aula não encontrada" },
      { status: 404 }
    );
  }

  // Busca aulas anterior e próxima para navegação
  const [prev, next] = await Promise.all([
    prisma.lesson.findFirst({
      where: {
        disciplineId: discipline.id,
        active: true,
        order: { lt: lesson.order },
      },
      orderBy: { order: "desc" },
      select: { title: true, slug: true },
    }),
    prisma.lesson.findFirst({
      where: {
        disciplineId: discipline.id,
        active: true,
        order: { gt: lesson.order },
      },
      orderBy: { order: "asc" },
      select: { title: true, slug: true },
    }),
  ]);

  // Verifica se o usuário logado já completou esta aula
  let completed = false;
  const session = await auth();
  if (session?.user?.id) {
    const progress = await prisma.userLessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: lesson.id,
        },
      },
    });
    completed = !!progress;
  }

  // Conta total de aulas na disciplina para contexto
  const totalLessons = await prisma.lesson.count({
    where: { disciplineId: discipline.id, active: true },
  });

  return NextResponse.json({
    lesson: {
      ...lesson,
      objectives: lesson.objectives ? JSON.parse(lesson.objectives) : [],
    },
    discipline,
    navigation: { prev, next },
    totalLessons,
    completed,
  });
}
