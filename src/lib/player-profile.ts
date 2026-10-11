// =============================================================================
// Dados do jogador vindos do servidor: skin e tempo de servidor
// =============================================================================
import { floodgateUuid } from "@/lib/minecraft-auth";

export type SkinSource = "java" | "bedrock" | "nick";

export interface PlayerSkin {
  /** Identificador aceito pelo mc-heads.net: UUID, código da textura ou nick */
  id: string;
  source: SkinSource;
}

const GEYSER_TIMEOUT_MS = 5_000;
const GEYSER_CACHE_MS = 6 * 60 * 60 * 1000;
const geyserCache = new Map<string, { at: number; textureId: string | null }>();

/** XUID do Bedrock a partir do bedrock_id do nLogin (16 zeros + XUID em hexadecimal) */
export function xuidFromBedrockId(bedrockId: string): string | null {
  const hex = bedrockId.replace(/-/g, "");
  if (!/^[0-9a-f]{32}$/i.test(hex)) return null;
  const xuid = BigInt(`0x${hex}`).toString();
  // Confere o formato do Floodgate antes de confiar no valor
  return floodgateUuid(xuid) === hex.toLowerCase() ? xuid : null;
}

/** Textura da skin de um jogador Bedrock, enviada pelo Geyser quando ele entra no servidor */
async function bedrockTextureId(xuid: string): Promise<string | null> {
  const cached = geyserCache.get(xuid);
  if (cached && Date.now() - cached.at < GEYSER_CACHE_MS) return cached.textureId;

  let textureId: string | null = null;
  try {
    const res = await fetch(`https://api.geysermc.org/v2/skin/${xuid}`, {
      signal: AbortSignal.timeout(GEYSER_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = (await res.json()) as { texture_id?: unknown };
      if (typeof data.texture_id === "string" && /^[0-9a-f]{20,80}$/i.test(data.texture_id)) {
        textureId = data.texture_id;
      }
    }
  } catch {
    // API fora do ar: usa o nick e tenta de novo na próxima consulta
    return null;
  }

  geyserCache.set(xuid, { at: Date.now(), textureId });
  if (geyserCache.size > 5_000) geyserCache.clear();
  return textureId;
}

/**
 * Skin do jogador, na ordem:
 * 1. Conta original (Java): UUID da Mojang, a skin oficial da conta.
 * 2. Bedrock: textura publicada pelo Geyser.
 * 3. Demais contas: skin pelo nick. Em servidores sem conta original, a skin no
 *    jogo também costuma vir da conta original com o mesmo nick; sem uma, aparece o Steve.
 */
export async function getPlayerSkin(nlogin: {
  last_name: string;
  mojang_id: string | null;
  bedrock_id: string | null;
}): Promise<PlayerSkin> {
  if (nlogin.mojang_id && /^[0-9a-f]{32}$/i.test(nlogin.mojang_id)) {
    return { id: nlogin.mojang_id.toLowerCase(), source: "java" };
  }
  if (nlogin.bedrock_id) {
    const xuid = xuidFromBedrockId(nlogin.bedrock_id);
    const textureId = xuid ? await bedrockTextureId(xuid) : null;
    if (textureId) return { id: textureId, source: "bedrock" };
  }
  return { id: nlogin.last_name, source: "nick" };
}

export interface Seniority {
  label: "Novato" | "Membro" | "Veterano" | "Lenda";
  /** Data de registro no servidor (nLogin) */
  since: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Tag pelo tempo desde o registro no servidor (creation_date do nLogin) */
export function getSeniority(creationDate: Date): Seniority {
  const days = (Date.now() - creationDate.getTime()) / DAY_MS;
  const label = days < 30 ? "Novato" : days < 365 ? "Membro" : days < 3 * 365 ? "Veterano" : "Lenda";
  return { label, since: creationDate.toISOString() };
}
