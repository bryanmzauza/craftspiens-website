import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNloginMap } from "@/lib/nlogin";

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
              nloginId: true,
            },
          },
        },
      },
    },
  });

  const totalMembers = await prisma.user.count();

  // Batch fetch nlogin data for last topic authors
  const nloginIds = [...new Set(
    categories
      .filter((c) => c.topics[0])
      .map((c) => c.topics[0].author.nloginId)
  )];
  const nloginMap = await getNloginMap(nloginIds);

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
            author: nloginMap.get(lastTopic.author.nloginId)?.last_name ?? "Unknown",
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
