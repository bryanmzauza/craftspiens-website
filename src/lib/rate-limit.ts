import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Contadores guardados no PostgreSQL (tabela rate_limits): valem para todas as
// instâncias do servidor e sobrevivem a reinícios e deploys.

type RateLimitConfig = {
  maxAttempts: number;
  windowMs: number;
};

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
};

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // Incremento atômico: abre uma nova janela se a anterior já expirou
  const rows = await prisma.$queryRaw<{ count: number; reset_at: Date }[]>`
    INSERT INTO rate_limits (key, count, reset_at)
    VALUES (${key}, 1, now() + (${config.windowMs}::int * interval '1 millisecond'))
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.reset_at <= now() THEN 1 ELSE rate_limits.count + 1 END,
      reset_at = CASE WHEN rate_limits.reset_at <= now() THEN EXCLUDED.reset_at ELSE rate_limits.reset_at END
    RETURNING count, reset_at
  `;

  // Limpeza oportunista das janelas expiradas há mais de um dia
  if (Math.random() < 0.01) {
    prisma.$executeRaw`DELETE FROM rate_limits WHERE reset_at < now() - interval '1 day'`.catch(
      (error) => console.error("[rate-limit] Erro na limpeza:", error)
    );
  }

  const { count, reset_at } = rows[0];
  return {
    success: count <= config.maxAttempts,
    remaining: Math.max(config.maxAttempts - count, 0),
    resetAt: reset_at.getTime(),
  };
}

/** Resposta 429 padrão, com o cabeçalho Retry-After */
export function rateLimitResponse(result: RateLimitResult, message: string) {
  const retryAfter = Math.max(Math.ceil((result.resetAt - Date.now()) / 1000), 1);
  return NextResponse.json(
    { error: message },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

// Presets conforme docs/paginas/07-auth.md, 08-contato.md e 06-comunidade.md
export const RATE_LIMITS = {
  loginIp: { maxAttempts: 20, windowMs: 15 * 60 * 1000 },        // 20 tentativas por IP / 15 min (escolas compartilham IP)
  loginUser: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },       // 5 tentativas por conta / 15 min
  checkUsername: { maxAttempts: 30, windowMs: 60 * 1000 },       // 30 consultas / 1 min
  contact: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },         // 3 envios / 1 hora
  register: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },        // 3 registros / 1 hora
  passwordChange: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },  // 5 tentativas / 15 min
  passwordReset: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },   // 3 solicitações / 1 hora
  passwordResetConfirm: { maxAttempts: 10, windowMs: 60 * 60 * 1000 }, // 10 redefinições / 1 hora
  newsletter: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },      // 3 inscrições / 1 hora
  forumTopic: { maxAttempts: 5, windowMs: 60 * 60 * 1000 },      // 5 tópicos / 1 hora (RN-FORUM-05)
  forumComment: { maxAttempts: 10, windowMs: 15 * 60 * 1000 },   // 10 comentários / 15 min
  reaction: { maxAttempts: 60, windowMs: 60 * 1000 },            // 60 reações / 1 min
  checkout: { maxAttempts: 8, windowMs: 15 * 60 * 1000 },        // 8 pedidos criados / 15 min
  orderPoll: { maxAttempts: 120, windowMs: 5 * 60 * 1000 },     // 120 consultas de pedido / 5 min (página do Pix)
  coupon: { maxAttempts: 10, windowMs: 15 * 60 * 1000 },         // 10 validações de cupom / 15 min
  profileUpdate: { maxAttempts: 10, windowMs: 15 * 60 * 1000 },  // 10 atualizações de perfil / 15 min
  accountDelete: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },   // 5 tentativas de exclusão / 15 min
  emailCode: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },       // 5 códigos de verificação / 15 min
  emailConfirm: { maxAttempts: 10, windowMs: 15 * 60 * 1000 },   // 10 tentativas de código / 15 min
} as const;
