"use client";

// Cartão do autor na coluna do post: foto vertical com moldura na cor do cargo
// e o nome do cargo numa aba, nick na cor do cargo, tag de reputação e dados.

import Link from "next/link";
import { ProfilePhoto } from "@/components/ui/ProfilePhoto";
import { type Author, isHighlighted, rankColor, ROLE_LABELS } from "@/components/comunidade/shared";

export interface AuthorCardData extends Author {
  bio: string | null;
  joinedAt: string;
  postCount: number;
  commentCount: number;
  reputation: number;
  badge: string;
}

/** Cor e nome da moldura: cargo no servidor; sem ele, o papel do site */
export function photoFrame(author: Pick<Author, "rank" | "role">): { color: string; label: string | null } {
  if (author.rank) return { color: author.rank.color, label: author.rank.label };
  const role = ROLE_LABELS[author.role];
  return { color: role ? "#FFC107" : "rgba(255,255,255,0.25)", label: role?.label ?? null };
}

function formatJoined(date: string): string {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(/\./g, "");
}

export function AuthorCard({ author }: { author: AuthorCardData }) {
  const skinId = author.skin ?? (author.uuid ? author.username : null);
  const rows: [string, string][] = [
    ["Entrou", formatJoined(author.joinedAt)],
    ["Posts", author.postCount.toLocaleString("pt-BR")],
    ["Comentários", author.commentCount.toLocaleString("pt-BR")],
    ["Reputação", `${author.reputation.toLocaleString("pt-BR")} pts`],
  ];

  return (
    <div className="flex w-full flex-col items-center text-center">
      <Link href={`/comunidade/membro/${author.username}`} aria-label={`Perfil de ${author.username}`}>
        <ProfilePhoto
          photo={author.photo}
          skinId={skinId}
          name={author.username}
          width={176}
          shape="retrato"
          frame={photoFrame(author)}
          alt={`Foto de ${author.username}`}
        />
      </Link>

      <Link
        href={`/comunidade/membro/${author.username}`}
        className="mt-3 text-lg font-bold leading-tight hover:underline"
        style={{ color: rankColor(author) }}
      >
        {author.username}
      </Link>
      <p className="mt-0.5 text-sm text-[#A0A0A0]" title="Reputação no fórum">
        {author.badge}
        {isHighlighted(author) && <span className="text-[#E0E0E0]"> · Equipe</span>}
      </p>

      <dl className="mt-4 w-full space-y-1 text-left text-xs">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <dt className="text-[#A0A0A0]">{label}:</dt>
            <dd className="font-medium text-white">{value}</dd>
          </div>
        ))}
      </dl>

      {author.bio && <p className="mt-3 w-full text-left text-xs leading-relaxed text-[#A0A0A0]">{author.bio}</p>}
    </div>
  );
}
