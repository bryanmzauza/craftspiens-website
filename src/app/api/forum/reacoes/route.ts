import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { requireWriter } from "@/lib/forum/access";
import { canViewPost } from "@/lib/forum/permissions";
import { notify } from "@/lib/forum/notifications";

type ReactionType = "LIKE" | "DISLIKE";

async function counts(where: { postId: string } | { commentId: string }, userId: string) {
  const reactions = await prisma.reaction.findMany({ where, select: { type: true, userId: true } });
  return {
    likes: reactions.filter((r) => r.type === "LIKE").length,
    dislikes: reactions.filter((r) => r.type === "DISLIKE").length,
    userReaction: reactions.find((r) => r.userId === userId)?.type ?? null,
  };
}

// POST /api/forum/reacoes — Alterna curtir/descurtir em tópico ou comentário
export async function POST(request: NextRequest) {
  const access = await requireWriter();
  if ("error" in access) return access.error;
  const { user } = access;

  const rl = await checkRateLimit(`reaction:${user.id}`, RATE_LIMITS.reaction);
  if (!rl.success) {
    return rateLimitResponse(rl, "Muitas reações seguidas. Aguarde um momento.");
  }

  let body: { postId?: unknown; commentId?: unknown; type?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const type = body.type;
  if (type !== "LIKE" && type !== "DISLIKE") {
    return NextResponse.json({ error: "type deve ser LIKE ou DISLIKE" }, { status: 400 });
  }
  const reactionType = type as ReactionType;

  const postId = typeof body.postId === "string" ? body.postId : null;
  const commentId = typeof body.commentId === "string" ? body.commentId : null;

  if ((!postId && !commentId) || (postId && commentId)) {
    return NextResponse.json({ error: "Informe postId ou commentId (apenas um)" }, { status: 400 });
  }

  // Alvo, dono e visibilidade
  let ownerId: string;
  if (postId) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, private: true },
    });
    if (!post || !canViewPost(post, user)) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }
    ownerId = post.authorId;
  } else {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId! },
      select: { id: true, authorId: true, post: { select: { private: true, authorId: true } } },
    });
    if (!comment || !canViewPost(comment.post, user)) {
      return NextResponse.json({ error: "Comentário não encontrado" }, { status: 404 });
    }
    ownerId = comment.authorId;
  }

  if (ownerId === user.id) {
    return NextResponse.json({ error: "Não é possível reagir ao próprio conteúdo" }, { status: 400 });
  }

  const target = postId ? { postId } : { commentId: commentId! };
  const existing = await prisma.reaction.findFirst({
    where: { userId: user.id, ...target },
    select: { id: true, type: true },
  });

  let action: "created" | "switched" | "removed";
  if (!existing) {
    await prisma.reaction.create({ data: { userId: user.id, type: reactionType, ...target } });
    action = "created";
  } else if (existing.type === reactionType) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    action = "removed";
  } else {
    await prisma.reaction.update({ where: { id: existing.id }, data: { type: reactionType } });
    action = "switched";
  }

  if (reactionType === "LIKE" && action !== "removed") {
    await notify({
      userId: ownerId,
      type: postId ? "LIKE_POST" : "LIKE_COMMENT",
      actorId: user.id,
      postId: postId ?? undefined,
      commentId: commentId ?? undefined,
    });
  }

  return NextResponse.json({ action, ...(await counts(target, user.id)) }, { status: action === "created" ? 201 : 200 });
}
