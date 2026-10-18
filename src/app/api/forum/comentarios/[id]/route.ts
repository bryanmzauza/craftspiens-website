import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireWriter } from "@/lib/forum/access";
import { canDelete, canEdit, canViewPost, isStaff } from "@/lib/forum/permissions";
import { extractMentions, renderMarkdown } from "@/lib/forum/markdown";
import { notify, notifyMentions } from "@/lib/forum/notifications";
import { COMMENT_MAX, COMMENT_MIN } from "@/lib/forum/constants";

// PUT /api/forum/comentarios/[id] — Editar comentário (autor em até 30 min ou moderação)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireWriter();
  if ("error" in access) return access.error;
  const { user } = access;

  const { id } = await params;

  const comment = await prisma.comment.findUnique({
    where: { id },
    select: {
      id: true,
      authorId: true,
      createdAt: true,
      content: true,
      postId: true,
      post: { select: { private: true, authorId: true } },
    },
  });

  if (!comment || !canViewPost(comment.post, user)) {
    return NextResponse.json({ error: "Comentário não encontrado" }, { status: 404 });
  }

  if (!canEdit(comment, user)) {
    return NextResponse.json(
      { error: "Só o autor, em até 30 minutos, ou a moderação pode editar este comentário" },
      { status: 403 }
    );
  }

  let body: { content?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (content.length < COMMENT_MIN || content.length > COMMENT_MAX) {
    return NextResponse.json(
      { error: `Comentário deve ter entre ${COMMENT_MIN} e ${COMMENT_MAX} caracteres` },
      { status: 400 }
    );
  }

  const updated = await prisma.comment.update({
    where: { id },
    data: { content, editedAt: new Date() },
    select: { content: true, editedAt: true },
  });

  const before = new Set(extractMentions(comment.content).map((n) => n.toLowerCase()));
  const added = extractMentions(content).filter((n) => !before.has(n.toLowerCase()));
  await notifyMentions(added, { actorId: user.id, postId: comment.postId, commentId: comment.id });

  return NextResponse.json({
    success: true,
    content: updated.content,
    contentHtml: renderMarkdown(updated.content),
    editedAt: updated.editedAt,
  });
}

// DELETE /api/forum/comentarios/[id] — Excluir comentário (autor sem respostas ou moderação)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const comment = await prisma.comment.findUnique({
    where: { id },
    select: {
      id: true,
      authorId: true,
      _count: { select: { replies: true } },
      post: { select: { private: true, authorId: true, title: true } },
    },
  });

  if (!comment || !canViewPost(comment.post, user)) {
    return NextResponse.json({ error: "Comentário não encontrado" }, { status: 404 });
  }

  if (!canDelete({ authorId: comment.authorId, replyCount: comment._count.replies }, user)) {
    return NextResponse.json(
      { error: "Só é possível excluir um comentário sem respostas; a moderação pode excluir qualquer comentário" },
      { status: 403 }
    );
  }

  await prisma.comment.delete({ where: { id } });

  if (comment.authorId !== user.id && isStaff(user.role)) {
    await notify({
      userId: comment.authorId,
      type: "MODERATION",
      actorId: user.id,
      message: `Seu comentário em "${comment.post.title}" foi removido pela moderação`.slice(0, 255),
    });
  }

  return NextResponse.json({ success: true });
}
