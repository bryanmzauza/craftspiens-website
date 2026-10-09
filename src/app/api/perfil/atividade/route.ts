import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const LIMIT = 10;

type ActivityType = "compra" | "topico" | "comentario" | "aula";

interface Activity {
  type: ActivityType;
  title: string;
  href?: string;
  date: Date;
}

function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

// GET /api/perfil/atividade — atividades recentes do usuário logado
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  const userId = session.user.id;

  const [orders, posts, comments, lessons] = await Promise.all([
    prisma.order.findMany({
      where: { userId, status: "APPROVED" },
      orderBy: { updatedAt: "desc" },
      take: LIMIT,
      select: {
        total: true,
        updatedAt: true,
        items: { select: { product: { select: { name: true } } } },
      },
    }),
    prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: LIMIT,
      select: {
        title: true,
        slug: true,
        createdAt: true,
        category: { select: { slug: true } },
      },
    }),
    prisma.comment.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: LIMIT,
      select: {
        createdAt: true,
        post: {
          select: { title: true, slug: true, category: { select: { slug: true } } },
        },
      },
    }),
    prisma.userLessonProgress.findMany({
      where: { userId },
      orderBy: { completedAt: "desc" },
      take: LIMIT,
      select: {
        completedAt: true,
        lesson: {
          select: {
            title: true,
            slug: true,
            active: true,
            discipline: { select: { name: true, slug: true, active: true } },
          },
        },
      },
    }),
  ]);

  const activities: Activity[] = [
    ...orders.map((o) => ({
      type: "compra" as const,
      title: `${o.items.map((i) => i.product.name).join(", ")} (${formatBRL(Number(o.total))})`,
      href: "/perfil/compras",
      date: o.updatedAt,
    })),
    ...posts.map((p) => ({
      type: "topico" as const,
      title: p.title,
      href: `/comunidade/${p.category.slug}/${p.slug}`,
      date: p.createdAt,
    })),
    ...comments.map((c) => ({
      type: "comentario" as const,
      title: c.post.title,
      href: `/comunidade/${c.post.category.slug}/${c.post.slug}`,
      date: c.createdAt,
    })),
    ...lessons.map((l) => ({
      type: "aula" as const,
      title: `${l.lesson.title} (${l.lesson.discipline.name})`,
      // Aulas/disciplinas desativadas não têm página: sem link
      href:
        l.lesson.active && l.lesson.discipline.active
          ? `/aulas/${l.lesson.discipline.slug}/${l.lesson.slug}`
          : undefined,
      date: l.completedAt,
    })),
  ];

  activities.sort((a, b) => b.date.getTime() - a.date.getTime());

  return NextResponse.json({ activities: activities.slice(0, LIMIT) });
}
