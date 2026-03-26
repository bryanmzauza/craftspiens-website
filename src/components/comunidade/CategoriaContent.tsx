"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MessageSquare,
  Eye,
  Pin,
  Lock,
  CheckCircle,
  Plus,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { PageHero } from "@/components/ui/PageHero";

interface TopicAuthor {
  id: string;
  username: string;
  uuid: string | null;
  role: string;
}

interface Topic {
  id: string;
  title: string;
  slug: string;
  pinned: boolean;
  locked: boolean;
  resolved: boolean;
  views: number;
  tags: string[];
  commentCount: number;
  lastActivityAt: string;
  createdAt: string;
  author: TopicAuthor;
}

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
  topics: Topic[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d atrás`;
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MODERADOR: "Moderador",
  PROFESSOR: "Professor",
};

export function CategoriaContent({ categoriaSlug }: { categoriaSlug: string }) {
  const { data: session } = useSession();
  const [category, setCategory] = useState<CategoryInfo | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: "", content: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const fetchTopics = useCallback(async (page: number = 1, search?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ categoria: categoriaSlug, page: String(page) });
      if (search) params.set("busca", search);
      const res = await fetch(`/api/forum/topicos?${params}`);
      if (!res.ok) throw new Error();
      const data: TopicsResponse = await res.json();
      setCategory(data.category);
      setTopics(data.topics);
      setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages, total: data.pagination.total });
    } catch {
      // show empty state
    } finally {
      setLoading(false);
    }
  }, [categoriaSlug]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTopics(1, busca.trim() || undefined);
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;
    setCreating(true);
    setCreateError("");

    try {
      const res = await fetch("/api/forum/topicos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: category.id,
          title: newTopic.title,
          content: newTopic.content,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setCreateError(data.error || "Erro ao criar tópico");
        return;
      }

      setShowNewTopicModal(false);
      setNewTopic({ title: "", content: "" });
      fetchTopics(1);
    } catch {
      setCreateError("Erro de conexão");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <PageHero
        title={category?.name ?? "COMUNIDADE"}
        subtitle={category?.description ?? ""}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Comunidade", href: "/comunidade" },
          { label: category?.name ?? "..." },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        {/* Header com busca e botão novo tópico */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]" />
            <input
              type="text"
              placeholder="Buscar nesta categoria..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full max-w-md rounded-xl border border-white/20 bg-bg-card/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
            />
          </form>
          {session?.user && (!category?.staffOnly || ["MODERADOR", "ADMIN", "PROFESSOR"].includes(session.user.role)) && (
            <button
              onClick={() => setShowNewTopicModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-green-cs px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-green-dark"
            >
              <Plus size={16} /> Novo Tópico
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-green-cs" />
          </div>
        ) : (
          <>
            {/* Lista de Tópicos */}
            <div className="space-y-2">
              {topics.map((topic, i) => {
                const roleLabel = ROLE_LABELS[topic.author.role];
                return (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Link
                      href={`/comunidade/${categoriaSlug}/${topic.slug}`}
                      className="flex items-center gap-4 rounded-xl border border-white/10 bg-bg-card/50 p-4 transition-all hover:border-white/20 hover:bg-bg-card/80"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {topic.pinned && <Pin size={14} className="shrink-0 text-yellow-500" />}
                          {topic.locked && <Lock size={14} className="shrink-0 text-[#A0A0A0]" />}
                          {topic.resolved && <CheckCircle size={14} className="shrink-0 text-green-cs" />}
                          <h3 className="font-medium text-white">{topic.title}</h3>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#A0A0A0]">
                          <span className="flex items-center gap-1">
                            {topic.author.uuid && (
                              <img
                                src={`https://mc-heads.net/avatar/${topic.author.uuid}/16`}
                                alt=""
                                className="h-4 w-4 rounded"
                              />
                            )}
                            <span className={roleLabel ? "font-bold text-yellow-500" : ""}>
                              {topic.author.username}
                            </span>
                          </span>
                          {roleLabel && (
                            <span className="rounded bg-yellow-500/20 px-1 py-0.5 text-[9px] font-bold text-yellow-500">
                              {roleLabel}
                            </span>
                          )}
                          <span>·</span>
                          <span className="flex items-center gap-0.5">
                            <Clock size={12} /> {timeAgo(topic.lastActivityAt)}
                          </span>
                        </div>
                      </div>

                      <div className="hidden shrink-0 items-center gap-4 text-xs text-[#A0A0A0] sm:flex">
                        <div className="flex items-center gap-1">
                          <MessageSquare size={14} />
                          <span>{topic.commentCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye size={14} />
                          <span>{topic.views}</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}

              {topics.length === 0 && (
                <div className="py-12 text-center text-[#A0A0A0]">
                  <MessageSquare size={40} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Nenhum tópico ainda</p>
                  <p className="text-sm">Seja o primeiro a criar um tópico nesta categoria!</p>
                </div>
              )}
            </div>

            {/* Paginação */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => fetchTopics(pagination.page - 1, busca || undefined)}
                  disabled={pagination.page <= 1}
                  className="rounded-lg border border-white/10 p-2 text-[#A0A0A0] transition-colors hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="px-3 text-sm text-[#A0A0A0]">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchTopics(pagination.page + 1, busca || undefined)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="rounded-lg border border-white/10 p-2 text-[#A0A0A0] transition-colors hover:text-white disabled:opacity-30"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Novo Tópico */}
      <AnimatePresence>
        {showNewTopicModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowNewTopicModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl border border-white/10 bg-bg-primary p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Novo Tópico em {category?.name}</h2>
                <button onClick={() => setShowNewTopicModal(false)} className="text-[#A0A0A0] hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateTopic} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#A0A0A0]">Título</label>
                  <input
                    type="text"
                    maxLength={200}
                    value={newTopic.title}
                    onChange={(e) => setNewTopic((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Título do tópico (máx 200 caracteres)"
                    className="w-full rounded-lg border border-white/20 bg-bg-card/50 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
                    required
                  />
                  <p className="mt-1 text-right text-xs text-[#A0A0A0]">{newTopic.title.length}/200</p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#A0A0A0]">Conteúdo</label>
                  <textarea
                    value={newTopic.content}
                    onChange={(e) => setNewTopic((p) => ({ ...p, content: e.target.value }))}
                    placeholder="Escreva o conteúdo do seu tópico (mín 20 caracteres)..."
                    rows={8}
                    className="w-full resize-y rounded-lg border border-white/20 bg-bg-card/50 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
                    required
                    minLength={20}
                  />
                </div>

                {createError && (
                  <p className="text-sm text-error">{createError}</p>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewTopicModal(false)}
                    className="rounded-lg border border-white/20 px-4 py-2 text-sm text-[#A0A0A0] transition-colors hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creating || newTopic.title.length === 0 || newTopic.content.length < 20}
                    className="flex items-center gap-2 rounded-lg bg-green-cs px-6 py-2 text-sm font-bold text-white transition-all hover:bg-green-dark disabled:opacity-50"
                  >
                    {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Publicar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
