"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  Share2,
  Copy,
  Check,
  Loader2,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  tags: string[];
  readTime: number;
  category: { name: string; slug: string };
  author: { username: string; uuid: string | null } | null;
  publishedAt: string | null;
  views: number;
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  tags: string[];
  readTime: number;
  category: { name: string; slug: string };
  author: { username: string; uuid: string | null } | null;
  publishedAt: string | null;
}

interface Navigation {
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  novidades: "#4CAF50",
  aulas: "#2196F3",
  eventos: "#FF9800",
  midia: "#E91E63",
  tutoriais: "#9C27B0",
  comunidade: "#00BCD4",
};

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function BlogPostContent({ slug }: { slug: string }) {
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [related, setRelated] = useState<RelatedPost[]>([]);
  const [navigation, setNavigation] = useState<Navigation>({ prev: null, next: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/blog/${encodeURIComponent(slug)}`);
        if (!res.ok) {
          setError(res.status === 404 ? "Post não encontrado." : "Erro ao carregar post.");
          return;
        }
        const data = await res.json();
        setPost(data.post);
        setRelated(data.related);
        setNavigation(data.navigation);
      } catch {
        setError("Erro de conexão.");
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [slug]);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-green-cs" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <>
        <PageHero
          title="POST NÃO ENCONTRADO"
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: "Erro" }]}
        />
        <div className="mx-auto max-w-3xl px-4 pb-16 text-center">
          <p className="text-[#A0A0A0]">{error || "Post não encontrado."}</p>
          <Link href="/blog" className="mt-4 inline-block text-green-cs hover:underline">
            ← Voltar ao blog
          </Link>
        </div>
      </>
    );
  }

  const catColor = CATEGORY_COLORS[post.category.slug] ?? "#FFFFFF";

  return (
    <>
      <PageHero
        title={post.title}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: post.title },
        ]}
      />

      <article className="mx-auto max-w-4xl px-4 pb-16 lg:px-6">
        {/* Cover image */}
        {post.coverImage ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 overflow-hidden rounded-2xl"
          >
            <img src={post.coverImage} alt={post.title} className="w-full object-cover" />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex aspect-[21/9] items-center justify-center rounded-2xl bg-gradient-to-br from-bg-accent to-bg-card text-[#A0A0A0]"
          >
            <span className="text-sm">Imagem de capa</span>
          </motion.div>
        )}

        {/* Meta info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <span
            className="inline-block rounded px-2.5 py-0.5 text-xs font-bold uppercase"
            style={{ backgroundColor: `${catColor}20`, color: catColor }}
          >
            {post.category.name}
          </span>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[#A0A0A0]">
            {post.author && (
              <span className="flex items-center gap-2">
                {post.author.uuid && (
                  <img
                    src={`https://mc-heads.net/avatar/${post.author.uuid}/24`}
                    alt={post.author.username}
                    className="h-6 w-6 rounded"
                  />
                )}
                {post.author.username}
              </span>
            )}
            {post.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar size={14} /> {formatDate(post.publishedAt)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={14} /> {post.readTime} min de leitura
            </span>
            <span className="flex items-center gap-1">
              <Eye size={14} /> {post.views.toLocaleString("pt-BR")} visualizações
            </span>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="prose prose-invert max-w-none text-[#E0E0E0]
            prose-headings:font-bold prose-headings:text-white
            prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-xl
            prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-lg
            prose-p:leading-relaxed
            prose-a:text-green-cs prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white
            prose-code:rounded prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-green-light
            prose-pre:rounded-xl prose-pre:bg-bg-card prose-pre:border prose-pre:border-white/10
            prose-blockquote:border-l-green-cs prose-blockquote:text-[#A0A0A0]
            prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
        />

        {/* Tags */}
        {post.tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex flex-wrap items-center gap-2"
          >
            <Tag size={14} className="text-[#A0A0A0]" />
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/5 px-3 py-1 text-xs text-[#A0A0A0]"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        )}

        {/* Share */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-8 flex items-center gap-3 border-t border-white/10 pt-6"
        >
          <Share2 size={16} className="text-[#A0A0A0]" />
          <span className="text-sm text-[#A0A0A0]">Compartilhar:</span>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-[#A0A0A0] transition-colors hover:bg-white/10 hover:text-white"
          >
            {copied ? <Check size={14} className="text-green-cs" /> : <Copy size={14} />}
            {copied ? "Copiado!" : "Copiar link"}
          </button>
        </motion.div>

        {/* Navigation */}
        <div className="mt-8 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-2">
          {navigation.prev ? (
            <Link
              href={`/blog/${navigation.prev.slug}`}
              className="group flex items-center gap-2 rounded-xl border border-white/10 p-4 transition-all hover:border-white/20"
            >
              <ChevronLeft size={18} className="shrink-0 text-[#A0A0A0] group-hover:text-green-cs" />
              <div className="min-w-0">
                <span className="text-xs text-[#A0A0A0]">← Post anterior</span>
                <p className="truncate text-sm font-medium text-white">{navigation.prev.title}</p>
              </div>
            </Link>
          ) : <div />}
          {navigation.next && (
            <Link
              href={`/blog/${navigation.next.slug}`}
              className="group flex items-center justify-end gap-2 rounded-xl border border-white/10 p-4 text-right transition-all hover:border-white/20"
            >
              <div className="min-w-0">
                <span className="text-xs text-[#A0A0A0]">Próximo post →</span>
                <p className="truncate text-sm font-medium text-white">{navigation.next.title}</p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-[#A0A0A0] group-hover:text-green-cs" />
            </Link>
          )}
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-6 text-xl font-bold text-white">Posts Relacionados</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => {
                const rColor = CATEGORY_COLORS[r.category.slug] ?? "#FFFFFF";
                return (
                  <Link key={r.id} href={`/blog/${r.slug}`}>
                    <div className="group h-full overflow-hidden rounded-xl border border-white/10 bg-bg-card/50 transition-all hover:border-white/20">
                      <div className="aspect-video bg-gradient-to-br from-bg-accent to-bg-card">
                        <div className="flex h-full items-center justify-center text-[#A0A0A0]">
                          <span className="text-xs">Imagem</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <span
                          className="inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase"
                          style={{ backgroundColor: `${rColor}20`, color: rColor }}
                        >
                          {r.category.name}
                        </span>
                        <h3 className="mt-2 font-bold text-white transition-colors group-hover:text-green-cs line-clamp-2">
                          {r.title}
                        </h3>
                        <p className="mt-1.5 text-sm text-[#A0A0A0] line-clamp-2">
                          {r.excerpt}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </article>
    </>
  );
}

/** Simple Markdown-to-HTML renderer for blog content */
function renderMarkdown(md: string): string {
  let html = md
    // Escape potentially dangerous HTML tags but allow safe markdown constructs
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Headings
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Blockquote
    .replace(/^&gt; (.+)$/gm, "<blockquote><p>$1</p></blockquote>")
    // Unordered lists
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>')
    // Horizontal rules
    .replace(/^---$/gm, "<hr />")
    // Line breaks → paragraphs
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br />");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>(?:<br \/>)?)+/g, (match) => {
    return "<ul>" + match.replace(/<br \/>/g, "") + "</ul>";
  });

  return "<p>" + html + "</p>";
}
