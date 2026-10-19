// =============================================================================
// Painel da equipe: acesso pelo código PAINEL_CODIGO
// =============================================================================
// Quem informa o código certo recebe um cookie assinado (httpOnly, SameSite
// Strict) com o nome que digitou, válido por 12 horas. A chave da assinatura
// sai do AUTH_SECRET junto com o próprio código: trocar o código no .env
// invalida todas as sessões do painel na hora. O código nunca sai do servidor
// e nunca fica no repositório.
import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma-pg";

export const PANEL_COOKIE = "painel_sessao";
export const PANEL_SESSION_HOURS = 12;

export interface PanelSession {
  /** Nome informado ao abrir o painel; aparece no registro de atividade */
  name: string;
  expiresAt: number;
}

/** null quando PAINEL_CODIGO não está definido: o painel fica desligado */
function panelCode(): string | null {
  return getEnv().PAINEL_CODIGO ?? null;
}

export function isPanelEnabled(): boolean {
  return panelCode() !== null;
}

function signingKey(code: string): Buffer {
  return crypto.createHmac("sha256", getEnv().AUTH_SECRET).update(`painel:${code}`).digest();
}

function sign(payload: string, code: string): string {
  return crypto.createHmac("sha256", signingKey(code)).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  // Compara os hashes para não vazar o tamanho do código pelo tempo de resposta
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/** Confere o código digitado (comparação em tempo constante) */
export function checkPanelCode(input: string): boolean {
  const code = panelCode();
  if (!code) return false;
  return safeEqual(input, code);
}

/** Nome de quem abre o painel: letras, números, espaço, ponto, hífen e sublinhado */
export function normalizePanelName(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const name = input.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 30) return null;
  if (!/^[\p{L}\p{N} ._-]+$/u.test(name)) return null;
  return name;
}

export function createPanelToken(name: string): { token: string; expiresAt: number } {
  const code = panelCode();
  if (!code) throw new Error("PAINEL_CODIGO não definido");
  const expiresAt = Date.now() + PANEL_SESSION_HOURS * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ n: name, e: expiresAt })).toString("base64url");
  return { token: `${payload}.${sign(payload, code)}`, expiresAt };
}

export function readPanelToken(token: string | undefined): PanelSession | null {
  const code = panelCode();
  if (!code || !token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload, code))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.n !== "string" || typeof data.e !== "number" || data.e <= Date.now()) return null;
    return { name: data.n, expiresAt: data.e };
  } catch {
    return null;
  }
}

/** Sessão do painel da requisição atual (páginas e rotas) */
export async function getPanelSession(): Promise<PanelSession | null> {
  const store = await cookies();
  return readPanelToken(store.get(PANEL_COOKIE)?.value);
}

export function panelCookieOptions(expiresAt: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    expires: new Date(expiresAt),
  };
}

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Exigência de toda rota /api/painel: sessão válida e, nas escritas, a origem
 * do próprio site (o cookie já é SameSite Strict; isto é uma segunda barreira).
 */
export async function requirePanel(
  request: Request
): Promise<{ session: PanelSession } | { error: NextResponse }> {
  if (!isPanelEnabled()) {
    return { error: NextResponse.json({ error: "Painel desligado.", code: "PainelDesligado" }, { status: 503 }) };
  }
  if (WRITE_METHODS.has(request.method)) {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(getEnv().AUTH_URL).origin && origin !== new URL(request.url).origin) {
      return { error: NextResponse.json({ error: "Origem não permitida." }, { status: 403 }) };
    }
  }
  const session = await getPanelSession();
  if (!session) {
    return {
      error: NextResponse.json(
        { error: "Sessão do painel expirada. Informe o código de novo.", code: "PainelBloqueado" },
        { status: 401 }
      ),
    };
  }
  return { session };
}

/** Registra uma ação do painel. Falha no registro não desfaz a ação. */
export async function logPanel(
  session: PanelSession,
  action: string,
  target: string | null,
  details?: Prisma.InputJsonValue
): Promise<void> {
  try {
    await prisma.panelLog.create({
      data: { actor: session.name, action, target: target?.slice(0, 255) ?? null, details },
    });
  } catch (error) {
    console.error("[painel] Erro ao registrar atividade:", error);
  }
}
