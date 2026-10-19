import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma-pg";
import { prisma } from "@/lib/prisma";
import { logPanel, requirePanel } from "@/lib/painel/session";
import { classSchema, parseBody } from "@/lib/painel/validation";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.intersection(classSchema, z.object({ scope: z.enum(["esta", "serie"]).default("esta") }));

/** Esta aula e as próximas da mesma série */
function seriesWhere(current: { id: string; seriesId: string | null; startsAt: Date }): Prisma.ScheduledClassWhereInput {
  return current.seriesId ? { seriesId: current.seriesId, startsAt: { gte: current.startsAt } } : { id: current.id };
}

// PUT /api/painel/cronograma/[id] — salva a aula; scope "serie" aplica a esta e
// às próximas da série, movendo todas pelo mesmo tanto se o horário mudou
export async function PUT(request: Request, { params }: Params) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;
  const { id } = await params;

  const current = await prisma.scheduledClass.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Aula não encontrada." }, { status: 404 });

  const parsed = await parseBody(request, updateSchema);
  if ("error" in parsed) return parsed.error;
  const { scope, ...input } = parsed.data;

  if (input.disciplineId && !(await prisma.discipline.findUnique({ where: { id: input.disciplineId }, select: { id: true } }))) {
    return NextResponse.json({ error: "Disciplina não encontrada.", field: "disciplineId" }, { status: 400 });
  }

  const fields = {
    title: input.title,
    topic: input.topic ?? null,
    description: input.description ?? null,
    teacher: input.teacher,
    level: input.level ?? null,
    color: input.color,
    location: input.location ?? null,
    disciplineId: input.disciplineId ?? null,
  };

  let updated = 1;
  if (scope === "serie" && current.seriesId) {
    const startShift = input.startsAt.getTime() - current.startsAt.getTime();
    const duration = input.endsAt.getTime() - input.startsAt.getTime();
    const targets = await prisma.scheduledClass.findMany({ where: seriesWhere(current), select: { id: true, startsAt: true } });
    await prisma.$transaction(
      targets.map((target) => {
        const startsAt = new Date(target.startsAt.getTime() + startShift);
        return prisma.scheduledClass.update({
          where: { id: target.id },
          data: { ...fields, startsAt, endsAt: new Date(startsAt.getTime() + duration) },
        });
      })
    );
    updated = targets.length;
  } else {
    await prisma.scheduledClass.update({
      where: { id },
      data: {
        ...fields,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        cancelled: input.cancelled,
        cancelReason: input.cancelled ? input.cancelReason ?? null : null,
      },
    });
  }

  await logPanel(access.session, "aula.editar", input.title, {
    aulas: updated,
    inicio: input.startsAt.toISOString(),
  });
  return NextResponse.json({ updated });
}

// PATCH /api/painel/cronograma/[id] — { acao: "cancelar", motivo? } | { acao: "reativar" }
export async function PATCH(request: Request, { params }: Params) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;
  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  if (body.acao !== "cancelar" && body.acao !== "reativar") {
    return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
  }
  const reason = typeof body.motivo === "string" ? body.motivo.trim().slice(0, 200) || null : null;

  const found = await prisma.scheduledClass.findUnique({ where: { id }, select: { id: true } });
  if (!found) return NextResponse.json({ error: "Aula não encontrada." }, { status: 404 });

  const cancelled = body.acao === "cancelar";
  const row = await prisma.scheduledClass.update({
    where: { id },
    data: { cancelled, cancelReason: cancelled ? reason : null },
  });
  await logPanel(access.session, cancelled ? "aula.cancelar" : "aula.reativar", row.title, {
    inicio: row.startsAt.toISOString(),
    ...(reason ? { motivo: reason } : {}),
  });
  return NextResponse.json({ ok: true });
}

// DELETE /api/painel/cronograma/[id]?escopo=serie — exclui a aula (ou ela e as próximas da série)
export async function DELETE(request: Request, { params }: Params) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;
  const { id } = await params;

  const current = await prisma.scheduledClass.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Aula não encontrada." }, { status: 404 });

  const series = new URL(request.url).searchParams.get("escopo") === "serie";
  const result = await prisma.scheduledClass.deleteMany({ where: series ? seriesWhere(current) : { id } });

  await logPanel(access.session, "aula.excluir", current.title, {
    aulas: result.count,
    inicio: current.startsAt.toISOString(),
  });
  return NextResponse.json({ deleted: result.count });
}
