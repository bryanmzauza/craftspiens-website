import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// GET /api/forum/comentarios?topicoId=xxx&page=1&limit=30
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const topicoId = searchParams.get("topicoId");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 30)));

  if (!topicoId) {
    return NextResponse.json({ error: "Parâmetro 'topicoId' é obrigatório" }, { status: 400 });
  }

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { postId: topicoId, parentId: null },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            role: true,
            createdAt: true,
            nlogin: { select: { last_name: true, unique_id: true } },
            _count: { select: { posts: true, comments: true } },
          },
        },
        reactions: {
          select: { type: true, userId: true },
        },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true,
                role: true,
                nlogin: { select: { last_name: true, unique_id: true } },
              },
            },
            reactions: {
              select: { type: true, userId: true },
            },
          },
        },
      },
    }),
    prisma.comment.count({ where: { postId: topicoId, parentId: null } }),
  ]);

  function mapComment(c: typeof comments[number]) {
    const likes = c.reactions.filter((r) => r.type === "LIKE").length;
    const dislikes = c.reactions.filter((r) => r.type === "DISLIKE").length;
    return {
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      likes,
      dislikes,
      author: {
        id: c.author.id,
        username: c.author.nlogin.last_name,
        uuid: c.author.nlogin.unique_id,
        role: c.author.role,
      },
      replies: "replies" in c
        ? (c.replies as typeof comments).map((r) => {
            const rLikes = r.reactions.filter((rx) => rx.type === "LIKE").length;
            const rDislikes = r.reactions.filter((rx) => rx.type === "DISLIKE").length;
            return {
              id: r.id,
              content: r.content,
              createdAt: r.createdAt,
              updatedAt: r.updatedAt,
              likes: rLikes,
              dislikes: rDislikes,
              author: {
                id: r.author.id,
                username: r.author.nlogin.last_name,
                uuid: r.author.nlogin.unique_id,
                role: r.author.role,
              },
            };
          })
        : [],
    };
  }

  return NextResponse.json({
    comments: comments.map(mapComment),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST /api/forum/comentarios — Criar comentário ou resposta
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // Rate limit: 10 comentários/15min
  const rl = checkRateLimit(`forum-comment:${session.user.id}`, RATE_LIMITS.forumComment);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Limite de comentários excedido. Tente novamente mais tarde." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  let body: { postId?: string; content?: string; parentId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const { postId, content, parentId } = body;

  if (!postId || !content) {
    return NextResponse.json({ error: "postId e content são obrigatórios" }, { status: 400 });
  }

  if (content.length < 2 || content.length > 5000) {
    return NextResponse.json({ error: "Conteúdo deve ter entre 2 e 5000 caracteres" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, locked: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Tópico não encontrado" }, { status: 404 });
  }

  if (post.locked) {
    return NextResponse.json({ error: "Este tópico está fechado para novos comentários" }, { status: 403 });
  }

  // Se tem parentId, verificar que o parent existe e pertence ao mesmo post
  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { postId: true, parentId: true },
    });
    if (!parent || parent.postId !== postId) {
      return NextResponse.json({ error: "Comentário pai não encontrado" }, { status: 404 });
    }
    // Apenas 1 nível de aninhamento (RN-FORUM-04)
    if (parent.parentId) {
      return NextResponse.json({ error: "Não é possível responder a uma resposta (apenas 1 nível)" }, { status: 400 });
    }
  }

  const [comment] = await Promise.all([
    prisma.comment.create({
      data: {
        content,
        authorId: session.user.id,
        postId,
        parentId: parentId ?? null,
      },
      include: {
        author: {
          select: {
            id: true,
            role: true,
            nlogin: { select: { last_name: true, unique_id: true } },
          },
        },
      },
    }),
    // Atualizar lastActivityAt do tópico
    prisma.post.update({
      where: { id: postId },
      data: { lastActivityAt: new Date() },
    }),
  ]);

  return NextResponse.json(
    {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: {
        id: comment.author.id,
        username: comment.author.nlogin.last_name,
        uuid: comment.author.nlogin.unique_id,
        role: comment.author.role,
      },
    },
    { status: 201 }
  );
}
