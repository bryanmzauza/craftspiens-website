// =============================================================================
// Fórum: autores (nick e skin vêm do nLogin, no MariaDB)
// =============================================================================
import { getNloginMap } from "@/lib/nlogin";
import { getPlayerSkin } from "@/lib/player-profile";
import { getPlayerRank, getStaffMinWeight, isStaffRank } from "@/lib/luckperms";

/** Cargo do autor no servidor (LuckPerms), como aparece no fórum */
export interface ForumRank {
  /** Nome do grupo no LuckPerms ("default" para quem não tem cargo) */
  group: string;
  label: string;
  /** Cor do prefixo no jogo, em hexadecimal */
  color: string;
  /** Moderador ou superior na hierarquia do LuckPerms: ganha destaque */
  staff: boolean;
}

export interface ForumAuthor {
  id: string;
  username: string;
  /** unique_id do nLogin (identificador da conta no servidor) */
  uuid: string | null;
  /**
   * Identificador da skin no mc-heads.net, pela mesma regra do perfil
   * (src/lib/player-profile.ts): UUID da conta original, textura do Bedrock
   * ou o nick. O unique_id não serve para isso: em contas sem conta original
   * ele é um UUID offline, e o mc-heads.net mostra o Steve.
   */
  skin: string | null;
  /** Cargo no servidor; nulo para contas sem nick ou fora do LuckPerms */
  rank: ForumRank | null;
  role: string;
}

/** Campos de User necessários para montar um ForumAuthor */
export const AUTHOR_SELECT = {
  id: true,
  role: true,
  nloginId: true,
  displayName: true,
} as const;

export interface AuthorRow {
  id: string;
  role: string;
  nloginId: number | null;
  displayName: string | null;
}

/** Resolve vários autores de uma vez (uma consulta ao nLogin; skins em paralelo, com cache) */
export async function resolveAuthors(rows: AuthorRow[]): Promise<Map<string, ForumAuthor>> {
  const unique = [...new Map(rows.map((r) => [r.id, r])).values()];
  const [nloginMap, staffMinWeight] = await Promise.all([
    getNloginMap(unique.map((r) => r.nloginId)),
    getStaffMinWeight(),
  ]);

  const authors = await Promise.all(
    unique.map(async (row): Promise<ForumAuthor> => {
      const nlogin = nloginMap.get(row.nloginId);
      // Falha na consulta da skin (Bedrock) não derruba a página: usa o nick
      const [skin, rank] = nlogin
        ? await Promise.all([
            getPlayerSkin(nlogin).then((s) => s.id).catch(() => nlogin.last_name),
            // Falha no LuckPerms: o autor aparece sem cargo, a página continua
            getPlayerRank(nlogin.unique_id).catch(() => null),
          ])
        : [null, null];
      return {
        id: row.id,
        username: nlogin?.last_name ?? row.displayName ?? "Aluno",
        uuid: nlogin?.unique_id ?? null,
        skin,
        rank: rank
          ? { group: rank.group, label: rank.label, color: rank.color, staff: isStaffRank(rank, staffMinWeight) }
          : null,
        role: row.role,
      };
    })
  );

  return new Map(authors.map((a) => [a.id, a]));
}

export async function resolveAuthor(row: AuthorRow): Promise<ForumAuthor> {
  const map = await resolveAuthors([row]);
  return map.get(row.id)!;
}
