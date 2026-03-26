import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/forum/topicos/[slug] — Detalhe do tópico
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          id: true,
          role: true,
          createdAt: true,
          nlogin: { select: { last_name: true, unique_id: true } },
          profile: { select: { bio: true } },
          _count: { select: { posts: true, comments: true } },
        },
      },
      category: { select: { id: true, name: true, slug: true, icon: true } },
      _count: { select: { comments: true } },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Tópico não encontrado" }, { status: 404 });
  }

  // Incrementar views (fire-and-forget)
  prisma.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } }).catch(() => {});

  // Calcular reputação do autor (RN-FORUM-06)
  const [authorLikesOnPosts, authorLikesOnComments, authorDislikes] = await Promise.all([
    prisma.reaction.count({
      where: { post: { authorId: post.author.id }, type: "LIKE" },
    }),
    prisma.reaction.count({
      where: { comment: { authorId: post.author.id }, type: "LIKE" },
    }),
    prisma.reaction.count({
      where: {
        OR: [
          { post: { authorId: post.author.id }, type: "DISLIKE" },
          { comment: { authorId: post.author.id }, type: "DISLIKE" },
        ],
      },
    }),
  ]);

  const reputation =
    post.author._count.posts +
    post.author._count.comments +
    authorLikesOnPosts * 2 +
    authorLikesOnComments -
    authorDislikes;

  return NextResponse.json({
    post: {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      pinned: post.pinned,
      locked: post.locked,
      resolved: post.resolved,
      views: post.views + 1,
      tags: post.tags ? JSON.parse(post.tags) : [],
      commentCount: post._count.comments,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      lastActivityAt: post.lastActivityAt,
      category: post.category,
      author: {
        id: post.author.id,
        username: post.author.nlogin.last_name,
        uuid: post.author.nlogin.unique_id,
        role: post.author.role,
        bio: post.author.profile?.bio,
        joinedAt: post.author.createdAt,
        postCount: post.author._count.posts,
        commentCount: post.author._count.comments,
        reputation,
      },
    },
  });
}

// PUT /api/forum/topicos/[slug] — Editar tópico (autor dentro de 30min ou staff)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug },
    select: { id: true, authorId: true, createdAt: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Tópico não encontrado" }, { status: 404 });
  }

  const isAuthor = post.authorId === session.user.id;
  const isStaff = ["MODERADOR", "ADMIN", "PROFESSOR"].includes(session.user.role);

  if (!isAuthor && !isStaff) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  // Autor só pode editar dentro de 30 minutos (RN-FORUM-07)
  if (isAuthor && !isStaff) {
    const editWindowMs = 30 * 60 * 1000;
    if (Date.now() - new Date(post.createdAt).getTime() > editWindowMs) {
      return NextResponse.json(
        { error: "O prazo de 30 minutos para edição expirou" },
        { status: 403 }
      );
    }
  }

  let body: { title?: string; content?: string; pinned?: boolean; locked?: boolean; resolved?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (body.title !== undefined) {
    if (body.title.length > 200) {
      return NextResponse.json({ error: "Título deve ter no máximo 200 caracteres" }, { status: 400 });
    }
    data.title = body.title;
  }

  if (body.content !== undefined) {
    if (body.content.length < 20) {
      return NextResponse.json({ error: "Conteúdo deve ter no mínimo 20 caracteres" }, { status: 400 });
    }
    data.content = body.content;
  }

  // Apenas staff pode fixar/fechar/resolver
  if (isStaff) {
    if (body.pinned !== undefined) data.pinned = body.pinned;
    if (body.locked !== undefined) data.locked = body.locked;
    if (body.resolved !== undefined) data.resolved = body.resolved;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  await prisma.post.update({ where: { id: post.id }, data });

  return NextResponse.json({ success: true });
}

// DELETE /api/forum/topicos/[slug] — Deletar tópico (autor sem respostas ou staff)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug },
    select: { id: true, authorId: true, _count: { select: { comments: true } } },
  });

  if (!post) {
    return NextResponse.json({ error: "Tópico não encontrado" }, { status: 404 });
  }

  const isAuthor = post.authorId === session.user.id;
  const isStaff = ["MODERADOR", "ADMIN", "PROFESSOR"].includes(session.user.role);

  if (!isAuthor && !isStaff) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  // Autor só pode deletar se não tiver respostas (RN-FORUM-07)
  if (isAuthor && !isStaff && post._count.comments > 0) {
    return NextResponse.json(
      { error: "Não é possível excluir um tópico que já possui respostas" },
      { status: 403 }
    );
  }

  await prisma.post.delete({ where: { id: post.id } });

  return NextResponse.json({ success: true });
}
