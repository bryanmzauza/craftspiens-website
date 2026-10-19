import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logPanel, requirePanel } from "@/lib/painel/session";

type Params = { params: Promise<{ id: string }> };

// POST /api/painel/entregas/[id] — { acao: "reenviar" }: devolve à fila do plugin
// com as tentativas zeradas. Serve para entregas que falharam (ex.: plugin fora
// do ar) ou que ficaram presas em "Entregando".
export async function POST(request: Request, { params }: Params) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;
  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  if (body.acao !== "reenviar") return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });

  const delivery = await prisma.delivery.findUnique({ where: { id } });
  if (!delivery) return NextResponse.json({ error: "Entrega não encontrada." }, { status: 404 });
  if (delivery.status === "DELIVERED") {
    return NextResponse.json({ error: "Esta entrega já foi concluída." }, { status: 409 });
  }

  const updated = await prisma.delivery.updateMany({
    where: { id, status: { in: ["FAILED", "PENDING", "PROCESSING"] } },
    data: { status: "PENDING", attempts: 0, lastError: null, claimedBy: null, claimedAt: null },
  });
  if (updated.count === 0) return NextResponse.json({ error: "A entrega mudou de estado. Atualize a página." }, { status: 409 });

  await logPanel(access.session, "entrega.reenviar", `${delivery.productName} para ${delivery.username}`, {
    pedido: delivery.orderId,
    estadoAnterior: delivery.status,
  });
  return NextResponse.json({ ok: true });
}
