import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const discipline = await prisma.discipline.findUnique({
    where: { slug, active: true },
    include: {
      lessons: {
        where: { active: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          order: true,
          duration: true,
        },
      },
    },
  });

  if (!discipline) {
    return NextResponse.json(
      { error: "Disciplina não encontrada" },
      { status: 404 }
    );
  }

  const result = {
    id: discipline.id,
    name: discipline.name,
    slug: discipline.slug,
    description: discipline.description,
    shortDescription: discipline.shortDescription,
    icon: discipline.icon,
    color: discipline.color,
    banner: discipline.banner,
    levels: JSON.parse(discipline.levels),
    lessons: discipline.lessons,
    lessonsCount: discipline.lessons.length,
  };

  return NextResponse.json({ discipline: result });
}
