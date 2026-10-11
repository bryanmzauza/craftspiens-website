// =============================================================================
// Cargo do jogador no servidor, lido do LuckPerms (somente leitura)
// =============================================================================
// O LuckPerms grava no mesmo MariaDB do nLogin. O jogador é identificado pelo
// UUID usado no jogo, que é o unique_id do nLogin com hífens.
//
// O cargo exibido é o grupo de maior peso (weight) entre os grupos do jogador,
// como o LuckPerms faz por padrão. A coluna primary_group não é usada porque
// fica desatualizada quando o servidor calcula o grupo principal pelo peso.
// O nome vem do prefixo do grupo (ex.: "&b[Dev]&f" vira "Dev"), depois do
// displayname e, por último, do próprio nome do grupo.
import { prismaMariaDb } from "@/lib/prisma";

export interface PlayerRank {
  /** Nome do grupo no LuckPerms */
  group: string;
  /** Nome para exibir */
  label: string;
  /** Cor do prefixo no jogo, em hexadecimal */
  color: string;
}

// Grupo padrão de todo jogador: sem outro cargo, aparece com este nome
const DEFAULT_GROUP = "default";
const DEFAULT_LABEL = "Jogador";
const DEFAULT_COLOR = "#4CAF50";

// Cores dos códigos de formatação do Minecraft (&0 a &f)
const MC_COLORS: Record<string, string> = {
  "0": "#000000", "1": "#0000AA", "2": "#00AA00", "3": "#00AAAA",
  "4": "#AA0000", "5": "#AA00AA", "6": "#FFAA00", "7": "#AAAAAA",
  "8": "#555555", "9": "#5555FF", a: "#55FF55", b: "#55FFFF",
  c: "#FF5555", d: "#FF55FF", e: "#FFFF55", f: "#FFFFFF",
};
// Cores escuras demais para o fundo escuro do site
const UNREADABLE = new Set(["#000000", "#0000AA", "#555555"]);

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { at: number; rank: PlayerRank | null }>();

/** 75d2341716...  ->  75d23417-1682-358f-ae3a-a43c3cafacd1 */
export function toDashedUuid(uuid: string): string | null {
  const hex = uuid.replace(/-/g, "").toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(hex)) return null;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Remove códigos de cor (&a, §a, &#RRGGBB) e os colchetes do prefixo */
export function cleanPrefix(prefix: string): string {
  return prefix
    .replace(/[&§]#[0-9a-f]{6}/gi, "")
    .replace(/[&§][0-9a-fk-or]/gi, "")
    .replace(/[[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Primeira cor do prefixo; null se não houver ou for ilegível no fundo escuro */
export function prefixColor(prefix: string): string | null {
  const match = prefix.match(/[&§](#[0-9a-f]{6}|[0-9a-f])/i);
  if (!match) return null;
  const code = match[1].toLowerCase();
  const color = code.startsWith("#") ? code.toUpperCase() : MC_COLORS[code];
  return color && !UNREADABLE.has(color) ? color : null;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

type PermissionRow = { permission: string; expiry: bigint | number | null };
type GroupMetaRow = { name: string; permission: string };

/** Cargo do jogador pelo unique_id do nLogin. null se o jogador não estiver no LuckPerms. */
export async function getPlayerRank(uniqueId: string | null | undefined): Promise<PlayerRank | null> {
  const uuid = uniqueId ? toDashedUuid(uniqueId) : null;
  if (!uuid) return null;

  const cached = cache.get(uuid);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.rank;

  const rank = await loadRank(uuid);
  cache.set(uuid, { at: Date.now(), rank });
  if (cache.size > 5_000) cache.clear();
  return rank;
}

async function loadRank(uuid: string): Promise<PlayerRank | null> {
  const nowSeconds = Math.floor(Date.now() / 1000);

  const rows = await prismaMariaDb.$queryRaw<PermissionRow[]>`
    SELECT permission, expiry FROM luckperms_user_permissions
    WHERE uuid = ${uuid} AND value = 1 AND permission LIKE 'group.%'
  `;
  // Grupos temporários vencidos não contam (expiry 0 = permanente)
  const groups = [
    ...new Set(
      rows
        .filter((row) => {
          const expiry = Number(row.expiry ?? 0);
          return expiry === 0 || expiry > nowSeconds;
        })
        .map((row) => row.permission.slice("group.".length).toLowerCase())
    ),
  ];
  if (groups.length === 0) return null;

  // Subconsulta em vez de Prisma.join: no servidor do Next, a lista montada pelo
  // Prisma.join do client gerado não é reconhecida e vai como um valor só.
  const meta = await prismaMariaDb.$queryRaw<GroupMetaRow[]>`
    SELECT name, permission FROM luckperms_group_permissions
    WHERE value = 1
      AND (permission LIKE 'weight.%' OR permission LIKE 'prefix.%' OR permission LIKE 'displayname.%')
      AND name IN (
        SELECT SUBSTRING(permission, 7) FROM luckperms_user_permissions
        WHERE uuid = ${uuid} AND value = 1 AND permission LIKE 'group.%'
      )
  `;

  const info = new Map<string, { weight: number; prefix: string | null; prefixPriority: number; displayName: string | null }>();
  for (const group of groups) info.set(group, { weight: 0, prefix: null, prefixPriority: -Infinity, displayName: null });

  for (const row of meta) {
    const entry = info.get(row.name.toLowerCase());
    if (!entry) continue;
    const [kind, ...rest] = row.permission.split(".");
    if (kind === "weight") {
      entry.weight = Math.max(entry.weight, Number(rest[0]) || 0);
    } else if (kind === "prefix") {
      // prefix.<prioridade>.<texto>; o texto pode conter pontos
      const priority = Number(rest[0]) || 0;
      if (priority >= entry.prefixPriority) {
        entry.prefixPriority = priority;
        entry.prefix = rest.slice(1).join(".");
      }
    } else if (kind === "displayname") {
      entry.displayName = rest.join(".");
    }
  }

  // Maior peso; em empate, o grupo com prefixo (é o que aparece no jogo)
  const [group, best] = [...info.entries()].sort(
    ([, a], [, b]) => b.weight - a.weight || Number(!!b.prefix) - Number(!!a.prefix)
  )[0];

  if (group === DEFAULT_GROUP) {
    return { group, label: DEFAULT_LABEL, color: DEFAULT_COLOR };
  }

  const fromPrefix = best.prefix ? cleanPrefix(best.prefix) : "";
  const label = capitalize(fromPrefix || best.displayName?.trim() || group);
  const color = (best.prefix && prefixColor(best.prefix)) || DEFAULT_COLOR;
  return { group, label, color };
}
