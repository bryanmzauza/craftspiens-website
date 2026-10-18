import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma-pg";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { getSessionUser, requireWriter } from "@/lib/forum/access";
import { isStaff, visiblePostsWhere } from "@/lib/forum/permissions";
import { resolveAuthors } from "@/lib/forum/authors";
import { extractMentions, markdownToText } from "@/lib/forum/markdown";
import { normalizeTags, slugify } from "@/lib/forum/slug";
import { notifyMentions, notifyModerators } from "@/lib/forum/notifications";
import { TOPIC_LIST_INCLUDE, topicSummary } from "@/lib/forum/serialize";
import {
  CONTENT_MAX,
  CONTENT_MIN,
  MIN_ACCOUNT_AGE_MS,
  REPORTS_CATEGORY_SLUG,
  TAGS_MAX,
  TITLE_MAX,
  TOPIC_FILTERS,
  TOPIC_SORTS,
  TOPICS_PER_PAGE,
  type TopicFilter,
  type TopicSort,
} from "@/lib/forum/constants";

// GET /api/forum/topicos?categoria=slug&busca=texto&pagina=1&ordem=atividade&filtro=todos&tag=x
// Sem `categoria`, lista (ou busca) em todo o fórum.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const categoriaSlug = searchParams.get("categoria");
  const busca = searchParams.get("busca")?.trim().slice(0, 100) || null;
  const tag = searchParams.get("tag")?.trim().toLowerCase() || null;
  const page = Math.max(1, Number(searchParams.get("pagina") ?? 1) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limite") ?? TOPICS_PER_PAGE) || TOPICS_PER_PAGE));
  const ordem = (searchParams.get("ordem") ?? "atividade") as TopicSort;
  const filtro = (searchParams.get("filtro") ?? "todos") as TopicFilter;

  if (!TOPIC_SORTS.includes(ordem) || !TOPIC_FILTERS.includes(filtro)) {
    return NextResponse.json({ error: "Parâmetros de ordenação ou filtro inválidos" }, { status: 400 });
  }

  const user = await getSessionUser();

  let category = null;
  if (categoriaSlug) {
    category = await prisma.forumCategory.findUnique({
      where: { slug: categoriaSlug },
      select: { id: true, name: true, slug: true, description: true, icon: true, staffOnly: true, active: true },
    });
    if (!category || !category.active) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
    }
  }

  // Todas as condições em AND: a visibilidade e a busca têm OR próprio
  const conditions: Prisma.PostWhereInput[] = [
    visiblePostsWhere(user) as Prisma.PostWhereInput,
    category ? { categoryId: category.id } : { category: { active: true } },
  ];

  if (busca) {
    conditions.push({
      OR: [
        { title: { contains: busca, mode: "insensitive" } },
        { content: { contains: busca, mode: "insensitive" } },
      ],
    });
  }

  if (tag) {
    // Tags são um JSON de strings; a busca por texto é suficiente para o volume do fórum
    conditions.push({ tags: { contains: `"${tag}"` } });
  }

  if (filtro === "abertos") conditions.push({ resolved: false });
  if (filtro === "resolvidos") conditions.push({ resolved: true });
  if (filtro === "sem-resposta") conditions.push({ comments: { none: {} } });

  const where: Prisma.PostWhereInput = { AND: conditions };

  const orderBy: Prisma.PostOrderByWithRelationInput[] =
    ordem === "recentes"
      ? [{ createdAt: "desc" }]
      : ordem === "comentados"
        ? [{ comments: { _count: "desc" } }, { lastActivityAt: "desc" }]
        : ordem === "vistos"
          ? [{ views: "desc" }, { lastActivityAt: "desc" }]
          : category
            ? [{ pinned: "desc" }, { lastActivityAt: "desc" }]
            : [{ lastActivityAt: "desc" }];

  const [topics, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: TOPIC_LIST_INCLUDE,
    }),
    prisma.post.count({ where }),
  ]);

  const authors = await resolveAuthors(topics.map((t) => t.author));

  return NextResponse.json({
    category: category
      ? {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          icon: category.icon,
          staffOnly: category.staffOnly,
        }
      : null,
    topics: topics.map((t) => topicSummary(t, authors, (c) => markdownToText(c, 140))),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}

// POST /api/forum/topicos — Criar novo tópico
export async function POST(request: NextRequest) {
  const access = await requireWriter();
  if ("error" in access) return access.error;
  const { user } = access;

  // Rate limit: 5 tópicos/hora por usuário (RN-FORUM-05)
  const rl = await checkRateLimit(`forum-topic:${user.id}`, RATE_LIMITS.forumTopic);
  if (!rl.success) {
    return rateLimitResponse(rl, "Limite de criação de tópicos excedido. Tente novamente mais tarde.");
  }

  // Anti-spam: conta com mais de 1h de criação (RN-FORUM-05)
  const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();
  if (accountAgeMs < MIN_ACCOUNT_AGE_MS && !isStaff(user.role)) {
    return NextResponse.json(
      { error: "Sua conta precisa ter pelo menos 1 hora para criar tópicos." },
      { status: 403 }
    );
  }

  let body: { categoryId?: unknown; title?: unknown; content?: unknown; tags?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const categoryId = typeof body.categoryId === "string" ? body.categoryId : "";
  const title = typeof body.title === "string" ? body.title.trim().replace(/\s+/g, " ") : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!categoryId || !title || !content) {
    return NextResponse.json({ error: "Categoria, título e conteúdo são obrigatórios" }, { status: 400 });
  }
  if (title.length > TITLE_MAX) {
    return NextResponse.json({ error: `Título deve ter no máximo ${TITLE_MAX} caracteres` }, { status: 400 });
  }
  if (content.length < CONTENT_MIN) {
    return NextResponse.json({ error: `Conteúdo deve ter no mínimo ${CONTENT_MIN} caracteres` }, { status: 400 });
  }
  if (content.length > CONTENT_MAX) {
    return NextResponse.json({ error: `Conteúdo deve ter no máximo ${CONTENT_MAX} caracteres` }, { status: 400 });
  }

  const tags = normalizeTags(body.tags);
  if (tags === null) {
    return NextResponse.json({ error: `Tags inválidas (máximo de ${TAGS_MAX})` }, { status: 400 });
  }

  const category = await prisma.forumCategory.findUnique({
    where: { id: categoryId },
    select: { id: true, slug: true, staffOnly: true, active: true },
  });

  if (!category || !category.active) {
    return NextResponse.json({ error: "Categoria não encontrada ou inativa" }, { status: 404 });
  }

  if (category.staffOnly && !isStaff(user.role)) {
    return NextResponse.json({ error: "Apenas a equipe pode criar tópicos nesta categoria" }, { status: 403 });
  }

  // Tópico duplicado: mesmo título na mesma categoria em 24h (RN-FORUM-05)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const duplicate = await prisma.post.findFirst({
    where: { categoryId, title: { equals: title, mode: "insensitive" }, createdAt: { gte: oneDayAgo } },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "Um tópico com esse título já foi criado nesta categoria nas últimas 24h" },
      { status: 409 }
    );
  }

  const baseSlug = slugify(title) || "topico";
  let slug = baseSlug;
  let suffix = 0;
  while (await prisma.post.findUnique({ where: { slug }, select: { id: true } })) {
    suffix++;
    slug = `${baseSlug}-${suffix}`;
  }

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      content,
      authorId: user.id,
      categoryId,
      tags: tags.length > 0 ? JSON.stringify(tags) : null,
      lastActivityAt: new Date(),
    },
    select: { id: true, title: true, slug: true },
  });

  // Avisos: menções no texto e, nas denúncias, a moderação
  const mentions = extractMentions(content);
  await Promise.all([
    notifyMentions(mentions, { actorId: user.id, postId: post.id }),
    category.slug === REPORTS_CATEGORY_SLUG
      ? notifyModerators({ type: "REPORT", actorId: user.id, postId: post.id })
      : Promise.resolve(),
  ]);

  return NextResponse.json(
    { id: post.id, title: post.title, slug: post.slug, categorySlug: category.slug },
    { status: 201 }
  );
}
