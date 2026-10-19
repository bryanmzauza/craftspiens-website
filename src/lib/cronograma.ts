// =============================================================================
// Cronograma das aulas ao vivo (definido no painel, exibido em /cronograma)
// =============================================================================
import type { Prisma } from "@/generated/prisma-pg";
import { prisma } from "@/lib/prisma";

export const NOTICE_KEY = "cronograma.aviso";
// Maior intervalo consultado de uma vez (visão mensal com sobra)
const MAX_RANGE_MS = 62 * 24 * 60 * 60 * 1000;

export const PUBLIC_CLASS_SELECT = {
  id: true,
  title: true,
  topic: true,
  description: true,
  teacher: true,
  level: true,
  color: true,
  location: true,
  startsAt: true,
  endsAt: true,
  cancelled: true,
  cancelReason: true,
  discipline: { select: { name: true, slug: true } },
} satisfies Prisma.ScheduledClassSelect;

export type PublicClass = Prisma.ScheduledClassGetPayload<{ select: typeof PUBLIC_CLASS_SELECT }>;

/** inicio e fim (ISO) da URL; null se faltarem, forem inválidos ou o intervalo for grande demais */
export function parseRange(params: URLSearchParams): { start: Date; end: Date } | null {
  const start = new Date(params.get("inicio") ?? "");
  const end = new Date(params.get("fim") ?? "");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  if (end <= start || end.getTime() - start.getTime() > MAX_RANGE_MS) return null;
  return { start, end };
}

/** Aulas que se sobrepõem ao intervalo */
export function rangeWhere(range: { start: Date; end: Date }): Prisma.ScheduledClassWhereInput {
  return { startsAt: { lt: range.end }, endsAt: { gt: range.start } };
}

export interface ScheduleNotice {
  text: string;
  /** Até quando o aviso aparece (ISO); null = até ser removido */
  until: string | null;
}

function parseNotice(value: unknown): ScheduleNotice | null {
  if (!value || typeof value !== "object") return null;
  const { text, until } = value as Record<string, unknown>;
  if (typeof text !== "string" || !text.trim()) return null;
  return { text, until: typeof until === "string" ? until : null };
}

/** Aviso de recesso ou mudança (todos os estados, para o painel) */
export async function getNotice(): Promise<ScheduleNotice | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key: NOTICE_KEY } });
  return parseNotice(row?.value);
}

/** Aviso em vigor, para a página pública */
export async function getActiveNotice(): Promise<ScheduleNotice | null> {
  const notice = await getNotice();
  if (!notice) return null;
  if (notice.until && new Date(notice.until).getTime() < Date.now()) return null;
  return notice;
}
