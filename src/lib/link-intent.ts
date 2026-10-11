// Intenção de vínculo: quando um usuário logado clica em "Vincular Google" ou
// "Vincular com Microsoft", gravamos um cookie assinado com o id dele. No retorno
// do login externo, o NextAuth lê esse cookie e vincula a conta externa ao
// usuário, em vez de fazer um login novo. O cookie expira em 10 minutos.
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";

export type LinkProvider = "google" | "microsoft";

const COOKIE = "cs_link_intent";
const MAX_AGE_SECONDS = 10 * 60;

interface LinkIntent {
  userId: string;
  provider: LinkProvider;
  exp: number;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getEnv().AUTH_SECRET).update(payload).digest("base64url");
}

export async function setLinkIntent(userId: string, provider: LinkProvider): Promise<void> {
  const payload = Buffer.from(
    JSON.stringify({ userId, provider, exp: Date.now() + MAX_AGE_SECONDS * 1000 } satisfies LinkIntent)
  ).toString("base64url");

  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Lê e apaga a intenção de vínculo, se existir, for válida e for deste provedor */
export async function consumeLinkIntent(provider: LinkProvider): Promise<LinkIntent | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;

  try {
    store.delete(COOKIE);
  } catch {
    // Fora de um Route Handler o cookie não pode ser apagado; ele expira sozinho
  }

  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;

  try {
    const intent = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as LinkIntent;
    if (intent.provider !== provider || intent.exp < Date.now()) return null;
    return intent;
  } catch {
    return null;
  }
}
