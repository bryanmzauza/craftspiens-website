import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.forumCategory.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    include: {
      _count: { select: { topics: true } },
      topics: {
        orderBy: { lastActivityAt: "desc" },
        take: 1,
        select: {
          title: true,
          lastActivityAt: true,
          author: {
            select: {
              nlogin: { select: { last_name: true } },
            },
          },
        },
      },
    },
  });

  const totalMembers = await prisma.user.count();

  const result = categories.map((cat) => {
    const lastTopic = cat.topics[0] ?? null;
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      order: cat.order,
      staffOnly: cat.staffOnly,
      topicCount: cat._count.topics,
      lastPost: lastTopic
        ? {
            title: lastTopic.title,
            author: lastTopic.author.nlogin.last_name,
            date: lastTopic.lastActivityAt,
          }
        : null,
    };
  });

  const totalTopics = result.reduce((sum, c) => sum + c.topicCount, 0);

  return NextResponse.json({
    categories: result,
    stats: {
      totalTopics,
      totalMembers,
    },
  });
}
