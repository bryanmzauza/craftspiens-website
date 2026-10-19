import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireWriter } from "@/lib/forum/access";
import {
  canDelete,
  canEdit,
  canModerate,
  canResolve,
  canViewPost,
  isStaff,
} from "@/lib/forum/permissions";
import { AUTHOR_SELECT, resolveAuthor } from "@/lib/forum/authors";
import { extractMentions, renderMarkdown } from "@/lib/forum/markdown";
import { normalizeTags, parseTags } from "@/lib/forum/slug";
import { computeReputation, getReputationBadge } from "@/lib/forum/reputation";
import { notify, notifyMentions } from "@/lib/forum/notifications";
import { CONTENT_MAX, CONTENT_MIN, TAGS_MAX, TITLE_MAX } from "@/lib/forum/constants";

/** Reputação do autor (RN-FORUM-06): contagens de posts, comentários e reações recebidas */
async function authorReputation(authorId: string): Promise<number> {
  const [posts, comments, likesOnPosts, likesOnComments, dislikes] = await Promise.all([
    prisma.post.count({ where: { authorId } }),
    prisma.comment.count({ where: { authorId } }),
    prisma.reaction.count({ where: { post: { authorId }, type: "LIKE" } }),
    prisma.reaction.count({ where: { comment: { authorId }, type: "LIKE" } }),
    prisma.reaction.count({
      where: { type: "DISLIKE", OR: [{ post: { authorId } }, { comment: { authorId } }] },
    }),
  ]);
  return computeReputation({ posts, comments, likesOnPosts, likesOnComments, dislikes });
}

// GET /api/forum/topicos/[slug] — Detalhe do tópico
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await getSessionUser();

  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          ...AUTHOR_SELECT,
          createdAt: true,
          profile: { select: { bio: true, perfilPublico: true } },
          _count: { select: { posts: true, comments: true } },
        },
      },
      category: { select: { id: true, name: true, slug: true, icon: true, staffOnly: true } },
      _count: { select: { comments: true } },
      reactions: { select: { type: true, userId: true } },
    },
  });

  if (!post || !canViewPost(post, user)) {
    return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
  }

  // Views: só de quem não é o autor, sem travar a resposta
  const countsView = !user || user.id !== post.authorId;
  if (countsView) {
    prisma.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } }).catch(() => {});
  }

  const [reputation, author] = await Promise.all([
    authorReputation(post.author.id),
    resolveAuthor(post.author),
  ]);

  const likes = post.reactions.filter((r) => r.type === "LIKE").length;
  const dislikes = post.reactions.filter((r) => r.type === "DISLIKE").length;
  const userReaction = user ? (post.reactions.find((r) => r.userId === user.id)?.type ?? null) : null;

  return NextResponse.json({
    post: {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      contentHtml: renderMarkdown(post.content),
      pinned: post.pinned,
      locked: post.locked,
      resolved: post.resolved,
      private: post.private,
      views: post.views + (countsView ? 1 : 0),
      tags: parseTags(post.tags),
      commentCount: post._count.comments,
      likes,
      dislikes,
      userReaction,
      createdAt: post.createdAt,
      editedAt: post.editedAt,
      lastActivityAt: post.lastActivityAt,
      category: post.category,
      author: {
        ...author,
        bio: post.author.profile?.perfilPublico === false ? null : (post.author.profile?.bio ?? null),
        joinedAt: post.author.createdAt,
        postCount: post.author._count.posts,
        commentCount: post.author._count.comments,
        reputation,
        badge: getReputationBadge(reputation).label,
      },
      can: {
        edit: canEdit(post, user),
        delete: canDelete({ authorId: post.authorId, replyCount: post._count.comments }, user),
        resolve: canResolve(post, user),
        moderate: !!user && canModerate(user.role),
        comment: !post.locked || (!!user && canModerate(user.role)),
      },
    },
  });
}

// PUT /api/forum/topicos/[slug] — Editar, resolver e moderar
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const access = await requireWriter();
  if ("error" in access) return access.error;
  const { user } = access;

  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug },
    select: {
      id: true,
      authorId: true,
      createdAt: true,
      title: true,
      content: true,
      pinned: true,
      locked: true,
      resolved: true,
      private: true,
      categoryId: true,
      category: { select: { name: true } },
    },
  });

  if (!post || !canViewPost(post, user)) {
    return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
  }

  let body: {
    title?: unknown;
    content?: unknown;
    tags?: unknown;
    pinned?: unknown;
    locked?: unknown;
    resolved?: unknown;
    private?: unknown;
    categoryId?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  const moderationNotes: string[] = [];
  const wantsEdit = body.title !== undefined || body.content !== undefined || body.tags !== undefined;

  if (wantsEdit) {
    if (!canEdit(post, user)) {
      return NextResponse.json(
        { error: "Só o autor, em até 30 minutos, ou a moderação pode editar este post" },
        { status: 403 }
      );
    }

    if (body.title !== undefined) {
      const title = typeof body.title === "string" ? body.title.trim().replace(/\s+/g, " ") : "";
      if (!title || title.length > TITLE_MAX) {
        return NextResponse.json({ error: `Título deve ter entre 1 e ${TITLE_MAX} caracteres` }, { status: 400 });
      }
      data.title = title;
    }

    if (body.content !== undefined) {
      const content = typeof body.content === "string" ? body.content.trim() : "";
      if (content.length < CONTENT_MIN || content.length > CONTENT_MAX) {
        return NextResponse.json(
          { error: `Conteúdo deve ter entre ${CONTENT_MIN} e ${CONTENT_MAX} caracteres` },
          { status: 400 }
        );
      }
      data.content = content;
    }

    if (body.tags !== undefined) {
      const tags = normalizeTags(body.tags);
      if (tags === null) {
        return NextResponse.json({ error: `Tags inválidas (máximo de ${TAGS_MAX})` }, { status: 400 });
      }
      data.tags = tags.length > 0 ? JSON.stringify(tags) : null;
    }

    if (data.title !== undefined || data.content !== undefined) data.editedAt = new Date();
  }

  if (body.resolved !== undefined) {
    if (!canResolve(post, user)) {
      return NextResponse.json({ error: "Só o autor ou a moderação marca o post como resolvido" }, { status: 403 });
    }
    data.resolved = body.resolved === true;
  }

  const moderation = body.pinned !== undefined || body.locked !== undefined || body.private !== undefined || body.categoryId !== undefined;
  if (moderation) {
    if (!canModerate(user.role)) {
      return NextResponse.json({ error: "Apenas a moderação pode fazer esta alteração" }, { status: 403 });
    }
    if (body.pinned !== undefined) data.pinned = body.pinned === true;
    if (body.locked !== undefined) {
      data.locked = body.locked === true;
      if (data.locked !== post.locked) moderationNotes.push(data.locked ? "fechado para novos comentários" : "reaberto");
    }
    if (body.private !== undefined) {
      data.private = body.private === true;
      if (data.private !== post.private) moderationNotes.push(data.private ? "marcado como privado (só você e a moderação veem)" : "tornado público");
    }
    if (body.categoryId !== undefined) {
      const categoryId = typeof body.categoryId === "string" ? body.categoryId : "";
      const target = await prisma.forumCategory.findUnique({
        where: { id: categoryId },
        select: { id: true, name: true, active: true, staffOnly: true },
      });
      if (!target || !target.active) {
        return NextResponse.json({ error: "Categoria de destino não encontrada" }, { status: 404 });
      }
      if (target.id !== post.categoryId) {
        data.categoryId = target.id;
        moderationNotes.push(`movido de ${post.category.name} para ${target.name}`);
      }
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  const updated = await prisma.post.update({
    where: { id: post.id },
    data,
    select: { slug: true, category: { select: { slug: true } } },
  });

  // Avisos ao autor sobre ações da moderação, e menções novas no texto editado
  const tasks: Promise<void>[] = [];
  if (moderationNotes.length > 0 && post.authorId !== user.id) {
    tasks.push(
      notify({
        userId: post.authorId,
        type: "MODERATION",
        actorId: user.id,
        postId: post.id,
        message: `Seu post foi ${moderationNotes.join(", ")}`.slice(0, 255),
      })
    );
  }
  if (typeof data.content === "string") {
    const before = new Set(extractMentions(post.content).map((n) => n.toLowerCase()));
    const added = extractMentions(data.content).filter((n) => !before.has(n.toLowerCase()));
    tasks.push(notifyMentions(added, { actorId: user.id, postId: post.id }));
  }
  await Promise.all(tasks);

  return NextResponse.json({ success: true, slug: updated.slug, categorySlug: updated.category.slug });
}

// DELETE /api/forum/topicos/[slug] — Excluir tópico (autor sem respostas ou moderação)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug },
    select: {
      id: true,
      authorId: true,
      private: true,
      title: true,
      _count: { select: { comments: true } },
      category: { select: { slug: true } },
    },
  });

  if (!post || !canViewPost(post, user)) {
    return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
  }

  if (!canDelete({ authorId: post.authorId, replyCount: post._count.comments }, user)) {
    return NextResponse.json(
      { error: "Só é possível excluir um post sem respostas; a moderação pode excluir qualquer post" },
      { status: 403 }
    );
  }

  await prisma.post.delete({ where: { id: post.id } });

  if (post.authorId !== user.id && isStaff(user.role)) {
    await notify({
      userId: post.authorId,
      type: "MODERATION",
      actorId: user.id,
      message: `Seu post "${post.title}" foi removido pela moderação`.slice(0, 255),
    });
  }

  return NextResponse.json({ success: true, categorySlug: post.category.slug });
}
