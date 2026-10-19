"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  MessageSquare,
  Eye,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Reply,
  Loader2,
  Flag,
  Share2,
  Send,
  Lock,
  Pencil,
  Trash2,
  CheckCircle,
  Pin,
  EyeOff,
  FolderInput,
  ShieldCheck,
  Check,
  X,
  Unlock,
} from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { CommentCard, type CommentData } from "@/components/comunidade/CommentCard";
import { MarkdownEditor } from "@/components/comunidade/MarkdownEditor";
import type { CategoryOption } from "@/components/comunidade/NovoTopicoContent";
import {
  api,
  ApiError,
  type Author,
  Avatar,
  AuthorName,
  EmptyState,
  inputClass,
  MarkdownBody,
  Paginator,
  primaryButtonClass,
  RoleBadge,
  secondaryButtonClass,
  Tag,
  TopicStatusIcons,
  When,
  type Pagination,
} from "@/components/comunidade/shared";
import { COMMENT_MAX, COMMENT_MIN, CONTENT_MAX, CONTENT_MIN, REPORTS_CATEGORY_SLUG, TITLE_MAX } from "@/lib/forum/constants";
import { fullDate } from "@/lib/forum/time";

interface PostAuthor extends Author {
  bio: string | null;
  joinedAt: string;
  postCount: number;
  commentCount: number;
  reputation: number;
  badge: string;
}

interface PostDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  contentHtml: string;
  pinned: boolean;
  locked: boolean;
  resolved: boolean;
  private: boolean;
  views: number;
  tags: string[];
  commentCount: number;
  likes: number;
  dislikes: number;
  userReaction: "LIKE" | "DISLIKE" | null;
  createdAt: string;
  editedAt: string | null;
  lastActivityAt: string;
  category: { id: string; name: string; slug: string; icon: string | null; staffOnly: boolean };
  author: PostAuthor;
  can: { edit: boolean; delete: boolean; resolve: boolean; moderate: boolean; comment: boolean };
}

interface CommentsResponse {
  comments: CommentData[];
  pagination: Pagination;
}

type Problem = { error: string; code?: string };

export function TopicoContent({ categoriaSlug, topicoSlug }: { categoriaSlug: string; topicoSlug: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const loggedIn = !!session?.user;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 30, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // Resposta
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<CommentData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<Problem | null>(null);
  const replyFormRef = useRef<HTMLFormElement>(null);

  // Edição do tópico
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<Problem | null>(null);

  // Moderação e ações
  const [actionError, setActionError] = useState<Problem | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [moveTo, setMoveTo] = useState("");
  const [copied, setCopied] = useState(false);


  const fetchPost = useCallback(async () => {
    const res = await api<{ post: PostDetail }>(`/api/forum/topicos/${topicoSlug}`);
    if (!res.ok) {
      setNotFound(true);
      setLoading(false);
      return null;
    }
    setPost(res.data.post);
    setLoading(false);
    return res.data.post;
  }, [topicoSlug]);

  const fetchComments = useCallback(
    async (postId: string, page: number | "ultima" = 1, commentId?: string) => {
      const params = new URLSearchParams({ topicoId: postId, pagina: String(page) });
      if (commentId) params.set("comentario", commentId);
      const res = await api<CommentsResponse>(`/api/forum/comentarios?${params}`);
      if (!res.ok) return;
      setComments(res.data.comments);
      setPagination(res.data.pagination);
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    api<{ post: PostDetail }>(`/api/forum/topicos/${topicoSlug}`).then((res) => {
      if (cancelled) return;
      if (!res.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setPost(res.data.post);
      setLoading(false);
      const hash = window.location.hash;
      const target = hash.startsWith("#comentario-") ? hash.slice("#comentario-".length) : undefined;
      if (target) setHighlightId(target);
      fetchComments(res.data.post.id, 1, target).then(() => {
        if (target) {
          requestAnimationFrame(() => document.getElementById(`comentario-${target}`)?.scrollIntoView({ block: "center" }));
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [topicoSlug, fetchComments]);

  // --- Reações ---

  async function reactToPost(type: "LIKE" | "DISLIKE") {
    if (!post || !loggedIn) return;
    const res = await api<{ likes: number; dislikes: number; userReaction: "LIKE" | "DISLIKE" | null }>("/api/forum/reacoes", {
      method: "POST",
      body: JSON.stringify({ type, postId: post.id }),
    });
    if (!res.ok) {
      setActionError({ error: res.error, code: res.code });
      return;
    }
    setPost({ ...post, likes: res.data.likes, dislikes: res.data.dislikes, userReaction: res.data.userReaction });
  }

  async function reactToComment(comment: CommentData, type: "LIKE" | "DISLIKE") {
    if (!loggedIn) return;
    const res = await api<{ likes: number; dislikes: number; userReaction: "LIKE" | "DISLIKE" | null }>("/api/forum/reacoes", {
      method: "POST",
      body: JSON.stringify({ type, commentId: comment.id }),
    });
    if (!res.ok) {
      setSubmitError({ error: res.error, code: res.code });
      return;
    }
    const patch = (list: CommentData[]): CommentData[] =>
      list.map((c) =>
        c.id === comment.id ? { ...c, ...res.data } : { ...c, replies: patch(c.replies) }
      );
    setComments((current) => patch(current));
  }

  // --- Comentários ---

  function startReply(comment: CommentData) {
    setReplyingTo(comment);
    setReplyContent((current) => (current.trim() ? current : `@${comment.author.username} `));
    replyFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!post || !loggedIn || replyContent.trim().length < COMMENT_MIN || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const res = await api<{ comment: CommentData; page: number }>("/api/forum/comentarios", {
      method: "POST",
      body: JSON.stringify({ postId: post.id, content: replyContent.trim(), parentId: replyingTo?.id }),
    });

    setSubmitting(false);
    if (!res.ok) {
      setSubmitError({ error: res.error, code: res.code });
      return;
    }

    setReplyContent("");
    setReplyingTo(null);
    setPost({ ...post, commentCount: post.commentCount + 1 });
    await fetchComments(post.id, res.data.page);
    setHighlightId(res.data.comment.id);
    requestAnimationFrame(() =>
      document.getElementById(`comentario-${res.data.comment.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
    );
  }

  async function editComment(comment: CommentData, content: string): Promise<string | null> {
    const res = await api<{ content: string; contentHtml: string; editedAt: string }>(`/api/forum/comentarios/${comment.id}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    });
    if (!res.ok) return res.error;
    const patch = (list: CommentData[]): CommentData[] =>
      list.map((c) => (c.id === comment.id ? { ...c, ...res.data } : { ...c, replies: patch(c.replies) }));
    setComments((current) => patch(current));
    return null;
  }

  async function deleteComment(comment: CommentData) {
    if (!post || !window.confirm("Excluir este comentário? Esta ação não pode ser desfeita.")) return;
    const res = await api<{ success: true }>(`/api/forum/comentarios/${comment.id}`, { method: "DELETE" });
    if (!res.ok) {
      setSubmitError({ error: res.error, code: res.code });
      return;
    }
    const removed = 1 + (comment.replies?.length ?? 0);
    setPost({ ...post, commentCount: Math.max(0, post.commentCount - removed) });
    await fetchComments(post.id, pagination.page);
  }

  // --- Tópico: edição, exclusão, resolução e moderação ---

  function startEdit() {
    if (!post) return;
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditTags(post.tags.join(", "));
    setEditError(null);
    setEditing(true);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!post || saving) return;
    setSaving(true);
    setEditError(null);
    const tags = editTags.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean);
    const res = await api<{ success: true }>(`/api/forum/topicos/${post.slug}`, {
      method: "PUT",
      body: JSON.stringify({ title: editTitle.trim(), content: editContent.trim(), tags }),
    });
    setSaving(false);
    if (!res.ok) {
      setEditError({ error: res.error, code: res.code });
      return;
    }
    setEditing(false);
    await fetchPost();
  }

  async function updatePost(label: string, patch: Record<string, unknown>) {
    if (!post || busyAction) return;
    setBusyAction(label);
    setActionError(null);
    const res = await api<{ success: true; categorySlug: string }>(`/api/forum/topicos/${post.slug}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    setBusyAction(null);
    if (!res.ok) {
      setActionError({ error: res.error, code: res.code });
      return;
    }
    if (res.data.categorySlug !== categoriaSlug) {
      router.replace(`/comunidade/${res.data.categorySlug}/${post.slug}`);
      return;
    }
    await fetchPost();
  }

  async function deletePost() {
    if (!post || !window.confirm("Excluir este post e todos os comentários? Esta ação não pode ser desfeita.")) return;
    setBusyAction("delete");
    const res = await api<{ success: true; categorySlug: string }>(`/api/forum/topicos/${post.slug}`, { method: "DELETE" });
    setBusyAction(null);
    if (!res.ok) {
      setActionError({ error: res.error, code: res.code });
      return;
    }
    router.push(`/comunidade/${res.data.categorySlug}`);
  }

  async function openMove() {
    if (categories.length === 0) {
      const res = await api<{ categories: CategoryOption[] }>("/api/forum/categorias");
      if (res.ok) setCategories(res.data.categories);
    }
    setMoveTo(post?.category.id ?? "");
    setMoveOpen(true);
  }

  function copyLink() {
    navigator.clipboard?.writeText(window.location.href.split("#")[0]).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Denúncias abrem a página de novo tópico, que monta o texto com o link e o autor
  function reportPost() {
    if (!post) return;
    router.push(`/comunidade/novo?denunciar=${encodeURIComponent(post.slug)}`);
  }

  function reportComment(comment: CommentData) {
    if (!post) return;
    router.push(`/comunidade/novo?denunciar=${encodeURIComponent(post.slug)}&comentario=${encodeURIComponent(comment.id)}`);
  }

  // --- Render ---

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-green-cs" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <>
        <PageHero
          title="COMUNIDADE"
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Comunidade", href: "/comunidade" }, { label: "Post" }]}
        />
        <div className="mx-auto max-w-4xl px-4 pb-16 lg:px-6">
          <EmptyState title="Post não encontrado" description="Ele pode ter sido removido ou ser privado." />
          <div className="text-center">
            <Link href={`/comunidade/${categoriaSlug}`} className={secondaryButtonClass}>
              Voltar para a categoria
            </Link>
          </div>
        </div>
      </>
    );
  }

  const isReport = post.category.slug === REPORTS_CATEGORY_SLUG;
  const actionButton = "flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors hover:bg-white/5 disabled:opacity-40";

  return (
    <>
      <PageHero
        title={post.category.name.toUpperCase()}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Comunidade", href: "/comunidade" },
          { label: post.category.name, href: `/comunidade/${post.category.slug}` },
          { label: post.title },
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 pb-16 lg:px-6">
        {/* Avisos de estado */}
        {post.private && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-xp/40 bg-xp/10 px-4 py-3 text-sm text-[#E0E0E0]">
            <EyeOff size={16} className="shrink-0 text-xp" aria-hidden="true" />
            Post privado: só o autor e a moderação veem este conteúdo.
          </div>
        )}
        {isReport && post.resolved && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-cs/40 bg-green-cs/10 px-4 py-3 text-sm text-[#E0E0E0]">
            <CheckCircle size={16} className="shrink-0 text-green-cs" aria-hidden="true" />
            Denúncia analisada e encerrada pela moderação.
          </div>
        )}

        {/* Post */}
        <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-bg-card/50">
          <div className="border-b border-white/10 p-4 sm:p-6">
            {editing ? (
              <form onSubmit={saveEdit} className="space-y-4">
                <div>
                  <label htmlFor="edit-titulo" className="mb-1 block text-sm font-medium text-[#A0A0A0]">
                    Título
                  </label>
                  <input
                    id="edit-titulo"
                    type="text"
                    value={editTitle}
                    maxLength={TITLE_MAX}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
                <MarkdownEditor value={editContent} onChange={setEditContent} minLength={CONTENT_MIN} maxLength={CONTENT_MAX} rows={10} />
                <div>
                  <label htmlFor="edit-tags" className="mb-1 block text-sm font-medium text-[#A0A0A0]">
                    Tags (separadas por vírgula)
                  </label>
                  <input id="edit-tags" type="text" value={editTags} onChange={(e) => setEditTags(e.target.value)} className={inputClass} />
                </div>
                {editError && <ApiError error={editError.error} code={editError.code} />}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditing(false)} className={secondaryButtonClass}>
                    <X size={14} /> Cancelar
                  </button>
                  <button type="submit" disabled={saving || editContent.trim().length < CONTENT_MIN || !editTitle.trim()} className={primaryButtonClass}>
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Salvar
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <TopicStatusIcons topic={post} size={16} />
                  <h1 className="text-xl font-bold text-white sm:text-2xl">{post.title}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#A0A0A0]">
                  <span className="flex items-center gap-1" title={fullDate(post.createdAt)}>
                    <Clock size={12} /> <When date={post.createdAt} />
                  </span>
                  {post.editedAt && <span title={fullDate(post.editedAt)}>editado</span>}
                  <span className="flex items-center gap-1">
                    <Eye size={12} /> {post.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare size={12} /> {post.commentCount}
                  </span>
                  {post.tags.map((tag) => (
                    <Tag key={tag} tag={tag} categorySlug={post.category.slug} />
                  ))}
                </div>
              </>
            )}
          </div>

          {!editing && (
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-6">
              {/* Autor */}
              <aside className="flex shrink-0 items-start gap-3 sm:w-40 sm:flex-col sm:items-center sm:text-center">
                <Link href={`/comunidade/membro/${post.author.username}`} aria-label={`Perfil de ${post.author.username}`}>
                  <Avatar author={post.author} size={64} className="h-14 w-14 rounded-lg sm:h-16 sm:w-16" />
                </Link>
                <div>
                  <AuthorName author={post.author} />
                  <div className="mt-0.5">
                    <RoleBadge role={post.author.role} />
                  </div>
                  <p className="mt-1 text-[11px] text-[#A0A0A0]" title="Reputação no fórum">
                    {post.author.badge} · {post.author.reputation} pts
                  </p>
                  <p className="text-[11px] text-[#A0A0A0]">
                    {post.author.postCount} posts · {post.author.commentCount} comentários
                  </p>
                  {post.author.bio && <p className="mt-2 line-clamp-3 text-[11px] text-[#A0A0A0]">{post.author.bio}</p>}
                </div>
              </aside>

              <MarkdownBody html={post.contentHtml} className="min-w-0 flex-1" />
            </div>
          )}

          {/* Ações */}
          {!editing && (
            <div className="border-t border-white/10 px-4 py-3 sm:px-6">
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => reactToPost("LIKE")}
                  disabled={!loggedIn}
                  aria-pressed={post.userReaction === "LIKE"}
                  className={`${actionButton} ${post.userReaction === "LIKE" ? "text-green-cs" : "text-[#A0A0A0] hover:text-green-cs"}`}
                >
                  <ThumbsUp size={14} /> Curtir {post.likes > 0 && `(${post.likes})`}
                </button>
                <button
                  type="button"
                  onClick={() => reactToPost("DISLIKE")}
                  disabled={!loggedIn}
                  aria-pressed={post.userReaction === "DISLIKE"}
                  className={`${actionButton} ${post.userReaction === "DISLIKE" ? "text-error" : "text-[#A0A0A0] hover:text-error"}`}
                >
                  <ThumbsDown size={14} /> Descurtir {post.dislikes > 0 && `(${post.dislikes})`}
                </button>
                <button type="button" onClick={copyLink} className={`${actionButton} text-[#A0A0A0] hover:text-white`}>
                  <Share2 size={14} /> {copied ? "Link copiado" : "Compartilhar"}
                </button>
                {loggedIn && !isReport && (
                  <button type="button" onClick={reportPost} className={`${actionButton} text-[#A0A0A0] hover:text-warning`}>
                    <Flag size={14} /> Reportar
                  </button>
                )}

                <span className="flex-1" />

                {post.can.resolve && (
                  <button
                    type="button"
                    onClick={() => updatePost("resolve", { resolved: !post.resolved })}
                    disabled={!!busyAction}
                    className={`${actionButton} ${post.resolved ? "text-green-cs" : "text-[#A0A0A0] hover:text-green-cs"}`}
                  >
                    <CheckCircle size={14} /> {post.resolved ? "Resolvido" : isReport ? "Encerrar denúncia" : "Marcar resolvido"}
                  </button>
                )}
                {post.can.edit && (
                  <button type="button" onClick={startEdit} className={`${actionButton} text-[#A0A0A0] hover:text-white`}>
                    <Pencil size={14} /> Editar
                  </button>
                )}
                {post.can.delete && (
                  <button type="button" onClick={deletePost} disabled={!!busyAction} className={`${actionButton} text-[#A0A0A0] hover:text-error`}>
                    <Trash2 size={14} /> Excluir
                  </button>
                )}
              </div>

              {post.can.moderate && (
                <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-dashed border-white/10 pt-2">
                  <span className="flex items-center gap-1 pr-2 text-[11px] font-bold uppercase tracking-wide text-warning">
                    <ShieldCheck size={12} /> Moderação
                  </span>
                  <button type="button" onClick={() => updatePost("pin", { pinned: !post.pinned })} disabled={!!busyAction} className={`${actionButton} text-[#A0A0A0] hover:text-white`}>
                    <Pin size={14} /> {post.pinned ? "Desafixar" : "Fixar"}
                  </button>
                  <button type="button" onClick={() => updatePost("lock", { locked: !post.locked })} disabled={!!busyAction} className={`${actionButton} text-[#A0A0A0] hover:text-white`}>
                    {post.locked ? <Unlock size={14} /> : <Lock size={14} />} {post.locked ? "Reabrir" : "Fechar"}
                  </button>
                  <button type="button" onClick={() => updatePost("private", { private: !post.private })} disabled={!!busyAction} className={`${actionButton} text-[#A0A0A0] hover:text-white`}>
                    {post.private ? <Eye size={14} /> : <EyeOff size={14} />} {post.private ? "Tornar público" : "Tornar privado"}
                  </button>
                  <button type="button" onClick={openMove} disabled={!!busyAction} className={`${actionButton} text-[#A0A0A0] hover:text-white`}>
                    <FolderInput size={14} /> Mover
                  </button>
                  {busyAction && <Loader2 size={14} className="animate-spin text-[#A0A0A0]" />}
                </div>
              )}

              {moveOpen && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setMoveOpen(false);
                    if (moveTo && moveTo !== post.category.id) updatePost("move", { categoryId: moveTo });
                  }}
                  className="mt-3 flex flex-wrap items-center gap-2"
                >
                  <label htmlFor="mover-para" className="text-xs text-[#A0A0A0]">
                    Mover para
                  </label>
                  <select id="mover-para" value={moveTo} onChange={(e) => setMoveTo(e.target.value)} className="rounded-lg border border-white/20 bg-bg-card/50 px-3 py-1.5 text-sm text-white focus:border-green-cs focus:outline-none">
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-bg-primary">
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className={primaryButtonClass}>
                    Mover
                  </button>
                  <button type="button" onClick={() => setMoveOpen(false)} className={secondaryButtonClass}>
                    Cancelar
                  </button>
                </form>
              )}

              {actionError && (
                <div className="mt-3">
                  <ApiError error={actionError.error} code={actionError.code} />
                </div>
              )}
            </div>
          )}
        </motion.article>

        {/* Comentários */}
        <section className="mt-8" aria-label="Comentários">
          <h2 className="mb-4 text-lg font-bold text-white">
            Comentários <span className="text-sm font-normal text-[#A0A0A0]">({post.commentCount})</span>
          </h2>

          <div className="space-y-3">
            {comments.map((comment, i) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                index={i}
                loggedIn={loggedIn}
                highlightId={highlightId}
                onReply={startReply}
                onReaction={reactToComment}
                onEdit={editComment}
                onDelete={deleteComment}
                onReport={reportComment}
              />
            ))}

            {comments.length === 0 && (
              <p className="py-8 text-center text-sm text-[#A0A0A0]">
                {post.can.comment ? "Nenhum comentário ainda. Seja a primeira pessoa a responder." : "Nenhum comentário."}
              </p>
            )}
          </div>

          <Paginator page={pagination.page} totalPages={pagination.totalPages} onChange={(p) => fetchComments(post.id, p)} />
        </section>

        {/* Responder */}
        {loggedIn && post.can.comment ? (
          <motion.form
            ref={replyFormRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={submitComment}
            className="mt-8 scroll-mt-24 rounded-xl border border-white/10 bg-bg-card/50 p-4"
          >
            {post.locked && (
              <p className="mb-3 text-xs text-warning">Post fechado: só a moderação pode comentar.</p>
            )}
            {replyingTo && (
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[#A0A0A0]">
                <Reply size={14} />
                <span>
                  Respondendo a <span className="font-bold text-white">{replyingTo.author.username}</span>
                </span>
                <button type="button" onClick={() => setReplyingTo(null)} className="text-error hover:underline">
                  Cancelar
                </button>
              </div>
            )}
            <MarkdownEditor
              value={replyContent}
              onChange={setReplyContent}
              minLength={COMMENT_MIN}
              maxLength={COMMENT_MAX}
              rows={4}
              placeholder="Escreva sua resposta..."
              label={replyingTo ? "Sua resposta ao comentário" : "Sua resposta"}
            />
            {submitError && (
              <div className="mt-2">
                <ApiError error={submitError.error} code={submitError.code} />
              </div>
            )}
            <div className="mt-3 flex justify-end">
              <button type="submit" disabled={submitting || replyContent.trim().length < COMMENT_MIN} className={primaryButtonClass}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Responder
              </button>
            </div>
          </motion.form>
        ) : post.locked ? (
          <div className="mt-8 rounded-xl border border-white/10 bg-bg-card/30 p-4 text-center text-sm text-[#A0A0A0]">
            <Lock size={16} className="mx-auto mb-2" aria-hidden="true" />
            Este post está fechado para novos comentários.
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-white/10 bg-bg-card/30 p-4 text-center text-sm text-[#A0A0A0]">
            <Link href={`/login?redirect=/comunidade/${post.category.slug}/${post.slug}`} className="text-green-cs hover:underline">
              Faça login
            </Link>{" "}
            para participar da discussão.
          </div>
        )}
      </div>
    </>
  );
}
