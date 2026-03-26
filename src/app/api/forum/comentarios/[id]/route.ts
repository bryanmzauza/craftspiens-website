import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PUT /api/forum/comentarios/[id] — Editar comentário (autor dentro de 30min ou staff)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { id: true, authorId: true, createdAt: true },
  });

  if (!comment) {
    return NextResponse.json({ error: "Comentário não encontrado" }, { status: 404 });
  }

  const isAuthor = comment.authorId === session.user.id;
  const isStaff = ["MODERADOR", "ADMIN", "PROFESSOR"].includes(session.user.role);

  if (!isAuthor && !isStaff) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  if (isAuthor && !isStaff) {
    const editWindowMs = 30 * 60 * 1000;
    if (Date.now() - new Date(comment.createdAt).getTime() > editWindowMs) {
      return NextResponse.json(
        { error: "O prazo de 30 minutos para edição expirou" },
        { status: 403 }
      );
    }
  }

  let body: { content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  if (!body.content || body.content.length < 2 || body.content.length > 5000) {
    return NextResponse.json({ error: "Conteúdo deve ter entre 2 e 5000 caracteres" }, { status: 400 });
  }

  await prisma.comment.update({
    where: { id },
    data: { content: body.content },
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/forum/comentarios/[id] — Deletar comentário (autor sem respostas ou staff)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { id: true, authorId: true, _count: { select: { replies: true } } },
  });

  if (!comment) {
    return NextResponse.json({ error: "Comentário não encontrado" }, { status: 404 });
  }

  const isAuthor = comment.authorId === session.user.id;
  const isStaff = ["MODERADOR", "ADMIN", "PROFESSOR"].includes(session.user.role);

  if (!isAuthor && !isStaff) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  if (isAuthor && !isStaff && comment._count.replies > 0) {
    return NextResponse.json(
      { error: "Não é possível excluir um comentário que já possui respostas" },
      { status: 403 }
    );
  }

  await prisma.comment.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
