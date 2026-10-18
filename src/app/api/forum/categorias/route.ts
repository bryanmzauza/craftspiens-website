import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/forum/access";
import { visiblePostsWhere } from "@/lib/forum/permissions";
import { AUTHOR_SELECT, resolveAuthors } from "@/lib/forum/authors";

// GET /api/forum/categorias — categorias com contagens, último tópico e totais do fórum
export async function GET() {
  const user = await getSessionUser();
  const visible = visiblePostsWhere(user);

  const [categories, totalMembers, commentRows, totalComments] = await Promise.all([
    prisma.forumCategory.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      include: {
        _count: { select: { topics: { where: visible } } },
        topics: {
          where: visible,
          orderBy: { lastActivityAt: "desc" },
          take: 1,
          select: {
            title: true,
            slug: true,
            lastActivityAt: true,
            author: { select: AUTHOR_SELECT },
          },
        },
      },
    }),
    prisma.user.count({ where: { deactivatedAt: null } }),
    // Comentários por categoria, só dos tópicos públicos (os privados são poucos e não contam)
    prisma.$queryRaw<{ category_id: string; total: bigint }[]>`
      SELECT p.category_id, COUNT(c.id) AS total
      FROM comments c JOIN posts p ON p.id = c.post_id
      WHERE p.private = false
      GROUP BY p.category_id
    `,
    prisma.comment.count({ where: { post: { private: false } } }),
  ]);

  const commentsByCategory = new Map(commentRows.map((r) => [r.category_id, Number(r.total)]));
  const authors = await resolveAuthors(categories.flatMap((c) => c.topics.map((t) => t.author)));

  const result = categories.map((cat) => {
    const last = cat.topics[0] ?? null;
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      order: cat.order,
      staffOnly: cat.staffOnly,
      topicCount: cat._count.topics,
      commentCount: commentsByCategory.get(cat.id) ?? 0,
      lastPost: last
        ? {
            title: last.title,
            slug: last.slug,
            author: authors.get(last.author.id)!.username,
            date: last.lastActivityAt,
          }
        : null,
    };
  });

  return NextResponse.json({
    categories: result,
    stats: {
      totalTopics: result.reduce((sum, c) => sum + c.topicCount, 0),
      totalComments,
      totalMembers,
    },
  });
}
