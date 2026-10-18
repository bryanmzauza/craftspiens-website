// =============================================================================
// Data de nascimento: leitura e idade mínima (cadastro e Configurações)
// =============================================================================

export const MIN_AGE = 13;

/** Converte "AAAA-MM-DD" numa data válida entre 1900 e hoje; null se inválida */
export function parseBirthDate(input: unknown, now = new Date()): Date | null {
  if (typeof input !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;
  const date = new Date(`${input}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== input) return null;
  if (date.getUTCFullYear() < 1900 || date.getTime() > now.getTime()) return null;
  return date;
}

/** Idade completa em anos, pelo calendário (UTC) */
export function ageInYears(birth: Date, now = new Date()): number {
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birth.getUTCDate())) age--;
  return age;
}

export function isAtLeastMinAge(birth: Date, now = new Date()): boolean {
  return ageInYears(birth, now) >= MIN_AGE;
}
