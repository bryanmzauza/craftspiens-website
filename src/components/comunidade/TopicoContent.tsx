"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Eye,
  Pin,
  Lock,
  CheckCircle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Reply,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Share2,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { PageHero } from "@/components/ui/PageHero";

interface Author {
  id: string;
  username: string;
  uuid: string | null;
  role: string;
  bio?: string;
  joinedAt?: string;
  postCount?: number;
  commentCount?: number;
  reputation?: number;
}

interface PostDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  pinned: boolean;
  locked: boolean;
  resolved: boolean;
  views: number;
  tags: string[];
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  category: { id: string; name: string; slug: string; icon: string | null };
  author: Author;
}

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
  dislikes: number;
  author: { id: string; username: string; uuid: string | null; role: string };
  replies: CommentData[];
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MODERADOR: "Moderador",
  PROFESSOR: "Professor",
};

const REPUTATION_BADGES: { min: number; label: string; emoji: string }[] = [
  { min: 201, label: "Lenda", emoji: "💎" },
  { min: 51, label: "Veterano", emoji: "🏆" },
  { min: 11, label: "Membro", emoji: "⭐" },
  { min: 0, label: "Novato", emoji: "🌱" },
];

function getReputationBadge(rep: number) {
  return REPUTATION_BADGES.find((b) => rep >= b.min) ?? REPUTATION_BADGES[REPUTATION_BADGES.length - 1];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d atrás`;
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function renderContent(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`(.+?)`/g, '<code class="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono">$1</code>');
  html = html.replace(/\n/g, "<br/>");
  return html;
}

export function TopicoContent({
  categoriaSlug,
  topicoSlug,
}: {
  categoriaSlug: string;
  topicoSlug: string;
}) {
  const { data: session } = useSession();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentPagination, setCommentPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/forum/topicos/${topicoSlug}`);
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPost(data.post);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [topicoSlug]);

  const fetchComments = useCallback(async (page: number = 1) => {
    if (!post) return;
    try {
      const res = await fetch(`/api/forum/comentarios?topicoId=${post.id}&page=${page}`);
      if (!res.ok) return;
      const data = await res.json();
      setComments(data.comments);
      setCommentPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
    } catch {
      // silently fail
    }
  }, [post]);

  useEffect(() => { fetchPost(); }, [fetchPost]);
  useEffect(() => { if (post) fetchComments(); }, [post, fetchComments]);

  const handleReaction = async (type: "LIKE" | "DISLIKE", postId?: string, commentId?: string) => {
    if (!session?.user) return;
    try {
      await fetch("/api/forum/reacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, postId, commentId }),
      });
      // Refresh comments to see updated counts
      fetchComments(commentPagination.page);
    } catch {
      // silently fail
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !session?.user || !replyContent.trim()) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/forum/comentarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          content: replyContent.trim(),
          parentId: replyingTo ?? undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSubmitError(data.error || "Erro ao enviar comentário");
        return;
      }

      setReplyContent("");
      setReplyingTo(null);
      fetchComments(commentPagination.page);
    } catch {
      setSubmitError("Erro de conexão");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-green-cs" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <MessageSquare size={48} className="text-[#A0A0A0] opacity-30" />
        <h2 className="text-xl font-bold text-white">Tópico não encontrado</h2>
        <Link href={`/comunidade/${categoriaSlug}`} className="text-sm text-green-cs hover:underline">
          Voltar para a categoria
        </Link>
      </div>
    );
  }

  const badge = getReputationBadge(post.author.reputation ?? 0);

  return (
    <>
      <PageHero
        title={post.category.name}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Comunidade", href: "/comunidade" },
          { label: post.category.name, href: `/comunidade/${categoriaSlug}` },
          { label: post.title },
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 pb-16 lg:px-6">
        {/* Post Original */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-bg-card/50"
        >
          {/* Header */}
          <div className="border-b border-white/10 p-4 sm:p-6">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {post.pinned && <Pin size={16} className="text-yellow-500" />}
              {post.locked && <Lock size={16} className="text-[#A0A0A0]" />}
              {post.resolved && <CheckCircle size={16} className="text-green-cs" />}
              <h1 className="text-xl font-bold text-white sm:text-2xl">{post.title}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#A0A0A0]">
              <span className="flex items-center gap-1">
                <Clock size={12} /> {timeAgo(post.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Eye size={12} /> {post.views}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare size={12} /> {post.commentCount}
              </span>
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-6">
            {/* Author sidebar */}
            <div className="flex shrink-0 items-start gap-3 sm:w-40 sm:flex-col sm:items-center sm:text-center">
              {post.author.uuid ? (
                <img
                  src={`https://mc-heads.net/avatar/${post.author.uuid}/64`}
                  alt={post.author.username}
                  className="h-14 w-14 rounded-lg sm:h-16 sm:w-16"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/10 text-xl font-bold text-white sm:h-16 sm:w-16">
                  {post.author.username[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-bold text-white">{post.author.username}</p>
                {ROLE_LABELS[post.author.role] && (
                  <span className="mt-0.5 inline-block rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-500">
                    {ROLE_LABELS[post.author.role]}
                  </span>
                )}
                <p className="mt-1 text-[10px] text-[#A0A0A0]">
                  {badge.emoji} {badge.label} ({post.author.reputation ?? 0})
                </p>
                <p className="text-[10px] text-[#A0A0A0]">
                  {post.author.postCount ?? 0} posts · {post.author.commentCount ?? 0} comentários
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div
                className="prose-invert max-w-none text-sm leading-relaxed text-[#E0E0E0]"
                dangerouslySetInnerHTML={{ __html: renderContent(post.content) }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-4 py-3 sm:px-6">
            <button
              onClick={() => handleReaction("LIKE", post.id)}
              disabled={!session?.user}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[#A0A0A0] transition-colors hover:bg-white/5 hover:text-green-cs disabled:opacity-40"
            >
              <ThumbsUp size={14} /> Curtir
            </button>
            <button
              onClick={() => handleReaction("DISLIKE", post.id)}
              disabled={!session?.user}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[#A0A0A0] transition-colors hover:bg-white/5 hover:text-error disabled:opacity-40"
            >
              <ThumbsDown size={14} /> Descurtir
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[#A0A0A0] transition-colors hover:bg-white/5 hover:text-white"
            >
              <Share2 size={14} /> {copied ? "Copiado!" : "Compartilhar"}
            </button>
            {session?.user && (
              <button className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[#A0A0A0] transition-colors hover:bg-white/5 hover:text-warning">
                <Flag size={14} /> Reportar
              </button>
            )}
          </div>
        </motion.div>

        {/* Comentários */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-white">
            Comentários ({post.commentCount})
          </h2>

          <div className="space-y-3">
            {comments.map((comment, i) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                index={i}
                session={session}
                onReply={(id) => { setReplyingTo(id); }}
                onReaction={handleReaction}
              />
            ))}

            {comments.length === 0 && (
              <p className="py-8 text-center text-sm text-[#A0A0A0]">
                Nenhum comentário ainda. Seja o primeiro!
              </p>
            )}
          </div>

          {/* Comment Pagination */}
          {commentPagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => fetchComments(commentPagination.page - 1)}
                disabled={commentPagination.page <= 1}
                className="rounded-lg border border-white/10 p-2 text-[#A0A0A0] transition-colors hover:text-white disabled:opacity-30"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-3 text-sm text-[#A0A0A0]">
                {commentPagination.page} / {commentPagination.totalPages}
              </span>
              <button
                onClick={() => fetchComments(commentPagination.page + 1)}
                disabled={commentPagination.page >= commentPagination.totalPages}
                className="rounded-lg border border-white/10 p-2 text-[#A0A0A0] transition-colors hover:text-white disabled:opacity-30"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Reply form */}
        {!post.locked && session?.user ? (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmitComment}
            className="mt-8 rounded-xl border border-white/10 bg-bg-card/50 p-4"
          >
            {replyingTo && (
              <div className="mb-3 flex items-center gap-2 text-xs text-[#A0A0A0]">
                <Reply size={14} />
                <span>Respondendo a um comentário</span>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-error hover:underline"
                >
                  Cancelar
                </button>
              </div>
            )}
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Escreva sua resposta..."
              rows={4}
              className="w-full resize-y rounded-lg border border-white/20 bg-bg-primary/50 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
              required
              minLength={2}
              maxLength={5000}
            />
            {submitError && <p className="mt-2 text-sm text-error">{submitError}</p>}
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={submitting || replyContent.trim().length < 2}
                className="flex items-center gap-2 rounded-lg bg-green-cs px-5 py-2 text-sm font-bold text-white transition-all hover:bg-green-dark disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Responder
              </button>
            </div>
          </motion.form>
        ) : post.locked ? (
          <div className="mt-8 rounded-xl border border-white/10 bg-bg-card/30 p-4 text-center text-sm text-[#A0A0A0]">
            <Lock size={16} className="mx-auto mb-2" />
            Este tópico está fechado para novos comentários.
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-white/10 bg-bg-card/30 p-4 text-center text-sm text-[#A0A0A0]">
            <Link href="/login" className="text-green-cs hover:underline">Faça login</Link> para participar da discussão.
          </div>
        )}
      </div>
    </>
  );
}

function CommentCard({
  comment,
  index,
  session,
  onReply,
  onReaction,
  isReply = false,
}: {
  comment: CommentData;
  index: number;
  session: ReturnType<typeof useSession>["data"];
  onReply: (id: string) => void;
  onReaction: (type: "LIKE" | "DISLIKE", postId?: string, commentId?: string) => void;
  isReply?: boolean;
}) {
  const roleLabel = ROLE_LABELS[comment.author.role];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className={`rounded-xl border border-white/10 bg-bg-card/40 ${isReply ? "ml-8 border-l-2 border-l-white/20" : ""}`}
    >
      <div className="flex gap-3 p-4">
        {/* Author avatar */}
        {comment.author.uuid ? (
          <img
            src={`https://mc-heads.net/avatar/${comment.author.uuid}/32`}
            alt={comment.author.username}
            className="h-8 w-8 shrink-0 rounded-lg"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-white">
            {comment.author.username[0]?.toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`font-bold ${roleLabel ? "text-yellow-500" : "text-white"}`}>
              {comment.author.username}
            </span>
            {roleLabel && (
              <span className="rounded bg-yellow-500/20 px-1 py-0.5 text-[9px] font-bold text-yellow-500">
                {roleLabel}
              </span>
            )}
            <span className="text-[#A0A0A0]">{timeAgo(comment.createdAt)}</span>
          </div>

          <div
            className="mt-2 text-sm leading-relaxed text-[#E0E0E0]"
            dangerouslySetInnerHTML={{ __html: renderContent(comment.content) }}
          />

          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => onReaction("LIKE", undefined, comment.id)}
              disabled={!session?.user}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-[#A0A0A0] transition-colors hover:text-green-cs disabled:opacity-40"
            >
              <ThumbsUp size={12} /> {comment.likes > 0 && comment.likes}
            </button>
            <button
              onClick={() => onReaction("DISLIKE", undefined, comment.id)}
              disabled={!session?.user}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-[#A0A0A0] transition-colors hover:text-error disabled:opacity-40"
            >
              <ThumbsDown size={12} /> {comment.dislikes > 0 && comment.dislikes}
            </button>
            {!isReply && session?.user && (
              <button
                onClick={() => onReply(comment.id)}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-[#A0A0A0] transition-colors hover:text-white"
              >
                <Reply size={12} /> Responder
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2 px-4 pb-3">
          {comment.replies.map((reply, j) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              index={j}
              session={session}
              onReply={onReply}
              onReaction={onReaction}
              isReply
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
