import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma-pg";
import { prisma, prismaMariaDb } from "@/lib/prisma";
import { getSessionUser } from "@/lib/forum/access";
import { canModerate } from "@/lib/forum/permissions";
import { AUTHOR_SELECT, resolveAuthors } from "@/lib/forum/authors";
import { isBanned } from "@/lib/forum/ban";

const PER_PAGE = 24;
const SORTS = ["ativos", "recentes", "antigos"] as const;
type Sort = (typeof SORTS)[number];

// GET /api/forum/membros?busca=&ordem=ativos|recentes|antigos&pagina=1
// Membros com nick vinculado (os que podem participar do fórum), sem dados pessoais.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const busca = searchParams.get("busca")?.trim().slice(0, 16) || null;
  const page = Math.max(1, Number(searchParams.get("pagina") ?? 1) || 1);
  const ordem = (searchParams.get("ordem") ?? "ativos") as Sort;
  if (!SORTS.includes(ordem)) {
    return NextResponse.json({ error: "Ordenação inválida" }, { status: 400 });
  }

  const viewer = await getSessionUser();
  const moderator = !!viewer && canModerate(viewer.role);

  const where: Prisma.UserWhereInput = { deactivatedAt: null, nloginId: { not: null } };

  // Busca pelo nick: o nick mora no nLogin (MariaDB), por isso primeiro os ids de lá
  if (busca) {
    if (!/^[A-Za-z0-9_]+$/.test(busca)) {
      return NextResponse.json({ members: [], pagination: { page: 1, limit: PER_PAGE, total: 0, totalPages: 1 } });
    }
    const matches = await prismaMariaDb.nlogin.findMany({
      where: { last_name: { contains: busca } },
      select: { id: true },
      take: 500,
    });
    where.nloginId = { in: matches.map((m) => m.id) };
  }

  const orderBy: Prisma.UserOrderByWithRelationInput[] =
    ordem === "recentes"
      ? [{ createdAt: "desc" }]
      : ordem === "antigos"
        ? [{ createdAt: "asc" }]
        : [{ posts: { _count: "desc" } }, { comments: { _count: "desc" } }, { createdAt: "asc" }];

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        ...AUTHOR_SELECT,
        createdAt: true,
        forumBannedUntil: true,
        _count: { select: { posts: true, comments: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const authors = await resolveAuthors(users);

  return NextResponse.json({
    members: users.map((u) => ({
      ...authors.get(u.id)!,
      joinedAt: u.createdAt,
      postCount: u._count.posts,
      commentCount: u._count.comments,
      // Suspensão visível só para a moderação
      banned: moderator ? isBanned({ until: u.forumBannedUntil }) : false,
    })),
    pagination: { page, limit: PER_PAGE, total, totalPages: Math.max(1, Math.ceil(total / PER_PAGE)) },
  });
}
