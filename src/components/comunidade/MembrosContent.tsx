"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Loader2, MessageSquare, MessagesSquare, Ban, X } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import {
  api,
  type Author,
  Avatar,
  EmptyState,
  inputClass,
  Paginator,
  RoleBadge,
  ROLE_LABELS,
  When,
  type Pagination,
} from "@/components/comunidade/shared";

interface Member extends Author {
  joinedAt: string;
  postCount: number;
  commentCount: number;
  banned: boolean;
}

interface MembersResponse {
  members: Member[];
  pagination: Pagination;
}

const SORTS = [
  { value: "ativos", label: "Mais ativos" },
  { value: "recentes", label: "Entraram há menos tempo" },
  { value: "antigos", label: "Entraram há mais tempo" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

export function MembrosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const busca = searchParams.get("busca") ?? "";
  const page = Math.max(1, Number(searchParams.get("pagina") ?? 1) || 1);
  const ordemParam = searchParams.get("ordem");
  const ordem: Sort = SORTS.some((s) => s.value === ordemParam) ? (ordemParam as Sort) : "ativos";

  const [query, setQuery] = useState(busca);
  const [data, setData] = useState<{ key: string; value: MembersResponse } | null>(null);

  const key = `${busca}|${ordem}|${page}`;
  const current = data?.key === key ? data.value : null;

  // O campo de busca segue a URL (ajuste de estado durante o render)
  const [prevBusca, setPrevBusca] = useState(busca);
  if (prevBusca !== busca) {
    setPrevBusca(busca);
    setQuery(busca);
  }

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ pagina: String(page), ordem });
    if (busca) params.set("busca", busca);
    api<MembersResponse>(`/api/forum/membros?${params}`).then((res) => {
      if (cancelled) return;
      setData({
        key,
        value: res.ok ? res.data : { members: [], pagination: { page: 1, limit: 24, total: 0, totalPages: 1 } },
      });
    });
    return () => {
      cancelled = true;
    };
  }, [busca, ordem, page, key]);

  const navigate = useCallback(
    (next: Partial<{ busca: string; ordem: Sort; pagina: number }>) => {
      const merged = { busca, ordem, pagina: 1, ...next };
      const params = new URLSearchParams();
      if (merged.busca) params.set("busca", merged.busca);
      if (merged.ordem !== "ativos") params.set("ordem", merged.ordem);
      if (merged.pagina > 1) params.set("pagina", String(merged.pagina));
      const qs = params.toString();
      router.push(qs ? `/comunidade/membros?${qs}` : "/comunidade/membros");
    },
    [router, busca, ordem]
  );

  return (
    <>
      <PageHero
        title="MEMBROS"
        subtitle="Quem participa da comunidade. Clique num membro para ver os posts e comentários dele."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Comunidade", href: "/comunidade" }, { label: "Membros" }]}
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ busca: query.trim() });
            }}
            className="relative flex-1"
          >
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]" aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar pelo nick..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              maxLength={16}
              aria-label="Buscar membro pelo nick"
              className={`${inputClass} pl-10`}
            />
          </form>
          <select
            value={ordem}
            onChange={(e) => navigate({ ordem: e.target.value as Sort })}
            aria-label="Ordenar por"
            className="rounded-lg border border-white/20 bg-bg-card/50 px-3 py-2.5 text-sm text-white focus:border-green-cs focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value} className="bg-bg-primary">
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {current && (
          <p className="mb-4 flex flex-wrap items-center gap-2 text-sm text-[#A0A0A0]">
            {busca ? (
              <>
                <span>
                  Resultados para <span className="text-white">&quot;{busca}&quot;</span> ({current.pagination.total})
                </span>
                <button type="button" onClick={() => navigate({ busca: "" })} className="flex items-center gap-1 text-green-cs hover:underline">
                  <X size={14} /> limpar
                </button>
              </>
            ) : (
              <span>{current.pagination.total} membros com nick vinculado</span>
            )}
          </p>
        )}

        {!current ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-green-cs" />
          </div>
        ) : current.members.length === 0 ? (
          <EmptyState title="Nenhum membro encontrado" description={busca ? "Confira o nick e tente de novo." : undefined} />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {current.members.map((m, i) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.02 }}>
                  <Link
                    href={`/comunidade/membro/${m.username}`}
                    className="flex h-full items-center gap-3 rounded-xl border border-white/10 bg-bg-card/50 p-4 transition-all hover:border-white/20 hover:bg-bg-card/80"
                  >
                    <Avatar author={m} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`truncate font-bold ${ROLE_LABELS[m.role] ? "text-warning" : "text-white"}`}>{m.username}</span>
                        <RoleBadge role={m.role} />
                        {m.banned && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-error/20 px-1.5 py-0.5 text-[10px] font-bold text-error">
                            <Ban size={10} /> Suspenso
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[#A0A0A0]">
                        <span className="flex items-center gap-1" title="Posts">
                          <MessageSquare size={12} /> {m.postCount}
                        </span>
                        <span className="flex items-center gap-1" title="Comentários">
                          <MessagesSquare size={12} /> {m.commentCount}
                        </span>
                        <span>
                          entrou <When date={m.joinedAt} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            <Paginator page={current.pagination.page} totalPages={current.pagination.totalPages} onChange={(p) => navigate({ pagina: p })} />
          </>
        )}
      </div>
    </>
  );
}
