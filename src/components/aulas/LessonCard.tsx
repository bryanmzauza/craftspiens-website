import Link from "next/link";
import { CheckCircle, Play } from "lucide-react";
import { FORMAT_LABELS, formatDate, formatDuration, youtubeThumbnail } from "@/lib/aulas";

interface LessonCardProps {
  href: string;
  title: string;
  youtubeId: string | null;
  format: string | null;
  publishedAt: string | null;
  duration: number | null;
  /** Texto acima do título (ex.: nome da disciplina), na cor `color` */
  label?: string;
  color?: string;
  completed?: boolean;
}

export function LessonCard({
  href,
  title,
  youtubeId,
  format,
  publishedAt,
  duration,
  label,
  color,
  completed = false,
}: LessonCardProps) {
  return (
    <Link
      href={href}
      className={`group flex h-full flex-col overflow-hidden rounded-xl border bg-white/5 transition-colors hover:bg-white/[0.08] ${
        completed ? "border-green-cs/40 hover:border-green-cs/60" : "border-white/10 hover:border-white/25"
      }`}
    >
      <div className="relative aspect-video bg-black/40">
        {youtubeId ? (
          // eslint-disable-next-line @next/next/no-img-element -- miniatura do YouTube (i.ytimg.com)
          <img
            src={youtubeThumbnail(youtubeId)}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-opacity group-hover:opacity-85"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Play size={32} className="text-[#A0A0A0]" aria-hidden="true" />
          </div>
        )}

        {format && (
          <span className="absolute left-2 top-2 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-medium text-white">
            {FORMAT_LABELS[format] ?? format}
          </span>
        )}
        {completed && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded bg-green-cs px-1.5 py-0.5 text-[11px] font-semibold text-white">
            <CheckCircle size={12} aria-hidden="true" />
            Concluída
          </span>
        )}
        {duration ? (
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
            {formatDuration(duration)}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {label && (
          <p className="text-xs font-semibold" style={color ? { color } : undefined}>
            {label}
          </p>
        )}
        <h4 className={`line-clamp-2 text-sm font-medium text-white ${label ? "mt-1" : ""}`}>{title}</h4>
        {publishedAt && (
          <p className="mt-auto pt-3 text-xs text-[#A0A0A0]">{formatDate(publishedAt)}</p>
        )}
      </div>
    </Link>
  );
}
