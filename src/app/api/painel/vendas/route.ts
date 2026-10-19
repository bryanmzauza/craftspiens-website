import { NextResponse } from "next/server";
import { requirePanel } from "@/lib/painel/session";
import { findSales, salesWhere } from "@/lib/painel/sales";

export const dynamic = "force-dynamic";

// GET /api/painel/vendas?status=&q=&de=&ate=&pagina= — pedidos com filtros
export async function GET(request: Request) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;

  const params = new URL(request.url).searchParams;
  const page = Math.min(Math.max(Number(params.get("pagina")) || 1, 1), 10_000);
  const where = await salesWhere(params);
  return NextResponse.json(await findSales(where, page));
}
