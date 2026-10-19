import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NOTICE_KEY } from "@/lib/cronograma";
import { logPanel, requirePanel } from "@/lib/painel/session";

// PUT /api/painel/cronograma/aviso — { texto, ate? }: aviso no topo de /cronograma
// (férias, recesso, mudança de horário). ate = último dia em que aparece (ISO).
export async function PUT(request: Request) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;

  const body = await request.json().catch(() => ({}));
  const text = typeof body.texto === "string" ? body.texto.trim() : "";
  if (text.length < 5 || text.length > 300) {
    return NextResponse.json({ error: "O aviso deve ter de 5 a 300 caracteres." }, { status: 400 });
  }
  let until: string | null = null;
  if (body.ate) {
    const date = new Date(body.ate);
    if (Number.isNaN(date.getTime())) return NextResponse.json({ error: "Data inválida." }, { status: 400 });
    until = date.toISOString();
  }

  const value = { text, until };
  await prisma.siteSetting.upsert({
    where: { key: NOTICE_KEY },
    create: { key: NOTICE_KEY, value, updatedBy: access.session.name },
    update: { value, updatedBy: access.session.name },
  });
  await logPanel(access.session, "aula.aviso", text.slice(0, 80), { ate: until });
  return NextResponse.json({ notice: value });
}

// DELETE /api/painel/cronograma/aviso — remove o aviso
export async function DELETE(request: Request) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;

  await prisma.siteSetting.deleteMany({ where: { key: NOTICE_KEY } });
  await logPanel(access.session, "aula.avisoRemovido", null);
  return NextResponse.json({ ok: true });
}
