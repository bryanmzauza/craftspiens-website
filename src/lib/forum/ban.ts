// =============================================================================
// Fórum: banimento (RN-FORUM-07)
// =============================================================================
// Quem está banido continua lendo, mas não cria tópicos, comentários nem reage.

/** Data usada para banimentos permanentes */
export const PERMANENT_BAN = new Date("9999-12-31T00:00:00.000Z");
export const BAN_REASON_MAX = 255;
/** Duração máxima em dias de um banimento temporário */
export const BAN_MAX_DAYS = 365;

export interface BanState {
  until: Date | string | null | undefined;
  reason?: string | null;
}

export function isBanned(state: BanState, now = Date.now()): boolean {
  if (!state.until) return false;
  return new Date(state.until).getTime() > now;
}

export function isPermanentBan(until: Date | string | null | undefined): boolean {
  if (!until) return false;
  return new Date(until).getTime() >= PERMANENT_BAN.getTime();
}

/** Data de término a partir da duração em dias; null = permanente */
export function banExpiry(days: number | null, now = Date.now()): Date {
  if (days === null) return PERMANENT_BAN;
  return new Date(now + days * 24 * 60 * 60 * 1000);
}

/** Texto curto para o usuário: "permanentemente" ou "até 12/03/2027" */
export function describeBan(until: Date | string): string {
  if (isPermanentBan(until)) return "permanentemente";
  return `até ${new Date(until).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}`;
}
