"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  MessageSquare,
  Users,
  TrendingUp,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  staffOnly: boolean;
  topicCount: number;
  lastPost: {
    title: string;
    author: string;
    date: string;
  } | null;
}

interface CategoriesResponse {
  categories: Category[];
  stats: {
    totalTopics: number;
    totalMembers: number;
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

export function ComunidadeContent() {
  const [busca, setBusca] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState({ totalTopics: 0, totalMembers: 0 });
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/forum/categorias");
      if (!res.ok) throw new Error();
      const data: CategoriesResponse = await res.json();
      setCategories(data.categories);
      setStats(data.stats);
    } catch {
      // Silently fail — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredCategories = busca.trim()
    ? categories.filter(
        (c) =>
          c.name.toLowerCase().includes(busca.toLowerCase()) ||
          (c.description ?? "").toLowerCase().includes(busca.toLowerCase())
      )
    : categories;

  return (
    <>
      <PageHero
        title="COMUNIDADE"
        subtitle="Participe das discussões, tire dúvidas e conecte-se com outros jogadores."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Comunidade" }]}
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        {/* Busca */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]" />
            <input
              type="text"
              placeholder="Buscar no fórum..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-bg-card/50 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
            />
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-green-cs" />
          </div>
        ) : (
          <>
            {/* Lista de Categorias */}
            <div className="space-y-2">
              {filteredCategories.map((cat, i) => (
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
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 text-xl">
                      <span>{cat.icon ?? "💬"}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white">{cat.name}</h3>
                        {cat.staffOnly && (
                          <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-500">
                            STAFF
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#A0A0A0]">{cat.description}</p>
                    </div>

                    <div className="hidden shrink-0 items-center gap-6 text-xs text-[#A0A0A0] sm:flex">
                      <div className="text-center">
                        <p className="font-bold text-white">{cat.topicCount}</p>
                        <p>tópicos</p>
                      </div>
                    </div>

                    <div className="hidden shrink-0 text-right lg:block">
                      {cat.lastPost ? (
                        <>
                          <p className="max-w-[200px] truncate text-sm text-white">
                            {cat.lastPost.title}
                          </p>
                          <p className="text-xs text-[#A0A0A0]">
                            {cat.lastPost.author} · {timeAgo(cat.lastPost.date)}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-[#A0A0A0]">Nenhum tópico ainda</p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}

              {filteredCategories.length === 0 && !loading && (
                <div className="py-12 text-center text-[#A0A0A0]">
                  <MessageSquare size={40} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Nenhuma categoria encontrada</p>
                </div>
              )}
            </div>

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
                <TrendingUp size={16} className="text-green-cs" />
                <span className="font-bold text-white">—</span> comentários
              </div>
              <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                <Users size={16} className="text-green-cs" />
                <span className="font-bold text-white">{stats.totalMembers}</span> membros
              </div>
            </motion.div>
          </>
        )}
      </div>
    </>
  );
}
