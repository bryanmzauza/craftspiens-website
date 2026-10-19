import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma-pg";
import { prisma } from "@/lib/prisma";
import { requirePanel } from "@/lib/painel/session";

export const dynamic = "force-dynamic";

// Reserva do plugin sem confirmação há mais tempo que isto é tratada como travada
const STUCK_MINUTES = 10;

function filterWhere(filter: string): Prisma.DeliveryWhereInput {
  const stuckBefore = new Date(Date.now() - STUCK_MINUTES * 60 * 1000);
  switch (filter) {
    case "atencao":
      return {
        OR: [
          { status: "FAILED" },
          { status: "PROCESSING", claimedAt: { lt: stuckBefore } },
          { status: "PENDING", requiresOnline: false, attempts: { gt: 0 }, lastError: { not: null } },
        ],
      };
    case "fila":
      return { status: { in: ["PENDING", "PROCESSING"] } };
    case "entregues":
      return { status: "DELIVERED" };
    default:
      return {};
  }
}

// GET /api/painel/entregas?filtro=atencao|fila|entregues|todas — fila do plugin da loja
export async function GET(request: Request) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;

  const filter = new URL(request.url).searchParams.get("filtro") ?? "atencao";
  const [deliveries, counts, attention] = await Promise.all([
    prisma.delivery.findMany({
      where: filterWhere(filter),
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        orderId: true,
        kind: true,
        status: true,
        productName: true,
        productSlug: true,
        category: true,
        username: true,
        platform: true,
        attempts: true,
        requiresOnline: true,
        claimedBy: true,
        claimedAt: true,
        deliveredBy: true,
        deliveredAt: true,
        lastError: true,
        createdAt: true,
      },
    }),
    prisma.delivery.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.delivery.count({ where: filterWhere("atencao") }),
  ]);

  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  const stuckBefore = Date.now() - STUCK_MINUTES * 60 * 1000;
  return NextResponse.json({
    deliveries: deliveries.map((d) => ({
      ...d,
      // Reservada pelo plugin e sem resposta: precisa de reenvio manual
      stuck: d.status === "PROCESSING" && !!d.claimedAt && d.claimedAt.getTime() < stuckBefore,
    })),
    counts: {
      atencao: attention,
      fila: (byStatus.PENDING ?? 0) + (byStatus.PROCESSING ?? 0),
      entregues: byStatus.DELIVERED ?? 0,
      falhas: byStatus.FAILED ?? 0,
    },
  });
}
