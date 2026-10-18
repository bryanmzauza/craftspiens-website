import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/forum/access";
import { AUTHOR_SELECT, resolveAuthors } from "@/lib/forum/authors";
import { NOTIFICATIONS_PER_PAGE } from "@/lib/forum/constants";

// GET /api/forum/notificacoes?pagina=1 — notificações do usuário logado, mais novas primeiro
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const page = Math.max(1, Number(request.nextUrl.searchParams.get("pagina") ?? 1) || 1);
  const limit = NOTIFICATIONS_PER_PAGE;

  const [items, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        actor: { select: AUTHOR_SELECT },
        post: { select: { title: true, slug: true, category: { select: { slug: true } } } },
      },
    }),
    prisma.notification.count({ where: { userId: user.id } }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);

  const authors = await resolveAuthors(items.flatMap((n) => (n.actor ? [n.actor] : [])));

  return NextResponse.json({
    notifications: items.map((n) => ({
      id: n.id,
      type: n.type,
      message: n.message,
      readAt: n.readAt,
      createdAt: n.createdAt,
      actor: n.actor ? authors.get(n.actor.id) ?? null : null,
      post: n.post
        ? {
            title: n.post.title,
            href: `/comunidade/${n.post.category.slug}/${n.post.slug}${n.commentId ? `#comentario-${n.commentId}` : ""}`,
          }
        : null,
    })),
    unread,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
}

// PUT /api/forum/notificacoes — marca como lidas: { ids: [...] } ou { todas: true }
export async function PUT(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let body: { ids?: unknown; todas?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const now = new Date();
  if (body.todas === true) {
    await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: now },
    });
  } else if (Array.isArray(body.ids) && body.ids.every((id) => typeof id === "string")) {
    await prisma.notification.updateMany({
      where: { userId: user.id, id: { in: body.ids as string[] }, readAt: null },
      data: { readAt: now },
    });
  } else {
    return NextResponse.json({ error: "Informe ids ou todas: true" }, { status: 400 });
  }

  const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });
  return NextResponse.json({ success: true, unread });
}
