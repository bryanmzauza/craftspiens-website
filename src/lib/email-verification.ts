// =============================================================================
// Verificação de e-mail por código de 6 dígitos
// =============================================================================
// O código é enviado por e-mail e guardado só como hash (HMAC com o AUTH_SECRET).
// Vale 15 minutos e aceita até 5 tentativas; um novo envio invalida os anteriores.
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getEnv } from "@/lib/env";

const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

/** E-mails provisórios criados para jogadores sem e-mail no nLogin */
export function isPlaceholderEmail(email: string): boolean {
  return email.endsWith("@craftsapiens.temp");
}

function hashCode(userId: string, code: string): string {
  return crypto.createHmac("sha256", getEnv().AUTH_SECRET).update(`${userId}:${code}`).digest("hex");
}

/** Cria um código novo para o e-mail informado e invalida os pendentes */
export async function createVerificationCode(userId: string, email: string): Promise<string> {
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  const now = new Date();

  await prisma.$transaction([
    prisma.emailVerification.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt: now },
    }),
    prisma.emailVerification.create({
      data: {
        userId,
        email,
        codeHash: hashCode(userId, code),
        expiresAt: new Date(now.getTime() + CODE_TTL_MS),
      },
    }),
  ]);

  return code;
}

export type VerifyResult =
  | { ok: true; email: string }
  | { ok: false; reason: "sem-codigo" | "expirado" | "tentativas" | "incorreto" };

/** Confere o código pendente do usuário; em caso de acerto, marca como usado */
export async function verifyCode(userId: string, code: string): Promise<VerifyResult> {
  const pending = await prisma.emailVerification.findFirst({
    where: { userId, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!pending) return { ok: false, reason: "sem-codigo" };
  if (pending.expiresAt < new Date()) return { ok: false, reason: "expirado" };
  if (pending.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "tentativas" };

  const expected = Buffer.from(pending.codeHash, "hex");
  const received = Buffer.from(hashCode(userId, code.trim()), "hex");
  const matches = expected.length === received.length && crypto.timingSafeEqual(expected, received);

  if (!matches) {
    await prisma.emailVerification.update({
      where: { id: pending.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: pending.attempts + 1 >= MAX_ATTEMPTS ? "tentativas" : "incorreto" };
  }

  // Marca como usado de forma condicional: duas confirmações simultâneas não passam
  const claimed = await prisma.emailVerification.updateMany({
    where: { id: pending.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (claimed.count !== 1) return { ok: false, reason: "sem-codigo" };

  return { ok: true, email: pending.email };
}
