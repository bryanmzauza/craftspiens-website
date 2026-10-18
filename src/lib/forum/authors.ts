// =============================================================================
// Fórum: autores (nick e skin vêm do nLogin, no MariaDB)
// =============================================================================
import { getNloginMap } from "@/lib/nlogin";

export interface ForumAuthor {
  id: string;
  username: string;
  /** unique_id do nLogin, usado nos avatares do mc-heads.net */
  uuid: string | null;
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

/** Resolve vários autores de uma vez (uma consulta ao nLogin) */
export async function resolveAuthors(rows: AuthorRow[]): Promise<Map<string, ForumAuthor>> {
  const nloginMap = await getNloginMap(rows.map((r) => r.nloginId));
  const result = new Map<string, ForumAuthor>();
  for (const row of rows) {
    if (result.has(row.id)) continue;
    const nlogin = nloginMap.get(row.nloginId);
    result.set(row.id, {
      id: row.id,
      username: nlogin?.last_name ?? row.displayName ?? "Aluno",
      uuid: nlogin?.unique_id ?? null,
      role: row.role,
    });
  }
  return result;
}

export async function resolveAuthor(row: AuthorRow): Promise<ForumAuthor> {
  const map = await resolveAuthors([row]);
  return map.get(row.id)!;
}
