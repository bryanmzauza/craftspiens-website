import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNotice, parseRange, rangeWhere } from "@/lib/cronograma";
import { logPanel, requirePanel } from "@/lib/painel/session";
import { classSchema, parseBody } from "@/lib/painel/validation";
import { z } from "zod";

export const dynamic = "force-dynamic";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// GET /api/painel/cronograma?inicio=&fim= — aulas do intervalo, disciplinas,
// professores já usados (sugestões do formulário) e o aviso
export async function GET(request: Request) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;

  const range = parseRange(new URL(request.url).searchParams);
  if (!range) return NextResponse.json({ error: "Intervalo inválido." }, { status: 400 });

  const [classes, disciplines, teachers, notice] = await Promise.all([
    prisma.scheduledClass.findMany({
      where: rangeWhere(range),
      orderBy: { startsAt: "asc" },
      include: { discipline: { select: { name: true, slug: true } } },
    }),
    prisma.discipline.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true, color: true, levels: true },
    }),
    prisma.scheduledClass.groupBy({ by: ["teacher"], _count: { _all: true }, orderBy: { _count: { teacher: "desc" } }, take: 30 }),
    getNotice(),
  ]);

  // Quantas aulas da mesma série ainda vêm pela frente (para o "editar a série")
  const seriesIds = [...new Set(classes.map((c) => c.seriesId).filter((id): id is string => !!id))];
  const series = seriesIds.length
    ? await prisma.scheduledClass.groupBy({ by: ["seriesId"], where: { seriesId: { in: seriesIds } }, _count: { _all: true } })
    : [];
  const seriesSize = new Map(series.map((s) => [s.seriesId, s._count._all]));

  return NextResponse.json({
    classes: classes.map((c) => ({ ...c, seriesSize: c.seriesId ? seriesSize.get(c.seriesId) ?? 1 : 1 })),
    disciplines,
    teachers: teachers.map((t) => t.teacher),
    notice,
  });
}

const createSchema = z.intersection(classSchema, z.object({ repeatWeeks: z.coerce.number().int().min(1).max(26).default(1) }));

// POST /api/painel/cronograma — cria a aula; com repeatWeeks > 1, uma por semana na mesma série
export async function POST(request: Request) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;

  const parsed = await parseBody(request, createSchema);
  if ("error" in parsed) return parsed.error;
  const { repeatWeeks, ...input } = parsed.data;

  if (input.disciplineId && !(await prisma.discipline.findUnique({ where: { id: input.disciplineId }, select: { id: true } }))) {
    return NextResponse.json({ error: "Disciplina não encontrada.", field: "disciplineId" }, { status: 400 });
  }

  const seriesId = repeatWeeks > 1 ? crypto.randomUUID() : null;
  const rows = Array.from({ length: repeatWeeks }, (_, week) => ({
    title: input.title,
    topic: input.topic ?? null,
    description: input.description ?? null,
    teacher: input.teacher,
    level: input.level ?? null,
    color: input.color,
    location: input.location ?? null,
    disciplineId: input.disciplineId ?? null,
    startsAt: new Date(input.startsAt.getTime() + week * WEEK_MS),
    endsAt: new Date(input.endsAt.getTime() + week * WEEK_MS),
    cancelled: input.cancelled,
    cancelReason: input.cancelled ? input.cancelReason ?? null : null,
    seriesId,
    createdBy: access.session.name,
  }));
  await prisma.scheduledClass.createMany({ data: rows });

  await logPanel(access.session, "aula.criar", input.title, {
    professor: input.teacher,
    inicio: input.startsAt.toISOString(),
    semanas: repeatWeeks,
  });
  return NextResponse.json({ created: rows.length }, { status: 201 });
}
