"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Search, MessageSquare, Users, MessagesSquare, Loader2, Plus, X, ShieldCheck, Bell, Flag } from "lucide-react";
import { CategoryIcon } from "@/components/comunidade/CategoryIcon";
import { NewTopicDialog } from "@/components/comunidade/NewTopicDialog";
import {
  api,
  EmptyState,
  inputClass,
  Paginator,
  primaryButtonClass,
  secondaryButtonClass,
  TopicRow,
  When,
  type Pagination,
  type TopicSummary,
} from "@/components/comunidade/shared";
import { PageHero } from "@/components/ui/PageHero";
import { REPORTS_CATEGORY_SLUG } from "@/lib/forum/constants";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  staffOnly: boolean;
  topicCount: number;
  commentCount: number;
  lastPost: { title: string; slug: string; author: string; date: string } | null;
}

interface CategoriesResponse {
  categories: Category[];
  stats: { totalTopics: number; totalComments: number; totalMembers: number };
}

interface TopicsResponse {
  topics: TopicSummary[];
  pagination: Pagination;
}

export function ComunidadeContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const busca = searchParams.get("busca") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const page = Math.max(1, Number(searchParams.get("pagina") ?? 1) || 1);

  const [query, setQuery] = useState(busca);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState({ totalTopics: 0, totalComments: 0, totalMembers: 0 });
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState<TopicSummary[]>([]);
  const [results, setResults] = useState<{ key: string; data: TopicsResponse } | null>(null);
  const [newTopicOpen, setNewTopicOpen] = useState(false);

  const role = session?.user?.role;
  const moderator = role === "ADMIN" || role === "MODERADOR";
  const searchMode = busca.length > 0 || tag.length > 0;
  const searchKey = `${busca}|${tag}|${page}`;
  const searching = searchMode && results?.key !== searchKey;
  const searchResults = results?.key === searchKey ? results.data : null;

  // O campo de busca segue a URL (ajuste de estado durante o render)
  const [prevBusca, setPrevBusca] = useState(busca);
  if (prevBusca !== busca) {
    setPrevBusca(busca);
    setQuery(busca);
  }

  useEffect(() => {
    api<CategoriesResponse>("/api/forum/categorias").then((res) => {
      if (res.ok) {
        setCategories(res.data.categories);
        setStats(res.data.stats);
      }
      setLoading(false);
    });
    api<TopicsResponse>("/api/forum/topicos?limite=6&ordem=atividade").then((res) => {
      if (res.ok) setRecent(res.data.topics);
    });
  }, []);

  useEffect(() => {
    if (!searchMode) return;
    let cancelled = false;
    const params = new URLSearchParams({ pagina: String(page) });
    if (busca) params.set("busca", busca);
    if (tag) params.set("tag", tag);
    api<TopicsResponse>(`/api/forum/topicos?${params}`).then((res) => {
      if (cancelled) return;
      setResults({
        key: searchKey,
        data: res.ok ? res.data : { topics: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } },
      });
    });
    return () => {
      cancelled = true;
    };
  }, [busca, tag, page, searchMode, searchKey]);

  const navigate = useCallback(
    (next: { busca?: string; tag?: string; pagina?: number }) => {
      const params = new URLSearchParams();
      if (next.busca) params.set("busca", next.busca);
      if (next.tag) params.set("tag", next.tag);
      if (next.pagina && next.pagina > 1) params.set("pagina", String(next.pagina));
      const qs = params.toString();
      router.push(qs ? `/comunidade?${qs}` : "/comunidade");
    },
    [router]
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ busca: query.trim(), tag });
  }

  return (
    <>
      <PageHero
        title="COMUNIDADE"
        subtitle="Participe das discussões, tire dúvidas e conecte-se com outros jogadores."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Comunidade" }]}
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        {/* Busca e ações */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]" aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar em todo o fórum..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar no fórum"
              className={`${inputClass} pl-10`}
            />
          </form>
          <div className="flex flex-wrap items-center gap-2">
            {session?.user ? (
              <>
                <Link href="/comunidade/notificacoes" className={secondaryButtonClass}>
                  <Bell size={16} /> Notificações
                </Link>
                {moderator && (
                  <Link href="/comunidade/moderacao" className={secondaryButtonClass}>
                    <ShieldCheck size={16} /> Moderação
                  </Link>
                )}
                <button type="button" onClick={() => setNewTopicOpen(true)} className={primaryButtonClass}>
                  <Plus size={16} /> Novo tópico
                </button>
              </>
            ) : (
              <Link href="/login?redirect=/comunidade" className={primaryButtonClass}>
                Entrar para participar
              </Link>
            )}
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-green-cs" />
          </div>
        ) : searchMode ? (
          <section aria-label="Resultados da busca">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-white">
                {busca ? `Resultados para "${busca}"` : `Tópicos com #${tag}`}
                {searchResults && <span className="ml-2 text-sm font-normal text-[#A0A0A0]">({searchResults.pagination.total})</span>}
              </h2>
              <button type="button" onClick={() => navigate({})} className={secondaryButtonClass}>
                <X size={14} /> Limpar busca
              </button>
            </div>
            {searching ? (
              <div className="flex justify-center py-12">
                <Loader2 size={28} className="animate-spin text-green-cs" />
              </div>
            ) : searchResults && searchResults.topics.length > 0 ? (
              <>
                <div className="space-y-2">
                  {searchResults.topics.map((topic) => (
                    <TopicRow key={topic.id} topic={topic} showCategory />
                  ))}
                </div>
                <Paginator
                  page={searchResults.pagination.page}
                  totalPages={searchResults.pagination.totalPages}
                  onChange={(p) => navigate({ busca, tag, pagina: p })}
                />
              </>
            ) : (
              <EmptyState title="Nada encontrado" description="Tente outras palavras ou navegue pelas categorias." />
            )}
          </section>
        ) : (
          <>
            {/* Categorias */}
            <section aria-label="Categorias" className="space-y-2">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    href={`/comunidade/${cat.slug}`}
                    className="flex w-full items-center gap-4 rounded-xl border border-white/10 bg-bg-card/50 p-4 text-left transition-all hover:border-white/20 hover:bg-bg-card/80"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5">
                      <CategoryIcon icon={cat.icon} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-white">{cat.name}</h3>
                        {cat.staffOnly && (
                          <span className="rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-bold text-warning">
                            EQUIPE
                          </span>
                        )}
                        {cat.slug === REPORTS_CATEGORY_SLUG && (
                          <Flag size={12} className="text-error" aria-hidden="true" />
                        )}
                      </div>
                      <p className="text-sm text-[#A0A0A0]">{cat.description}</p>
                      <p className="mt-1 text-xs text-[#A0A0A0] sm:hidden">
                        {cat.topicCount} tópicos · {cat.commentCount} comentários
                      </p>
                    </div>

                    <div className="hidden shrink-0 items-center gap-6 text-xs text-[#A0A0A0] sm:flex">
                      <div className="w-14 text-center">
                        <p className="font-bold text-white">{cat.topicCount}</p>
                        <p>tópicos</p>
                      </div>
                      <div className="w-16 text-center">
                        <p className="font-bold text-white">{cat.commentCount}</p>
                        <p>comentários</p>
                      </div>
                    </div>

                    <div className="hidden w-56 shrink-0 text-right lg:block">
                      {cat.lastPost ? (
                        <>
                          <p className="truncate text-sm text-white">{cat.lastPost.title}</p>
                          <p className="text-xs text-[#A0A0A0]">
                            {cat.lastPost.author} · <When date={cat.lastPost.date} />
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-[#A0A0A0]">Nenhum tópico ainda</p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}

              {categories.length === 0 && (
                <EmptyState title="Nenhuma categoria encontrada" description="As categorias do fórum ainda não foram criadas." />
              )}
            </section>

            {/* Atividade recente */}
            {recent.length > 0 && (
              <section aria-label="Atividade recente" className="mt-10">
                <h2 className="mb-3 text-lg font-bold text-white">Atividade recente</h2>
                <div className="space-y-2">
                  {recent.map((topic) => (
                    <TopicRow key={topic.id} topic={topic} showCategory />
                  ))}
                </div>
              </section>
            )}

            {/* Estatísticas */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-6 rounded-xl border border-white/10 bg-bg-card/30 p-4"
            >
              <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                <MessageSquare size={16} className="text-green-cs" />
                <span className="font-bold text-white">{stats.totalTopics}</span> tópicos
              </div>
              <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                <MessagesSquare size={16} className="text-green-cs" />
                <span className="font-bold text-white">{stats.totalComments}</span> comentários
              </div>
              <Link
                href="/comunidade/membros"
                className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-[#A0A0A0] transition-colors hover:bg-white/5 hover:text-white"
                title="Ver a lista de membros"
              >
                <Users size={16} className="text-green-cs" />
                <span className="font-bold text-white">{stats.totalMembers}</span> membros
              </Link>
            </motion.div>
          </>
        )}
      </div>

      <NewTopicDialog
        open={newTopicOpen}
        onClose={() => setNewTopicOpen(false)}
        categories={categories}
        role={role}
      />
    </>
  );
}
