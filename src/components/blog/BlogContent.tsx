"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Calendar,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  tags: string[];
  readTime: number;
  category: { name: string; slug: string };
  author: { username: string; uuid: string | null } | null;
  publishedAt: string | null;
}

const CATEGORIAS = [
  { nome: "Todos", slug: "todos", cor: "#FFFFFF" },
  { nome: "Novidades", slug: "novidades", cor: "#4CAF50" },
  { nome: "Aulas", slug: "aulas", cor: "#2196F3" },
  { nome: "Eventos", slug: "eventos", cor: "#FF9800" },
  { nome: "Mídia", slug: "midia", cor: "#E91E63" },
  { nome: "Tutoriais", slug: "tutoriais", cor: "#9C27B0" },
  { nome: "Comunidade", slug: "comunidade", cor: "#00BCD4" },
];

const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  CATEGORIAS.filter((c) => c.slug !== "todos").map((c) => [c.slug, c.cor])
);

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const POSTS_PER_PAGE = 9;

export function BlogContent() {
  const [categoriaAtiva, setCategoriaAtiva] = useState("todos");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagina),
        limit: String(POSTS_PER_PAGE),
      });
      if (categoriaAtiva !== "todos") params.set("categoria", categoriaAtiva);
      if (busca.trim()) params.set("busca", busca.trim());

      const res = await fetch(`/api/blog?${params}`);
      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      setPosts(data.posts);
      setTotalPages(data.pagination.totalPages);
    } catch {
      setPosts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [pagina, categoriaAtiva, busca]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const featuredPost = pagina === 1 && !busca ? posts[0] : null;
  const gridPosts = featuredPost ? posts.slice(1) : posts;

  return (
    <>
      <PageHero
        title="BLOG"
        subtitle="Novidades, atualizações e muito conteúdo."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Blog" }]}
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        {/* Busca */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]" />
            <input
              type="text"
              placeholder="Buscar no blog..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
              className="w-full rounded-xl border border-white/20 bg-bg-card/50 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
            />
          </div>
        </motion.div>

        {/* Categorias */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8 flex flex-wrap gap-2"
        >
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => {
                setCategoriaAtiva(cat.slug);
                setPagina(1);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                categoriaAtiva === cat.slug
                  ? "text-white"
                  : "text-[#A0A0A0] hover:text-white"
              }`}
              style={
                categoriaAtiva === cat.slug
                  ? { backgroundColor: `${cat.cor}20`, color: cat.cor }
                  : {}
              }
            >
              {cat.nome}
            </button>
          ))}
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-green-cs" />
          </div>
        ) : (
          <>
            {/* Post em destaque */}
            {featuredPost && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
              >
                <Link href={`/blog/${featuredPost.slug}`}>
                  <div className="group overflow-hidden rounded-2xl border border-white/10 bg-bg-card/50 transition-all hover:border-white/20">
                    <div className="aspect-[21/9] bg-gradient-to-br from-bg-accent to-bg-card">
                      <div className="flex h-full items-center justify-center text-[#A0A0A0]">
                        <span className="text-sm">Imagem de capa</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <span
                        className="inline-block rounded px-2.5 py-0.5 text-xs font-bold uppercase"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[featuredPost.category.slug] ?? "#fff"}20`,
                          color: CATEGORY_COLORS[featuredPost.category.slug] ?? "#fff",
                        }}
                      >
                        {featuredPost.category.name}
                      </span>
                      <h2 className="mt-3 text-xl font-bold text-white transition-colors group-hover:text-green-cs sm:text-2xl">
                        {featuredPost.title}
                      </h2>
                      <p className="mt-2 text-sm text-[#A0A0A0] line-clamp-2">
                        {featuredPost.excerpt}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#A0A0A0]">
                        {featuredPost.author && (
                          <span className="flex items-center gap-1">
                            <User size={14} /> {featuredPost.author.username}
                          </span>
                        )}
                        {featuredPost.publishedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar size={14} /> {formatDate(featuredPost.publishedAt)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> {featuredPost.readTime} min de leitura
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Grid de posts */}
            {gridPosts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {gridPosts.map((post, i) => {
                  const catColor = CATEGORY_COLORS[post.category.slug] ?? "#fff";
                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                    >
                      <Link href={`/blog/${post.slug}`}>
                        <div className="group h-full overflow-hidden rounded-xl border border-white/10 bg-bg-card/50 transition-all hover:border-white/20 hover:shadow-lg">
                          <div className="aspect-video bg-gradient-to-br from-bg-accent to-bg-card">
                            <div className="flex h-full items-center justify-center text-[#A0A0A0]">
                              <span className="text-xs">Imagem</span>
                            </div>
                          </div>
                          <div className="p-4">
                            <span
                              className="inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase"
                              style={{ backgroundColor: `${catColor}20`, color: catColor }}
                            >
                              {post.category.name}
                            </span>
                            <h3 className="mt-2 font-bold text-white transition-colors group-hover:text-green-cs line-clamp-2">
                              {post.title}
                            </h3>
                            <p className="mt-1.5 text-sm text-[#A0A0A0] line-clamp-2">
                              {post.excerpt}
                            </p>
                            <div className="mt-3 flex items-center gap-3 text-xs text-[#A0A0A0]">
                              {post.publishedAt && (
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} /> {formatDate(post.publishedAt)}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock size={12} /> {post.readTime} min
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-[#A0A0A0]">
                <Search size={40} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Nenhum post encontrado</p>
                <p className="text-sm">Tente ajustar os filtros ou buscar por outro termo.</p>
              </div>
            )}
          </>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="rounded-lg border border-white/20 p-2 text-[#A0A0A0] transition-colors hover:text-white disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setPagina(i + 1)}
                className={`h-9 w-9 rounded-lg text-sm font-medium transition-all ${
                  pagina === i + 1
                    ? "bg-green-cs text-white"
                    : "text-[#A0A0A0] hover:bg-white/10 hover:text-white"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPagina((p) => Math.min(totalPages, p + 1))}
              disabled={pagina === totalPages}
              className="rounded-lg border border-white/20 p-2 text-[#A0A0A0] transition-colors hover:text-white disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
