import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 24;

// GET /api/aulas/recentes?limite=8 — últimos vídeos publicados no canal, um por vídeo
// (o mesmo vídeo pode estar em mais de uma disciplina)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requested = Number(searchParams.get("limite"));
  const limit = Number.isInteger(requested) && requested > 0 ? Math.min(requested, MAX_LIMIT) : DEFAULT_LIMIT;

  const lessons = await prisma.lesson.findMany({
    where: {
      active: true,
      youtubeId: { not: null },
      publishedAt: { not: null },
      discipline: { active: true, slug: { not: "servidor-comunidade" } },
    },
    orderBy: [{ publishedAt: "desc" }, { discipline: { order: "asc" } }],
    take: limit * 3,
    select: {
      id: true,
      title: true,
      slug: true,
      youtubeId: true,
      format: true,
      publishedAt: true,
      duration: true,
      discipline: { select: { name: true, slug: true, color: true } },
    },
  });

  const seen = new Set<string>();
  const result = [];
  for (const lesson of lessons) {
    if (!lesson.youtubeId || seen.has(lesson.youtubeId)) continue;
    seen.add(lesson.youtubeId);
    result.push(lesson);
    if (result.length === limit) break;
  }

  return NextResponse.json({ lessons: result });
}
