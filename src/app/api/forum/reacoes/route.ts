import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/forum/reacoes — Toggle like/dislike em tópico ou comentário
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let body: { postId?: string; commentId?: string; type?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const { postId, commentId, type } = body;

  if (!type || !["LIKE", "DISLIKE"].includes(type)) {
    return NextResponse.json({ error: "type deve ser LIKE ou DISLIKE" }, { status: 400 });
  }

  if (!postId && !commentId) {
    return NextResponse.json({ error: "postId ou commentId é obrigatório" }, { status: 400 });
  }

  if (postId && commentId) {
    return NextResponse.json({ error: "Informe apenas postId OU commentId" }, { status: 400 });
  }

  const reactionType = type as "LIKE" | "DISLIKE";

  if (postId) {
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) {
      return NextResponse.json({ error: "Tópico não encontrado" }, { status: 404 });
    }

    const existing = await prisma.reaction.findUnique({
      where: { userId_postId: { userId: session.user.id, postId } },
    });

    if (existing) {
      if (existing.type === reactionType) {
        // Remove reaction (toggle off)
        await prisma.reaction.delete({ where: { id: existing.id } });
        return NextResponse.json({ action: "removed" });
      } else {
        // Switch reaction type
        await prisma.reaction.update({
          where: { id: existing.id },
          data: { type: reactionType },
        });
        return NextResponse.json({ action: "switched", type: reactionType });
      }
    }

    await prisma.reaction.create({
      data: { userId: session.user.id, postId, type: reactionType },
    });
    return NextResponse.json({ action: "created", type: reactionType }, { status: 201 });
  }

  if (commentId) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId }, select: { id: true } });
    if (!comment) {
      return NextResponse.json({ error: "Comentário não encontrado" }, { status: 404 });
    }

    const existing = await prisma.reaction.findUnique({
      where: { userId_commentId: { userId: session.user.id, commentId } },
    });

    if (existing) {
      if (existing.type === reactionType) {
        await prisma.reaction.delete({ where: { id: existing.id } });
        return NextResponse.json({ action: "removed" });
      } else {
        await prisma.reaction.update({
          where: { id: existing.id },
          data: { type: reactionType },
        });
        return NextResponse.json({ action: "switched", type: reactionType });
      }
    }

    await prisma.reaction.create({
      data: { userId: session.user.id, commentId, type: reactionType },
    });
    return NextResponse.json({ action: "created", type: reactionType }, { status: 201 });
  }

  return NextResponse.json({ error: "Operação inválida" }, { status: 400 });
}
