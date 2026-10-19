import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logPanel, requirePanel } from "@/lib/painel/session";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// POST /api/painel/cronograma/copiar — { de, para } (início das semanas, ISO):
// copia as aulas não canceladas de uma semana para outra. Aulas iguais (mesmo
// nome e mesmo horário) que já existam no destino não são duplicadas.
export async function POST(request: Request) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;

  const body = await request.json().catch(() => ({}));
  const from = new Date(typeof body.de === "string" ? body.de : "");
  const to = new Date(typeof body.para === "string" ? body.para : "");
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from.getTime() === to.getTime()) {
    return NextResponse.json({ error: "Semanas inválidas." }, { status: 400 });
  }
  const shift = to.getTime() - from.getTime();
  if (Math.abs(shift) > 60 * WEEK_MS) return NextResponse.json({ error: "Semanas muito distantes." }, { status: 400 });

  const source = await prisma.scheduledClass.findMany({
    where: { startsAt: { gte: from, lt: new Date(from.getTime() + WEEK_MS) }, cancelled: false },
  });
  if (source.length === 0) {
    return NextResponse.json({ error: "A semana de origem não tem aulas." }, { status: 400 });
  }

  const existing = await prisma.scheduledClass.findMany({
    where: { startsAt: { gte: to, lt: new Date(to.getTime() + WEEK_MS) } },
    select: { title: true, startsAt: true },
  });
  const taken = new Set(existing.map((c) => `${c.title}|${c.startsAt.getTime()}`));

  const rows = source
    .map((c) => ({ ...c, startsAt: new Date(c.startsAt.getTime() + shift), endsAt: new Date(c.endsAt.getTime() + shift) }))
    .filter((c) => !taken.has(`${c.title}|${c.startsAt.getTime()}`))
    .map((c) => ({
      title: c.title,
      topic: null,
      description: c.description,
      teacher: c.teacher,
      level: c.level,
      color: c.color,
      location: c.location,
      disciplineId: c.disciplineId,
      startsAt: c.startsAt,
      endsAt: c.endsAt,
      createdBy: access.session.name,
    }));

  if (rows.length > 0) await prisma.scheduledClass.createMany({ data: rows });
  await logPanel(access.session, "aula.copiarSemana", null, {
    de: from.toISOString(),
    para: to.toISOString(),
    aulas: rows.length,
  });
  return NextResponse.json({ created: rows.length, skipped: source.length - rows.length });
}
