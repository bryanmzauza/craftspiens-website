import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const busca = searchParams.get("busca")?.trim() || "";
  const area = searchParams.get("area") || "";

  const where: Record<string, unknown> = { active: true };

  if (busca) {
    where.OR = [
      { name: { contains: busca, mode: "insensitive" } },
      { shortDescription: { contains: busca, mode: "insensitive" } },
    ];
  }

  if (area && area !== "Todas") {
    where.area = area;
  }

  const [disciplines, totals] = await Promise.all([
    prisma.discipline.findMany({ where, orderBy: { order: "asc" } }),
    prisma.lesson.groupBy({
      by: ["disciplineId"],
      where: { active: true },
      _count: { _all: true },
      _sum: { duration: true },
    }),
  ]);

  const totalsById = new Map(totals.map((t) => [t.disciplineId, t]));

  const result = disciplines.map((d) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    description: d.description,
    shortDescription: d.shortDescription,
    icon: d.icon,
    color: d.color,
    area: d.area,
    lessonsCount: totalsById.get(d.id)?._count._all ?? 0,
    totalMinutes: totalsById.get(d.id)?._sum.duration ?? 0,
    order: d.order,
  }));

  return NextResponse.json({ disciplines: result });
}
