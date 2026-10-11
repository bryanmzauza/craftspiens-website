// =============================================================================
// Conta do jogo (nLogin): existência e edição (Java ou Bedrock)
// =============================================================================
// Usado pela loja antes de aceitar um pagamento: a entrega é feita no jogo,
// então a conta precisa existir no nLogin, e o plugin precisa saber se o
// jogador é Java ou Bedrock. Somente leitura no MariaDB.
import { getNloginById } from "@/lib/nlogin";
import { toDashedUuid } from "@/lib/luckperms";

export type PlayerPlatform = "JAVA" | "BEDROCK";

export type GameAccount = {
  nloginId: number;
  username: string;
  /** UUID usado no jogo, com hífens (unique_id do nLogin) */
  uuid: string;
  platform: PlayerPlatform;
  /** UUID da conta Java original (sem hífens), quando houver */
  mojangId: string | null;
  /** UUID do Floodgate (sem hífens), quando a conta é Bedrock */
  bedrockId: string | null;
};

type NloginRow = {
  id: number;
  last_name: string;
  unique_id: string | null;
  mojang_id: string | null;
  bedrock_id: string | null;
};

/** bedrock_id preenchido = Bedrock; qualquer outra conta joga pelo Java */
export function platformOf(row: Pick<NloginRow, "bedrock_id">): PlayerPlatform {
  return row.bedrock_id ? "BEDROCK" : "JAVA";
}

export function toGameAccount(row: NloginRow): GameAccount | null {
  const uuid = row.unique_id ? toDashedUuid(row.unique_id) : null;
  if (!uuid) return null;
  return {
    nloginId: row.id,
    username: row.last_name,
    uuid,
    platform: platformOf(row),
    mojangId: row.mojang_id,
    bedrockId: row.bedrock_id,
  };
}

/** Conta do jogo vinculada ao usuário do site; null se não existir no nLogin */
export async function getGameAccount(nloginId: number | null | undefined): Promise<GameAccount | null> {
  if (nloginId == null) return null;
  const row = await getNloginById(nloginId);
  return row ? toGameAccount(row) : null;
}

export const PLATFORM_LABELS: Record<PlayerPlatform, string> = {
  JAVA: "Java",
  BEDROCK: "Bedrock",
};
