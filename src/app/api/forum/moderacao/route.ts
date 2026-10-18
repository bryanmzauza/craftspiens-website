import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/forum/access";
import { canModerate } from "@/lib/forum/permissions";
import { AUTHOR_SELECT, resolveAuthors } from "@/lib/forum/authors";
import { isPermanentBan } from "@/lib/forum/ban";
import { markdownToText } from "@/lib/forum/markdown";
import { REPORTS_CATEGORY_SLUG } from "@/lib/forum/constants";
import { TOPIC_LIST_INCLUDE, topicSummary } from "@/lib/forum/serialize";

// GET /api/forum/moderacao — pendências da moderação: denúncias abertas e suspensões ativas
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!canModerate(user.role)) {
    return NextResponse.json({ error: "Apenas a moderação acessa esta página" }, { status: 403 });
  }

  const now = new Date();
  const [openReports, resolvedReports, bans, lockedCount, privateCount] = await Promise.all([
    prisma.post.findMany({
      where: { category: { slug: REPORTS_CATEGORY_SLUG }, resolved: false },
      orderBy: { lastActivityAt: "desc" },
      take: 50,
      include: TOPIC_LIST_INCLUDE,
    }),
    prisma.post.findMany({
      where: { category: { slug: REPORTS_CATEGORY_SLUG }, resolved: true },
      orderBy: { lastActivityAt: "desc" },
      take: 10,
      include: TOPIC_LIST_INCLUDE,
    }),
    prisma.user.findMany({
      where: { forumBannedUntil: { gt: now } },
      orderBy: { forumBannedUntil: "asc" },
      take: 100,
      select: {
        ...AUTHOR_SELECT,
        forumBannedUntil: true,
        forumBanReason: true,
        forumBannedBy: { select: AUTHOR_SELECT },
      },
    }),
    prisma.post.count({ where: { locked: true } }),
    prisma.post.count({ where: { private: true } }),
  ]);

  const authors = await resolveAuthors([
    ...openReports.map((t) => t.author),
    ...resolvedReports.map((t) => t.author),
    ...bans,
    ...bans.flatMap((b) => (b.forumBannedBy ? [b.forumBannedBy] : [])),
  ]);

  const excerpt = (content: string) => markdownToText(content, 160);

  return NextResponse.json({
    reports: {
      open: openReports.map((t) => topicSummary(t, authors, excerpt)),
      resolved: resolvedReports.map((t) => topicSummary(t, authors, excerpt)),
    },
    bans: bans.map((b) => ({
      user: authors.get(b.id)!,
      until: b.forumBannedUntil,
      permanent: isPermanentBan(b.forumBannedUntil),
      reason: b.forumBanReason,
      by: b.forumBannedBy ? authors.get(b.forumBannedBy.id) ?? null : null,
    })),
    counts: { openReports: openReports.length, bans: bans.length, locked: lockedCount, private: privateCount },
  });
}
