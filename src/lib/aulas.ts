// Utilidades de exibição das aulas (vídeos e lives do canal no YouTube)

/** Ordem e rótulos das áreas nos filtros de /aulas */
export const AREAS = ["Exatas", "Natureza", "Humanas", "Linguagens", "Outras"] as const;

export const FORMAT_LABELS: Record<string, string> = {
  live: "Live",
  video: "Vídeo",
  curto: "Vídeo curto",
};

export function youtubeThumbnail(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`;
}

export function youtubeWatchUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

/** 45 → "45min"; 125 → "2h 05min" */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}min`;
  return rest === 0 ? `${hours}h` : `${hours}h ${String(rest).padStart(2, "0")}min`;
}

/** Total para resumos: 50 → "50 min"; 7300 → "122 h" */
export function formatHours(minutes: number): string {
  return minutes < 60 ? `${minutes} min` : `${Math.round(minutes / 60)} h`;
}

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

/** "2025-11-13T00:11:09.000Z" → "12/11/2025" (horário de Brasília) */
export function formatDate(value: string | Date): string {
  return dateFormat.format(new Date(value));
}
