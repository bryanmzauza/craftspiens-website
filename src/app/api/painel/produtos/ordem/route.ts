import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logPanel, requirePanel } from "@/lib/painel/session";

// POST /api/painel/produtos/ordem — { ids: [...] }: ordem de exibição na loja
export async function POST(request: Request) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;

  const body = await request.json().catch(() => ({}));
  const ids: unknown = body.ids;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500 || !ids.every((id) => typeof id === "string")) {
    return NextResponse.json({ error: "Lista inválida." }, { status: 400 });
  }

  await prisma.$transaction(
    (ids as string[]).map((id, index) => prisma.product.updateMany({ where: { id }, data: { order: (index + 1) * 10 } }))
  );
  await logPanel(access.session, "produto.ordem", null, { produtos: ids.length });
  return NextResponse.json({ ok: true });
}
