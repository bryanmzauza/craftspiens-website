import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { getNloginMap } from "@/lib/nlogin";

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 250);
}

// GET /api/forum/topicos?categoria=slug&page=1&limit=20
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const categoriaSlug = searchParams.get("categoria");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const busca = searchParams.get("busca");

  if (!categoriaSlug) {
    return NextResponse.json({ error: "Parâmetro 'categoria' é obrigatório" }, { status: 400 });
  }

  const category = await prisma.forumCategory.findUnique({
    where: { slug: categoriaSlug },
    select: { id: true, name: true, slug: true, description: true, icon: true, staffOnly: true },
  });

  if (!category) {
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }

  const where: Record<string, unknown> = { categoryId: category.id };

  if (busca) {
    where.OR = [
      { title: { contains: busca } },
      { content: { contains: busca } },
    ];
  }

  const [topics, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { lastActivityAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            role: true,
            nloginId: true,
          },
        },
        _count: { select: { comments: true, reactions: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  // Batch fetch nlogin data for topic authors
  const nloginIds = [...new Set(topics.map((t) => t.author.nloginId))];
  const nloginMap = await getNloginMap(nloginIds);

  return NextResponse.json({
    category,
    topics: topics.map((t) => ({
      id: t.id,
      title: t.title,
      slug: t.slug,
      pinned: t.pinned,
      locked: t.locked,
      resolved: t.resolved,
      views: t.views,
      tags: t.tags ? JSON.parse(t.tags) : [],
      commentCount: t._count.comments,
      reactionCount: t._count.reactions,
      lastActivityAt: t.lastActivityAt,
      createdAt: t.createdAt,
      author: {
        id: t.author.id,
        username: nloginMap.get(t.author.nloginId)?.last_name ?? "Unknown",
        uuid: nloginMap.get(t.author.nloginId)?.unique_id ?? null,
        role: t.author.role,
      },
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST /api/forum/topicos — Criar novo tópico
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // No fórum o autor aparece pelo nick: exige um nick do Minecraft vinculado
  if (session.user.nloginId == null) {
    return NextResponse.json(
      { error: "Vincule seu nick do Minecraft em Configurações > Contas vinculadas para participar do fórum.", code: "SemNick" },
      { status: 403 }
    );
  }

  // Rate limit: 5 tópicos/hora por usuário (RN-FORUM-05)
  const rl = await checkRateLimit(`forum-topic:${session.user.id}`, RATE_LIMITS.forumTopic);
  if (!rl.success) {
    return rateLimitResponse(rl, "Limite de criação de tópicos excedido. Tente novamente mais tarde.");
  }

  // Anti-spam: conta com mais de 1h de criação (RN-FORUM-05)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { createdAt: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();
  const isStaff = ["MODERADOR", "ADMIN", "PROFESSOR"].includes(user.role);
  if (accountAgeMs < 60 * 60 * 1000 && !isStaff) {
    return NextResponse.json(
      { error: "Sua conta precisa ter pelo menos 1 hora para criar tópicos." },
      { status: 403 }
    );
  }

  let body: { categoryId?: string; title?: string; content?: string; tags?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const { categoryId, title, content, tags } = body;

  if (!categoryId || !title || !content) {
    return NextResponse.json({ error: "categoryId, title e content são obrigatórios" }, { status: 400 });
  }

  if (title.length > 200) {
    return NextResponse.json({ error: "Título deve ter no máximo 200 caracteres" }, { status: 400 });
  }

  if (content.length < 20) {
    return NextResponse.json({ error: "Conteúdo deve ter no mínimo 20 caracteres" }, { status: 400 });
  }

  if (tags && tags.length > 5) {
    return NextResponse.json({ error: "Máximo de 5 tags" }, { status: 400 });
  }

  const category = await prisma.forumCategory.findUnique({
    where: { id: categoryId },
    select: { id: true, staffOnly: true, active: true },
  });

  if (!category || !category.active) {
    return NextResponse.json({ error: "Categoria não encontrada ou inativa" }, { status: 404 });
  }

  if (category.staffOnly && !isStaff) {
    return NextResponse.json({ error: "Apenas staff pode criar tópicos nesta categoria" }, { status: 403 });
  }

  // Verificação de tópico duplicado (mesmo título na mesma categoria em 24h)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const duplicate = await prisma.post.findFirst({
    where: {
      categoryId,
      title,
      createdAt: { gte: oneDayAgo },
    },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "Um tópico com esse título já foi criado nesta categoria nas últimas 24h" },
      { status: 409 }
    );
  }

  const baseSlug = slugify(title);
  let slug = baseSlug;
  let suffix = 0;
  while (await prisma.post.findUnique({ where: { slug } })) {
    suffix++;
    slug = `${baseSlug}-${suffix}`;
  }

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      content,
      authorId: session.user.id,
      categoryId,
      tags: tags ? JSON.stringify(tags) : null,
      lastActivityAt: new Date(),
    },
    include: {
      category: { select: { slug: true } },
    },
  });

  return NextResponse.json(
    {
      id: post.id,
      title: post.title,
      slug: post.slug,
      categorySlug: post.category.slug,
    },
    { status: 201 }
  );
}
