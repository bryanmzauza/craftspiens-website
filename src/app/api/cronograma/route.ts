import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PUBLIC_CLASS_SELECT, getActiveNotice, parseRange, rangeWhere } from "@/lib/cronograma";

export const dynamic = "force-dynamic";

// GET /api/cronograma?inicio=&fim= — aulas ao vivo do intervalo (ISO) e o aviso em vigor
export async function GET(request: Request) {
  const range = parseRange(new URL(request.url).searchParams);
  if (!range) return NextResponse.json({ error: "Intervalo inválido." }, { status: 400 });

  const [classes, notice] = await Promise.all([
    prisma.scheduledClass.findMany({
      where: rangeWhere(range),
      orderBy: { startsAt: "asc" },
      select: PUBLIC_CLASS_SELECT,
    }),
    getActiveNotice(),
  ]);

  return NextResponse.json({ classes, notice });
}
