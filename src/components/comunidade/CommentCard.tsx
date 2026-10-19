"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Reply, Pencil, Trash2, Loader2, Check, X, Flag } from "lucide-react";
import { MarkdownEditor } from "@/components/comunidade/MarkdownEditor";
import {
  type Author,
  Avatar,
  AuthorName,
  MarkdownBody,
  RankBadge,
  staffFrameStyle,
  When,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/comunidade/shared";
import { COMMENT_MAX, COMMENT_MIN } from "@/lib/forum/constants";

export interface CommentData {
  id: string;
  content: string;
  contentHtml: string;
  parentId: string | null;
  createdAt: string;
  editedAt: string | null;
  likes: number;
  dislikes: number;
  userReaction: "LIKE" | "DISLIKE" | null;
  author: Author;
  can: { edit: boolean; delete: boolean };
  replies: CommentData[];
}

interface CommentCardProps {
  comment: CommentData;
  index: number;
  loggedIn: boolean;
  highlightId: string | null;
  onReply: (comment: CommentData) => void;
  onReaction: (comment: CommentData, type: "LIKE" | "DISLIKE") => void;
  onEdit: (comment: CommentData, content: string) => Promise<string | null>;
  onDelete: (comment: CommentData) => void;
  onReport: (comment: CommentData) => void;
  isReply?: boolean;
}

export function CommentCard(props: CommentCardProps) {
  const { comment, index, loggedIn, highlightId, onReply, onReaction, onEdit, onDelete, onReport, isReply = false } = props;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const highlighted = highlightId === comment.id;

  async function save() {
    if (draft.trim().length < COMMENT_MIN || saving) return;
    setSaving(true);
    setError(null);
    const problem = await onEdit(comment, draft.trim());
    setSaving(false);
    if (problem) {
      setError(problem);
      return;
    }
    setEditing(false);
  }

  const reactionButton = (type: "LIKE" | "DISLIKE", count: number, Icon: typeof ThumbsUp, activeClass: string, label: string) => (
    <button
      type="button"
      onClick={() => onReaction(comment, type)}
      disabled={!loggedIn}
      aria-pressed={comment.userReaction === type}
      aria-label={label}
      className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition-colors disabled:opacity-40 ${
        comment.userReaction === type ? activeClass : "text-[#A0A0A0] hover:text-white"
      }`}
    >
      <Icon size={12} /> {count > 0 && count}
    </button>
  );

  return (
    <motion.div
      id={`comentario-${comment.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 10) * 0.02 }}
      className={`scroll-mt-24 rounded-xl border bg-bg-card/40 ${
        highlighted ? "border-green-cs/60 shadow-[0_0_0_1px_rgba(76,175,80,0.3)]" : "border-white/10"
      } ${isReply ? "ml-6 border-l-2 border-l-white/20 sm:ml-10" : ""}`}
      // Comentário da equipe: borda e brilho na cor do cargo (o destaque do link #comentario tem prioridade)
      style={highlighted ? undefined : staffFrameStyle(comment.author)}
    >
      <div className="flex gap-3 p-4">
        <Avatar author={comment.author} size={32} className="mt-0.5" highlight />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <AuthorName author={comment.author} />
            <RankBadge author={comment.author} />
            <span className="text-[#A0A0A0]">
              <When date={comment.createdAt} />
              {comment.editedAt && <span title="Editado"> · editado</span>}
            </span>
          </div>

          {editing ? (
            <div className="mt-2 space-y-2">
              <MarkdownEditor value={draft} onChange={setDraft} minLength={COMMENT_MIN} maxLength={COMMENT_MAX} rows={4} label="Editar comentário" />
              {error && <p className="text-xs text-error">{error}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setDraft(comment.content);
                    setError(null);
                  }}
                  className={secondaryButtonClass}
                >
                  <X size={14} /> Cancelar
                </button>
                <button type="button" onClick={save} disabled={saving || draft.trim().length < COMMENT_MIN} className={primaryButtonClass}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Salvar
                </button>
              </div>
            </div>
          ) : (
            <MarkdownBody html={comment.contentHtml} className="mt-2 text-sm" />
          )}

          {!editing && (
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {reactionButton("LIKE", comment.likes, ThumbsUp, "text-green-cs", "Curtir")}
              {reactionButton("DISLIKE", comment.dislikes, ThumbsDown, "text-error", "Descurtir")}
              {!isReply && loggedIn && (
                <button
                  type="button"
                  onClick={() => onReply(comment)}
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-[#A0A0A0] transition-colors hover:text-white"
                >
                  <Reply size={12} /> Responder
                </button>
              )}
              {comment.can.edit && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-[#A0A0A0] transition-colors hover:text-white"
                >
                  <Pencil size={12} /> Editar
                </button>
              )}
              {comment.can.delete && (
                <button
                  type="button"
                  onClick={() => onDelete(comment)}
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-[#A0A0A0] transition-colors hover:text-error"
                >
                  <Trash2 size={12} /> Excluir
                </button>
              )}
              {loggedIn && (
                <button
                  type="button"
                  onClick={() => onReport(comment)}
                  className="ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-[#A0A0A0] transition-colors hover:text-warning"
                >
                  <Flag size={12} /> Reportar
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div className="space-y-2 px-4 pb-3">
          {comment.replies.map((reply, j) => (
            <CommentCard key={reply.id} {...props} comment={reply} index={j} isReply />
          ))}
        </div>
      )}
    </motion.div>
  );
}
