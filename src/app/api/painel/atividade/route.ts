import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePanel } from "@/lib/painel/session";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

// GET /api/painel/atividade?pagina=&tipo=produto|cupom|aula|entrega|acesso — registro do painel
export async function GET(request: Request) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;

  const params = new URL(request.url).searchParams;
  const page = Math.min(Math.max(Number(params.get("pagina")) || 1, 1), 1000);
  const type = params.get("tipo") ?? "";
  const where = /^[a-z]{3,20}$/.test(type) ? { action: { startsWith: `${type}.` } } : {};

  const [logs, total] = await Promise.all([
    prisma.panelLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.panelLog.count({ where }),
  ]);

  return NextResponse.json({
    logs,
    pagination: { page, total, totalPages: Math.max(Math.ceil(total / PAGE_SIZE), 1) },
  });
}
