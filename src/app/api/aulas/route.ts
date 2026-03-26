import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const busca = searchParams.get("busca") || "";
  const nivel = searchParams.get("nivel") || "";

  const where: Record<string, unknown> = { active: true };

  if (busca) {
    where.OR = [
      { name: { contains: busca } },
      { shortDescription: { contains: busca } },
    ];
  }

  if (nivel && nivel !== "Todos") {
    where.levels = { contains: nivel };
  }

  const disciplines = await prisma.discipline.findMany({
    where,
    include: {
      _count: { select: { lessons: { where: { active: true } } } },
    },
    orderBy: { order: "asc" },
  });

  const result = disciplines.map((d) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    description: d.description,
    shortDescription: d.shortDescription,
    icon: d.icon,
    color: d.color,
    levels: JSON.parse(d.levels),
    lessonsCount: d._count.lessons,
    order: d.order,
  }));

  return NextResponse.json({ disciplines: result });
}
