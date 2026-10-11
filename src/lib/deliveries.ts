// =============================================================================
// Entregas no servidor Minecraft
// =============================================================================
// Quando um pagamento é aprovado, cada item do pedido vira uma entrega: o que
// foi comprado (slug, categoria, quantidade, duração) e para quem (nick, UUID,
// edição Java ou Bedrock). O plugin da loja, no lobby, busca as entregas
// pendentes, decide e executa os comandos e confirma o resultado
// (docs/plugin-entregas.md). O site não escreve nada no banco do servidor.
import crypto from "crypto";
import type { Prisma } from "@/generated/prisma-pg";
import { prisma } from "@/lib/prisma";
import { getEnv } from "@/lib/env";
import type { GameAccount } from "@/lib/game-account";

// Nome do servidor como configurado no plugin (server-name)
export const SERVER_NAME_PATTERN = /^[a-z0-9_-]{1,50}$/i;

// Depois de tantas falhas a entrega para de ser tentada e fica para revisão manual
const MAX_ATTEMPTS = 5;
// Entrega buscada pelo plugin e nunca confirmada volta para a fila
const STALE_CLAIM_MINUTES = 10;

type OrderForDelivery = {
  id: string;
  userId: string;
  items: {
    id: string;
    quantity: number;
    product: {
      slug: string;
      name: string;
      category: Prisma.DeliveryCreateManyInput["category"];
      durationDays: number | null;
    };
  }[];
};

/** Uma entrega por item do pedido */
export function buildDeliveryRows(
  order: OrderForDelivery,
  account: GameAccount,
  kind: "DELIVER" | "REVOKE"
): Prisma.DeliveryCreateManyInput[] {
  return order.items.map((item) => ({
    orderId: order.id,
    orderItemId: item.id,
    userId: order.userId,
    nloginId: account.nloginId,
    username: account.username,
    uuid: account.uuid,
    platform: account.platform,
    mojangId: account.mojangId,
    bedrockId: account.bedrockId,
    kind,
    productSlug: item.product.slug,
    productName: item.product.name,
    category: item.product.category,
    quantity: item.quantity,
    durationDays: item.product.durationDays,
  }));
}

export type ClaimedDelivery = {
  id: string;
  order_id: string;
  username: string;
  uuid: string;
  platform: "JAVA" | "BEDROCK";
  mojang_id: string | null;
  bedrock_id: string | null;
  kind: "DELIVER" | "REVOKE";
  product_slug: string;
  product_name: string;
  category: string;
  quantity: number;
  duration_days: number | null;
  requires_online: boolean;
  attempts: number;
  created_at: Date;
};

/**
 * Reserva entregas pendentes para o plugin. A reserva é atômica (FOR UPDATE
 * SKIP LOCKED): duas instâncias nunca recebem a mesma entrega. Entregas que o
 * plugin adiou até o jogador entrar (requires_online) só saem quando o UUID
 * dele está em `onlineUuids`.
 */
export async function claimDeliveries(server: string, onlineUuids: string[], limit: number) {
  await prisma.$executeRaw`
    UPDATE deliveries SET status = 'PENDING', updated_at = now()
    WHERE status = 'PROCESSING'
      AND claimed_at < now() - (${STALE_CLAIM_MINUTES}::int * interval '1 minute')
  `;

  const uuids = onlineUuids.map((uuid) => uuid.toLowerCase());
  return prisma.$queryRaw<ClaimedDelivery[]>`
    WITH escolhidas AS (
      SELECT id FROM deliveries
      WHERE status = 'PENDING'
        AND (requires_online = false OR uuid = ANY(${uuids}::text[]))
      ORDER BY created_at
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    UPDATE deliveries d
    SET status = 'PROCESSING', claimed_by = ${server}, claimed_at = now(),
        attempts = d.attempts + 1, updated_at = now()
    FROM escolhidas
    WHERE d.id = escolhidas.id
    RETURNING d.id, d.order_id, d.username, d.uuid, d.platform::text AS platform, d.mojang_id,
              d.bedrock_id, d.kind::text AS kind, d.product_slug, d.product_name,
              d.category::text AS category, d.quantity, d.duration_days, d.requires_online,
              d.attempts, d.created_at
  `;
}

/** Formato enviado ao plugin */
export function toPluginDelivery(row: ClaimedDelivery) {
  return {
    id: row.id,
    pedido: row.order_id,
    tipo: row.kind === "REVOKE" ? "estorno" : "entrega",
    jogador: {
      nick: row.username,
      uuid: row.uuid,
      plataforma: row.platform === "BEDROCK" ? "bedrock" : "java",
      mojangId: row.mojang_id,
      bedrockId: row.bedrock_id,
    },
    produto: {
      slug: row.product_slug,
      nome: row.product_name,
      categoria: row.category.toLowerCase(),
      quantidade: row.quantity,
      dias: row.duration_days,
    },
    aguardandoJogador: row.requires_online,
    tentativa: row.attempts,
    criadaEm: row.created_at.toISOString(),
  };
}

export type DeliveryResult =
  | { ok: true }
  | { ok: false; error?: string; waitForPlayer?: boolean };

/** Registra o resultado informado pelo plugin. Retorna false se a entrega não existe. */
export async function resolveDelivery(id: string, server: string, result: DeliveryResult): Promise<boolean> {
  const delivery = await prisma.delivery.findUnique({ where: { id } });
  if (!delivery) return false;

  if (result.ok) {
    await prisma.delivery.update({
      where: { id },
      data: { status: "DELIVERED", deliveredBy: server, deliveredAt: new Date(), lastError: null },
    });
    return true;
  }

  // Adiada até o jogador entrar: volta para a fila sem contar tentativa e só
  // sai de novo quando o UUID dele vier no parâmetro `online`
  if (result.waitForPlayer) {
    await prisma.delivery.update({
      where: { id },
      data: {
        status: "PENDING",
        requiresOnline: true,
        attempts: { decrement: 1 },
        lastError: (result.error || "Aguardando o jogador entrar").slice(0, 2000),
      },
    });
    return true;
  }

  await prisma.delivery.update({
    where: { id },
    data: {
      status: delivery.attempts >= MAX_ATTEMPTS ? "FAILED" : "PENDING",
      lastError: (result.error || "Falha não informada").slice(0, 2000),
    },
  });
  return true;
}

/** Confere o token do plugin (Authorization: Bearer ...). null quando a API está desligada. */
export function checkDeliveryToken(request: Request): boolean | null {
  const expected = getEnv().DELIVERY_API_TOKEN;
  if (!expected) return null;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Resumo das entregas de um pedido para o site e o e-mail */
export function summarizeDeliveries(deliveries: { status: string; kind: string }[]) {
  const delivering = deliveries.filter((d) => d.kind === "DELIVER");
  if (delivering.length === 0) return "none" as const;
  if (delivering.every((d) => d.status === "DELIVERED")) return "delivered" as const;
  if (delivering.some((d) => d.status === "FAILED")) return "failed" as const;
  return "pending" as const;
}
