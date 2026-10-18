import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { getSessionUser, requireWriter } from "@/lib/forum/access";
import { canDelete, canEdit, canModerate, canViewPost } from "@/lib/forum/permissions";
import { AUTHOR_SELECT, resolveAuthors, type ForumAuthor } from "@/lib/forum/authors";
import { extractMentions, renderMarkdown } from "@/lib/forum/markdown";
import { notify, notifyMentions } from "@/lib/forum/notifications";
import { COMMENT_MAX, COMMENT_MIN, COMMENTS_PER_PAGE } from "@/lib/forum/constants";
import type { ForumUser } from "@/lib/forum/permissions";

const COMMENT_INCLUDE = {
  author: { select: AUTHOR_SELECT },
  reactions: { select: { type: true, userId: true } },
  _count: { select: { replies: true } },
} as const;

interface CommentRow {
  id: string;
  content: string;
  authorId: string;
  parentId: string | null;
  createdAt: Date;
  editedAt: Date | null;
  author: { id: string; role: string; nloginId: number | null; displayName: string | null };
  reactions: { type: "LIKE" | "DISLIKE"; userId: string }[];
  _count: { replies: number };
}

interface SerializedComment {
  id: string;
  content: string;
  contentHtml: string;
  parentId: string | null;
  createdAt: Date;
  editedAt: Date | null;
  likes: number;
  dislikes: number;
  userReaction: "LIKE" | "DISLIKE" | null;
  author: ForumAuthor;
  can: { edit: boolean; delete: boolean };
  replies: SerializedComment[];
}

function serializeComment(
  c: CommentRow,
  authors: Map<string, ForumAuthor>,
  user: ForumUser | null,
  replies: SerializedComment[] = []
): SerializedComment {
  const likes = c.reactions.filter((r) => r.type === "LIKE").length;
  const dislikes = c.reactions.filter((r) => r.type === "DISLIKE").length;
  return {
    id: c.id,
    content: c.content,
    contentHtml: renderMarkdown(c.content),
    parentId: c.parentId,
    createdAt: c.createdAt,
    editedAt: c.editedAt,
    likes,
    dislikes,
    userReaction: user ? (c.reactions.find((r) => r.userId === user.id)?.type ?? null) : null,
    author: authors.get(c.authorId)!,
    can: {
      edit: canEdit(c, user),
      delete: canDelete({ authorId: c.authorId, replyCount: c._count.replies }, user),
    },
    replies,
  };
}

// GET /api/forum/comentarios?topicoId=xxx&pagina=1|ultima&comentario=id
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const topicoId = searchParams.get("topicoId");
  const limit = COMMENTS_PER_PAGE;

  if (!topicoId) {
    return NextResponse.json({ error: "Parâmetro 'topicoId' é obrigatório" }, { status: 400 });
  }

  const user = await getSessionUser();
  const post = await prisma.post.findUnique({
    where: { id: topicoId },
    select: { id: true, private: true, authorId: true },
  });
  if (!post || !canViewPost(post, user)) {
    return NextResponse.json({ error: "Tópico não encontrado" }, { status: 404 });
  }

  const where = { postId: topicoId, parentId: null };
  const total = await prisma.comment.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Página pedida: número, "ultima" ou a que contém um comentário (links das notificações)
  let requested = searchParams.get("pagina") ?? "1";
  const targetId = searchParams.get("comentario");
  if (targetId) {
    const target = await prisma.comment.findUnique({
      where: { id: targetId },
      select: { postId: true, parentId: true, createdAt: true, parent: { select: { createdAt: true } } },
    });
    if (target && target.postId === topicoId) {
      const anchorDate = target.parent?.createdAt ?? target.createdAt;
      const before = await prisma.comment.count({ where: { ...where, createdAt: { lt: anchorDate } } });
      requested = String(Math.floor(before / limit) + 1);
    }
  }
  const page = requested === "ultima" ? totalPages : Math.min(totalPages, Math.max(1, Number(requested) || 1));

  const comments = await prisma.comment.findMany({
    where,
    orderBy: { createdAt: "asc" },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      ...COMMENT_INCLUDE,
      replies: { orderBy: { createdAt: "asc" }, include: COMMENT_INCLUDE },
    },
  });

  const authors = await resolveAuthors([
    ...comments.map((c) => c.author),
    ...comments.flatMap((c) => c.replies.map((r) => r.author)),
  ]);

  return NextResponse.json({
    comments: comments.map((c) =>
      serializeComment(c, authors, user, c.replies.map((r) => serializeComment(r, authors, user)))
    ),
    pagination: { page, limit, total, totalPages },
  });
}

// POST /api/forum/comentarios — Criar comentário ou resposta
export async function POST(request: NextRequest) {
  const access = await requireWriter();
  if ("error" in access) return access.error;
  const { user } = access;

  // Rate limit: 10 comentários/15min
  const rl = await checkRateLimit(`forum-comment:${user.id}`, RATE_LIMITS.forumComment);
  if (!rl.success) {
    return rateLimitResponse(rl, "Limite de comentários excedido. Tente novamente mais tarde.");
  }

  let body: { postId?: unknown; content?: unknown; parentId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const postId = typeof body.postId === "string" ? body.postId : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const parentId = typeof body.parentId === "string" && body.parentId ? body.parentId : null;

  if (!postId || !content) {
    return NextResponse.json({ error: "Tópico e conteúdo são obrigatórios" }, { status: 400 });
  }

  if (content.length < COMMENT_MIN || content.length > COMMENT_MAX) {
    return NextResponse.json(
      { error: `Comentário deve ter entre ${COMMENT_MIN} e ${COMMENT_MAX} caracteres` },
      { status: 400 }
    );
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, locked: true, private: true, authorId: true },
  });

  if (!post || !canViewPost(post, user)) {
    return NextResponse.json({ error: "Tópico não encontrado" }, { status: 404 });
  }

  if (post.locked && !canModerate(user.role)) {
    return NextResponse.json({ error: "Este tópico está fechado para novos comentários" }, { status: 403 });
  }

  let parent: { id: string; authorId: string } | null = null;
  if (parentId) {
    const found = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { id: true, postId: true, parentId: true, authorId: true },
    });
    if (!found || found.postId !== postId) {
      return NextResponse.json({ error: "Comentário pai não encontrado" }, { status: 404 });
    }
    // Apenas 1 nível de aninhamento (RN-FORUM-04)
    if (found.parentId) {
      return NextResponse.json({ error: "Não é possível responder a uma resposta (apenas 1 nível)" }, { status: 400 });
    }
    parent = found;
  }

  const [comment] = await Promise.all([
    prisma.comment.create({
      data: { content, authorId: user.id, postId, parentId },
      include: COMMENT_INCLUDE,
    }),
    prisma.post.update({ where: { id: postId }, data: { lastActivityAt: new Date() } }),
  ]);

  // Página em que o comentário aparece (as respostas ficam na página do pai)
  const anchorId = parent ? parent.id : comment.id;
  const anchor = await prisma.comment.findUnique({ where: { id: anchorId }, select: { createdAt: true } });
  const before = await prisma.comment.count({
    where: { postId, parentId: null, createdAt: { lt: anchor?.createdAt ?? comment.createdAt } },
  });
  const page = Math.floor(before / COMMENTS_PER_PAGE) + 1;

  // Avisos: autor do tópico, autor do comentário pai e menções (sem repetir)
  const notified = new Set<string>([user.id]);
  const tasks: Promise<void>[] = [];
  if (parent && !notified.has(parent.authorId)) {
    notified.add(parent.authorId);
    tasks.push(notify({ userId: parent.authorId, type: "REPLY_COMMENT", actorId: user.id, postId, commentId: comment.id }));
  }
  if (!notified.has(post.authorId)) {
    notified.add(post.authorId);
    tasks.push(notify({ userId: post.authorId, type: "REPLY_TOPIC", actorId: user.id, postId, commentId: comment.id }));
  }
  tasks.push(
    notifyMentions(extractMentions(content), {
      actorId: user.id,
      postId,
      commentId: comment.id,
      skipUserIds: [...notified],
    })
  );
  await Promise.all(tasks);

  const authors = await resolveAuthors([comment.author]);

  return NextResponse.json(
    { comment: serializeComment(comment, authors, user), page },
    { status: 201 }
  );
}
