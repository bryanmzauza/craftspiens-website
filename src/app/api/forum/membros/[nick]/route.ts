import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findNloginByUsername } from "@/lib/nlogin";
import { getPlayerRank, getStaffMinWeight, isStaffRank } from "@/lib/luckperms";
import { getPlayerSkin, getSeniority } from "@/lib/player-profile";
import { getSessionUser } from "@/lib/forum/access";
import { canBan, canModerate, visiblePostsWhere } from "@/lib/forum/permissions";
import { resolveAuthors } from "@/lib/forum/authors";
import { computeReputation, getReputationBadge } from "@/lib/forum/reputation";
import { isBanned, isPermanentBan } from "@/lib/forum/ban";
import { markdownToText } from "@/lib/forum/markdown";
import { TOPIC_LIST_INCLUDE, topicSummary } from "@/lib/forum/serialize";

const RECENT = 8;

// GET /api/forum/membros/[nick] — página pública do membro
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ nick: string }> }
) {
  const { nick } = await params;
  if (!/^[A-Za-z0-9_]{3,16}$/.test(nick)) {
    return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });
  }

  const nlogin = await findNloginByUsername(nick);
  const member = nlogin
    ? await prisma.user.findUnique({
        where: { nloginId: nlogin.id },
        select: {
          id: true,
          role: true,
          nloginId: true,
          displayName: true,
          createdAt: true,
          deactivatedAt: true,
          forumBannedUntil: true,
          forumBanReason: true,
          profile: { select: { bio: true, perfilPublico: true } },
          _count: { select: { posts: true, comments: true } },
        },
      })
    : null;

  if (!nlogin || !member || member.deactivatedAt) {
    return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });
  }

  const viewer = await getSessionUser();
  const visible = visiblePostsWhere(viewer);

  const [skin, rank, staffMinWeight, likesOnPosts, likesOnComments, dislikes, topics, comments] = await Promise.all([
    getPlayerSkin(nlogin).catch(() => null),
    getPlayerRank(nlogin.unique_id).catch(() => null),
    getStaffMinWeight(),
    prisma.reaction.count({ where: { post: { authorId: member.id }, type: "LIKE" } }),
    prisma.reaction.count({ where: { comment: { authorId: member.id }, type: "LIKE" } }),
    prisma.reaction.count({
      where: { type: "DISLIKE", OR: [{ post: { authorId: member.id } }, { comment: { authorId: member.id } }] },
    }),
    prisma.post.findMany({
      where: { AND: [visible, { authorId: member.id }] },
      orderBy: { createdAt: "desc" },
      take: RECENT,
      include: TOPIC_LIST_INCLUDE,
    }),
    prisma.comment.findMany({
      where: { authorId: member.id, post: visible },
      orderBy: { createdAt: "desc" },
      take: RECENT,
      select: {
        id: true,
        content: true,
        createdAt: true,
        post: { select: { title: true, slug: true, category: { select: { slug: true } } } },
      },
    }),
  ]);

  const reputation = computeReputation({
    posts: member._count.posts,
    comments: member._count.comments,
    likesOnPosts,
    likesOnComments,
    dislikes,
  });

  const authors = await resolveAuthors(topics.map((t) => t.author));
  const moderator = !!viewer && canModerate(viewer.role);
  const banned = isBanned({ until: member.forumBannedUntil });

  return NextResponse.json({
    member: {
      id: member.id,
      username: nlogin.last_name,
      uuid: nlogin.unique_id,
      skin,
      role: member.role,
      rank: rank
        ? { group: rank.group, label: rank.label, color: rank.color, staff: isStaffRank(rank, staffMinWeight) }
        : null,
      seniority: getSeniority(nlogin.creation_date),
      joinedAt: member.createdAt,
      bio: member.profile?.perfilPublico === false ? null : (member.profile?.bio ?? null),
      reputation,
      badge: getReputationBadge(reputation).label,
      postCount: member._count.posts,
      commentCount: member._count.comments,
      likesReceived: likesOnPosts + likesOnComments,
      banned,
      // Detalhes do banimento só para a moderação
      ban:
        moderator && banned
          ? {
              until: member.forumBannedUntil,
              permanent: isPermanentBan(member.forumBannedUntil),
              reason: member.forumBanReason,
            }
          : null,
      canBan: !!viewer && viewer.id !== member.id && canBan(viewer.role, member.role),
    },
    topics: topics.map((t) => topicSummary(t, authors, (c) => markdownToText(c, 120))),
    comments: comments.map((c) => ({
      id: c.id,
      excerpt: markdownToText(c.content, 160),
      createdAt: c.createdAt,
      post: { title: c.post.title, href: `/comunidade/${c.post.category.slug}/${c.post.slug}#comentario-${c.id}` },
    })),
  });
}
