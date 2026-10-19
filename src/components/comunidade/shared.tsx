"use client";

// Peças compartilhadas pelas páginas da comunidade: autores, tags, listas de
// tópicos, paginação, chamadas à API e avisos de acesso.

import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye, Lock, MessageSquare, Pin, CheckCircle, EyeOff, Clock, ShieldCheck } from "lucide-react";
import { timeAgo, fullDate } from "@/lib/forum/time";

/** Cargo no servidor (LuckPerms): nome, cor do prefixo e se é moderador ou superior */
export interface Rank {
  group: string;
  label: string;
  color: string;
  staff: boolean;
}

export interface Author {
  id: string;
  username: string;
  uuid: string | null;
  /** Identificador da skin no mc-heads.net (conta original, Bedrock ou nick) */
  skin?: string | null;
  /** Cargo no servidor; nulo para contas sem nick */
  rank?: Rank | null;
  role: string;
}

// Jogador comum (grupo "default"): nome na cor do cargo, mas sem selo
const DEFAULT_GROUP = "default";

/** Cor do nome: a do cargo no servidor; sem cargo, branco */
export function rankColor(author: Pick<Author, "rank">): string {
  return author.rank?.color ?? "#FFFFFF";
}

/** Moderador ou superior no servidor (peso do LuckPerms), ou moderação do site */
export function isHighlighted(author: Pick<Author, "rank" | "role">): boolean {
  return !!author.rank?.staff || author.role === "MODERADOR" || author.role === "ADMIN";
}

export interface TopicSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  pinned: boolean;
  locked: boolean;
  resolved: boolean;
  private: boolean;
  views: number;
  tags: string[];
  commentCount: number;
  reactionCount: number;
  lastActivityAt: string;
  createdAt: string;
  category: { name: string; slug: string };
  author: Author;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const ROLE_LABELS: Record<string, { label: string; className: string }> = {
  ADMIN: { label: "Admin", className: "bg-error/20 text-error" },
  MODERADOR: { label: "Moderador", className: "bg-warning/20 text-warning" },
  PROFESSOR: { label: "Professor", className: "bg-info/20 text-info" },
};

// --- Chamadas à API ---

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; code?: string };

/** fetch com JSON e erro padronizado ({ error, code } das rotas do fórum) */
export async function api<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...(init?.headers ?? {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, status: res.status, error: data.error ?? "Erro inesperado", code: data.code };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, status: 0, error: "Erro de conexão. Tente novamente." };
  }
}

// --- Avisos de acesso ---

/** Mensagem de erro das escritas, com link quando o usuário precisa vincular o nick */
export function ApiError({ error, code }: { error: string; code?: string }) {
  if (code === "SemNick") {
    return (
      <p className="rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
        Para participar do fórum, vincule seu nick do Minecraft em{" "}
        <Link href="/perfil/configuracoes" className="font-bold underline">
          Configurações
        </Link>
        .
      </p>
    );
  }
  if (code === "TermosNaoAceitos") {
    return (
      <p className="rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
        Aceite os Termos e Condições e a Política de Privacidade para participar. Recarregue a página para ver o
        formulário de aceite.
      </p>
    );
  }
  if (code === "SemIdade") {
    return (
      <p className="rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
        Para participar do fórum, informe sua data de nascimento em{" "}
        <Link href="/perfil/configuracoes" className="font-bold underline">
          Configurações
        </Link>
        .
      </p>
    );
  }
  if (code === "EmailNaoVerificado") {
    return (
      <p className="rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
        <Link href="/confirmar-email" className="font-bold underline">
          Confirme seu e-mail
        </Link>{" "}
        para participar do fórum.
      </p>
    );
  }
  return <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>;
}

// --- Autores ---

export function Avatar({
  author,
  size = 32,
  className = "",
  highlight = false,
}: {
  author: Author;
  size?: number;
  className?: string;
  /** Anel na cor do cargo quando o autor é moderador ou superior */
  highlight?: boolean;
}) {
  const ring =
    highlight && isHighlighted(author)
      ? { boxShadow: `0 0 0 2px ${rankColor(author)}, 0 0 14px ${rankColor(author)}66` }
      : undefined;
  // Skin pela mesma regra do perfil; sem nick vinculado, a inicial do nome
  const skinId = author.skin ?? (author.uuid ? author.username : null);
  if (skinId) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatar externo (mc-heads.net)
      <img
        src={`https://mc-heads.net/avatar/${encodeURIComponent(skinId)}/${size}`}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 rounded-md ${className}`}
        style={{ width: size, height: size, ...ring }}
      />
    );
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-md bg-white/10 font-bold text-white ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(10, size / 2.2), ...ring }}
      aria-hidden="true"
    >
      {author.username[0]?.toUpperCase()}
    </div>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const info = ROLE_LABELS[role];
  if (!info) return null;
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${info.className}`}>{info.label}</span>
  );
}

/**
 * Selo do cargo no servidor, na cor do prefixo do jogo. Moderador ou superior
 * ganha o escudo e um brilho. Sem cargo no servidor, cai para o papel do site.
 */
export function RankBadge({ author, size = "sm" }: { author: Pick<Author, "rank" | "role">; size?: "sm" | "md" }) {
  const rank = author.rank;
  if (!rank || rank.group === DEFAULT_GROUP) return <RoleBadge role={author.role} />;
  const staff = isHighlighted(author);
  const text = size === "md" ? "text-xs px-2 py-0.5" : "text-[10px] px-1.5 py-0.5";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border font-bold uppercase tracking-wide ${text}`}
      style={{
        color: rank.color,
        backgroundColor: `${rank.color}${staff ? "33" : "1F"}`,
        borderColor: `${rank.color}${staff ? "99" : "4D"}`,
        boxShadow: staff ? `0 0 10px ${rank.color}59` : undefined,
      }}
      title={staff ? `${rank.label} (equipe do servidor)` : "Cargo no servidor"}
    >
      {staff && <ShieldCheck size={size === "md" ? 12 : 10} aria-hidden="true" />}
      {rank.label}
    </span>
  );
}

/** Nick com link para a página do membro, na cor do cargo; equipe com brilho */
export function AuthorName({ author, className = "" }: { author: Author; className?: string }) {
  const color = rankColor(author);
  const staff = isHighlighted(author);
  return (
    <Link
      href={`/comunidade/membro/${author.username}`}
      className={`font-bold hover:underline ${className}`}
      style={{ color, textShadow: staff ? `0 0 12px ${color}99` : undefined }}
    >
      {author.username}
    </Link>
  );
}

/** Estilo de destaque para cartões e avatares da equipe (borda e brilho na cor do cargo) */
export function staffFrameStyle(author: Pick<Author, "rank" | "role">): React.CSSProperties | undefined {
  if (!isHighlighted(author)) return undefined;
  const color = rankColor(author);
  return { borderColor: `${color}80`, boxShadow: `0 0 0 1px ${color}33, 0 0 18px ${color}26` };
}

export function Tag({ tag, categorySlug }: { tag: string; categorySlug?: string }) {
  const href = categorySlug ? `/comunidade/${categorySlug}?tag=${encodeURIComponent(tag)}` : `/comunidade?tag=${encodeURIComponent(tag)}`;
  return (
    <Link
      href={href}
      className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-[#E0E0E0] transition-colors hover:border-green-cs hover:text-green-cs"
    >
      #{tag}
    </Link>
  );
}

// --- Datas ---

export function When({ date, prefix = "" }: { date: string; prefix?: string }) {
  return (
    <time dateTime={date} title={fullDate(date)}>
      {prefix}
      {timeAgo(date)}
    </time>
  );
}

// --- Lista de tópicos ---

export function TopicStatusIcons({ topic, size = 14 }: { topic: Pick<TopicSummary, "pinned" | "locked" | "resolved" | "private">; size?: number }) {
  return (
    <>
      {topic.pinned && <Pin size={size} className="shrink-0 text-warning" aria-label="Fixado" />}
      {topic.locked && <Lock size={size} className="shrink-0 text-[#A0A0A0]" aria-label="Fechado" />}
      {topic.resolved && <CheckCircle size={size} className="shrink-0 text-green-cs" aria-label="Resolvido" />}
      {topic.private && <EyeOff size={size} className="shrink-0 text-xp" aria-label="Privado" />}
    </>
  );
}

export function TopicRow({ topic, showCategory = false }: { topic: TopicSummary; showCategory?: boolean }) {
  return (
    <Link
      href={`/comunidade/${topic.category.slug}/${topic.slug}`}
      className="flex items-start gap-3 rounded-xl border border-white/10 bg-bg-card/50 p-4 transition-all hover:border-white/20 hover:bg-bg-card/80"
    >
      <Avatar author={topic.author} size={36} className="mt-0.5" highlight />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <TopicStatusIcons topic={topic} />
          <h3 className="font-semibold text-white">{topic.title}</h3>
          {showCategory && (
            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[#A0A0A0]">
              {topic.category.name}
            </span>
          )}
        </div>
        {topic.excerpt && <p className="mt-0.5 line-clamp-1 text-sm text-[#A0A0A0]">{topic.excerpt}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#A0A0A0]">
          <span className="flex items-center gap-1">
            <span
              className="font-semibold"
              style={{
                color: rankColor(topic.author),
                textShadow: isHighlighted(topic.author) ? `0 0 10px ${rankColor(topic.author)}80` : undefined,
              }}
            >
              {topic.author.username}
            </span>
            <RankBadge author={topic.author} />
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} /> <When date={topic.lastActivityAt} />
          </span>
          <span className="flex items-center gap-1 sm:hidden">
            <MessageSquare size={12} /> {topic.commentCount}
          </span>
          {topic.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[#E0E0E0]/70">#{tag}</span>
          ))}
        </div>
      </div>
      <div className="hidden shrink-0 items-center gap-4 text-xs text-[#A0A0A0] sm:flex">
        <span className="flex items-center gap-1" title="Comentários">
          <MessageSquare size={14} /> {topic.commentCount}
        </span>
        <span className="flex items-center gap-1" title="Visualizações">
          <Eye size={14} /> {topic.views}
        </span>
      </div>
    </Link>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="py-12 text-center text-[#A0A0A0]">
      <MessageSquare size={40} className="mx-auto mb-4 opacity-30" aria-hidden="true" />
      <p className="text-lg font-medium text-white">{title}</p>
      {description && <p className="mt-1 text-sm">{description}</p>}
    </div>
  );
}

export function Paginator({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Paginação" className="mt-8 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
        className="rounded-lg border border-white/10 p-2 text-[#A0A0A0] transition-colors hover:text-white disabled:opacity-30"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="px-3 text-sm text-[#A0A0A0]">
        Página {page} de {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Próxima página"
        className="rounded-lg border border-white/10 p-2 text-[#A0A0A0] transition-colors hover:text-white disabled:opacity-30"
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}

/** HTML já seguro, gerado por renderMarkdown no servidor ou na pré-visualização */
export function MarkdownBody({ html, className = "" }: { html: string; className?: string }) {
  return <div className={`forum-markdown ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

export const inputClass =
  "w-full rounded-lg border border-white/20 bg-bg-card/50 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none";

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-green-cs px-5 py-2 text-sm font-bold text-white transition-all hover:bg-green-dark disabled:opacity-50";

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm text-[#E0E0E0] transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50";
