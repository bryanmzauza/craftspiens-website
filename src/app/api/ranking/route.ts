import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enrichUsersWithNlogin } from "@/lib/nlogin";

export const dynamic = "force-dynamic";

const RANKING_SIZE = 10;

// GET /api/ranking — top alunos por aulas concluídas (apenas perfis públicos e contas ativas)
export async function GET() {
  const grouped = await prisma.userLessonProgress.groupBy({
    by: ["userId"],
    where: {
      // Só contas com nick do Minecraft vinculado aparecem no ranking
      user: { deactivatedAt: null, nloginId: { not: null }, profile: { perfilPublico: true } },
    },
    _count: { lessonId: true },
    orderBy: [{ _count: { lessonId: "desc" } }, { userId: "asc" }],
    take: RANKING_SIZE,
  });

  if (grouped.length === 0) {
    return NextResponse.json({ ranking: [] });
  }

  const users = await prisma.user.findMany({
    where: { id: { in: grouped.map((g) => g.userId) } },
    select: { id: true, nloginId: true },
  });
  const enriched = await enrichUsersWithNlogin(users);
  const userMap = new Map(enriched.map((u) => [u.id, u]));

  const ranking = grouped.flatMap((g) => {
    const user = userMap.get(g.userId);
    if (!user) return [];
    return [
      {
        username: user.nlogin.last_name,
        uuid: user.nlogin.unique_id,
        aulas: g._count.lessonId,
      },
    ];
  });

  return NextResponse.json({
    ranking: ranking.map((entry, i) => ({ position: i + 1, ...entry })),
  });
}
