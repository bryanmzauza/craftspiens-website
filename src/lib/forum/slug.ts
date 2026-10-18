// =============================================================================
// Fórum: slugs e tags
// =============================================================================
import { TAG_MAX_LENGTH, TAGS_MAX } from "@/lib/forum/constants";

export function slugify(text: string, maxLength = 250): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLength)
    .replace(/-$/, "");
}

/**
 * Normaliza a lista de tags enviada pelo usuário: minúsculas, sem acentos,
 * sem repetição, no máximo TAGS_MAX itens de TAG_MAX_LENGTH caracteres.
 * Retorna null se algum item não for texto.
 */
export function normalizeTags(input: unknown): string[] | null {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) return null;
  const tags: string[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") return null;
    const tag = slugify(raw, TAG_MAX_LENGTH);
    if (!tag || tags.includes(tag)) continue;
    tags.push(tag);
  }
  return tags.slice(0, TAGS_MAX);
}

/** Tags guardadas como JSON no banco; qualquer valor inválido vira lista vazia */
export function parseTags(stored: string | null | undefined): string[] {
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
}
