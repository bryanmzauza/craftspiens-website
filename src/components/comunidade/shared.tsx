"use client";

// Peças compartilhadas pelas páginas da comunidade: autores, tags, listas de
// tópicos, paginação, chamadas à API e avisos de acesso.

import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye, Lock, MessageSquare, Pin, CheckCircle, EyeOff, Clock } from "lucide-react";
import { timeAgo, fullDate } from "@/lib/forum/time";

export interface Author {
  id: string;
  username: string;
  uuid: string | null;
  role: string;
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

export function Avatar({ author, size = 32, className = "" }: { author: Author; size?: number; className?: string }) {
  if (author.uuid) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatar externo (mc-heads.net)
      <img
        src={`https://mc-heads.net/avatar/${author.uuid}/${size}`}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 rounded-md ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-md bg-white/10 font-bold text-white ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(10, size / 2.2) }}
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

/** Nick com link para a página do membro */
export function AuthorName({ author, className = "" }: { author: Author; className?: string }) {
  const staff = !!ROLE_LABELS[author.role];
  return (
    <Link
      href={`/comunidade/membro/${author.username}`}
      className={`font-bold hover:underline ${staff ? "text-warning" : "text-white"} ${className}`}
    >
      {author.username}
    </Link>
  );
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
      <Avatar author={topic.author} size={36} className="mt-0.5" />
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
            <span className={ROLE_LABELS[topic.author.role] ? "font-bold text-warning" : "font-medium text-[#E0E0E0]"}>
              {topic.author.username}
            </span>
            <RoleBadge role={topic.author.role} />
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
