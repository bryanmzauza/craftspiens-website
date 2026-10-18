"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Search, Plus, Loader2, X, Flag } from "lucide-react";
import { NewTopicDialog } from "@/components/comunidade/NewTopicDialog";
import {
  api,
  EmptyState,
  inputClass,
  Paginator,
  primaryButtonClass,
  secondaryButtonClass,
  TopicRow,
  type Pagination,
  type TopicSummary,
} from "@/components/comunidade/shared";
import { PageHero } from "@/components/ui/PageHero";
import {
  REPORTS_CATEGORY_SLUG,
  TOPIC_FILTERS,
  TOPIC_SORTS,
  type TopicFilter,
  type TopicSort,
} from "@/lib/forum/constants";

interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  staffOnly: boolean;
}

interface TopicsResponse {
  category: CategoryInfo;
  topics: TopicSummary[];
  pagination: Pagination;
}

const SORT_LABELS: Record<TopicSort, string> = {
  atividade: "Última atividade",
  recentes: "Mais recentes",
  comentados: "Mais comentados",
  vistos: "Mais vistos",
};

const FILTER_LABELS: Record<TopicFilter, string> = {
  todos: "Todos",
  abertos: "Em aberto",
  resolvidos: "Resolvidos",
  "sem-resposta": "Sem resposta",
};

export function CategoriaContent({ categoriaSlug }: { categoriaSlug: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const busca = searchParams.get("busca") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const page = Math.max(1, Number(searchParams.get("pagina") ?? 1) || 1);
  const ordemParam = searchParams.get("ordem") as TopicSort | null;
  const filtroParam = searchParams.get("filtro") as TopicFilter | null;
  const ordem: TopicSort = ordemParam && TOPIC_SORTS.includes(ordemParam) ? ordemParam : "atividade";
  const filtro: TopicFilter = filtroParam && TOPIC_FILTERS.includes(filtroParam) ? filtroParam : "todos";

  const [query, setQuery] = useState(busca);
  const [category, setCategory] = useState<CategoryInfo | null>(null);
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [newTopicOpen, setNewTopicOpen] = useState(false);

  // Cada combinação de parâmetros é uma consulta; enquanto a atual não chega, mostra o carregamento
  const key = `${categoriaSlug}|${busca}|${tag}|${page}|${ordem}|${filtro}`;
  const loading = loadedKey !== key;

  // O campo de busca segue a URL (ajuste de estado durante o render)
  const [prevBusca, setPrevBusca] = useState(busca);
  if (prevBusca !== busca) {
    setPrevBusca(busca);
    setQuery(busca);
  }

  const role = session?.user?.role;
  const staff = role === "ADMIN" || role === "MODERADOR" || role === "PROFESSOR";
  const isReports = categoriaSlug === REPORTS_CATEGORY_SLUG;

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ categoria: categoriaSlug, pagina: String(page), ordem, filtro });
    if (busca) params.set("busca", busca);
    if (tag) params.set("tag", tag);
    api<TopicsResponse>(`/api/forum/topicos?${params}`).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setCategory(res.data.category);
        setTopics(res.data.topics);
        setPagination(res.data.pagination);
      } else if (res.status === 404) {
        setNotFound(true);
      }
      setLoadedKey(key);
    });
    return () => {
      cancelled = true;
    };
  }, [categoriaSlug, busca, tag, page, ordem, filtro, key]);

  const navigate = useCallback(
    (next: Partial<{ busca: string; tag: string; pagina: number; ordem: TopicSort; filtro: TopicFilter }>) => {
      const merged = { busca, tag, ordem, filtro, pagina: 1, ...next };
      const params = new URLSearchParams();
      if (merged.busca) params.set("busca", merged.busca);
      if (merged.tag) params.set("tag", merged.tag);
      if (merged.ordem !== "atividade") params.set("ordem", merged.ordem);
      if (merged.filtro !== "todos") params.set("filtro", merged.filtro);
      if (merged.pagina > 1) params.set("pagina", String(merged.pagina));
      const qs = params.toString();
      router.push(qs ? `/comunidade/${categoriaSlug}?${qs}` : `/comunidade/${categoriaSlug}`);
    },
    [router, categoriaSlug, busca, tag, ordem, filtro]
  );

  if (notFound) {
    return (
      <>
        <PageHero
          title="COMUNIDADE"
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Comunidade", href: "/comunidade" }, { label: "Categoria" }]}
        />
        <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
          <EmptyState title="Categoria não encontrada" />
          <div className="text-center">
            <Link href="/comunidade" className={secondaryButtonClass}>
              Voltar para a comunidade
            </Link>
          </div>
        </div>
      </>
    );
  }

  const canCreate = !!session?.user && (!category?.staffOnly || staff);

  return (
    <>
      <PageHero
        title={category?.name.toUpperCase() ?? "COMUNIDADE"}
        subtitle={category?.description ?? ""}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Comunidade", href: "/comunidade" },
          { label: category?.name ?? "..." },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        {isReports && (
          <div className="mb-6 flex gap-3 rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-[#E0E0E0]">
            <Flag size={18} className="mt-0.5 shrink-0 text-error" aria-hidden="true" />
            <div>
              <p className="font-bold text-white">Como denunciar</p>
              <p className="mt-1">
                Informe o nick de quem você está denunciando, o que aconteceu, quando, e inclua provas (links de
                imagens ou vídeos). As denúncias são públicas; se o assunto for sensível, a moderação pode torná-la
                privada, visível só para você e para a equipe. Denúncias falsas podem resultar em suspensão.
              </p>
            </div>
          </div>
        )}

        {/* Busca, filtros e novo tópico */}
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
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
              placeholder="Buscar nesta categoria..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar nesta categoria"
              className={`${inputClass} pl-10`}
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={ordem}
              onChange={(e) => navigate({ ordem: e.target.value as TopicSort })}
              aria-label="Ordenar por"
              className="rounded-lg border border-white/20 bg-bg-card/50 px-3 py-2.5 text-sm text-white focus:border-green-cs focus:outline-none"
            >
              {TOPIC_SORTS.map((s) => (
                <option key={s} value={s} className="bg-bg-primary">
                  {SORT_LABELS[s]}
                </option>
              ))}
            </select>
            <select
              value={filtro}
              onChange={(e) => navigate({ filtro: e.target.value as TopicFilter })}
              aria-label="Filtrar"
              className="rounded-lg border border-white/20 bg-bg-card/50 px-3 py-2.5 text-sm text-white focus:border-green-cs focus:outline-none"
            >
              {TOPIC_FILTERS.map((f) => (
                <option key={f} value={f} className="bg-bg-primary">
                  {FILTER_LABELS[f]}
                </option>
              ))}
            </select>
            {canCreate ? (
              <button type="button" onClick={() => setNewTopicOpen(true)} className={primaryButtonClass}>
                <Plus size={16} /> {isReports ? "Nova denúncia" : "Novo tópico"}
              </button>
            ) : !session?.user ? (
              <Link href={`/login?redirect=/comunidade/${categoriaSlug}`} className={primaryButtonClass}>
                Entrar para participar
              </Link>
            ) : null}
          </div>
        </div>

        {(busca || tag) && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-[#A0A0A0]">
            {busca && (
              <span>
                Resultados para <span className="text-white">&quot;{busca}&quot;</span>
              </span>
            )}
            {tag && (
              <span>
                Tag <span className="text-white">#{tag}</span>
              </span>
            )}
            <span>({pagination.total})</span>
            <button type="button" onClick={() => navigate({ busca: "", tag: "" })} className="flex items-center gap-1 text-green-cs hover:underline">
              <X size={14} /> limpar
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-green-cs" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {topics.map((topic, i) => (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 10) * 0.03 }}
                >
                  <TopicRow topic={topic} />
                </motion.div>
              ))}

              {topics.length === 0 && (
                <EmptyState
                  title={busca || tag || filtro !== "todos" ? "Nenhum tópico encontrado" : "Nenhum tópico ainda"}
                  description={
                    busca || tag || filtro !== "todos"
                      ? "Tente outros termos ou filtros."
                      : canCreate
                        ? "Seja a primeira pessoa a criar um tópico nesta categoria."
                        : undefined
                  }
                />
              )}
            </div>

            <Paginator page={pagination.page} totalPages={pagination.totalPages} onChange={(p) => navigate({ pagina: p })} />
          </>
        )}
      </div>

      <NewTopicDialog
        open={newTopicOpen}
        onClose={() => setNewTopicOpen(false)}
        defaultCategorySlug={categoriaSlug}
        role={role}
      />
    </>
  );
}
