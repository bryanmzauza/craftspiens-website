// =============================================================================
// Fórum: formato dos tópicos nas listas (categoria, busca, membro, moderação)
// =============================================================================
import type { Prisma } from "@/generated/prisma-pg";
import { AUTHOR_SELECT, type ForumAuthor } from "@/lib/forum/authors";
import { parseTags } from "@/lib/forum/slug";

export const TOPIC_LIST_INCLUDE = {
  author: { select: AUTHOR_SELECT },
  category: { select: { name: true, slug: true } },
  _count: { select: { comments: true, reactions: true } },
} satisfies Prisma.PostInclude;

export type TopicRow = Prisma.PostGetPayload<{ include: typeof TOPIC_LIST_INCLUDE }>;

export interface TopicSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  pinned: boolean;
  locked: boolean;
  resolved: boolean;
  private: boolean;
  views: number;
  tags: string[];
  commentCount: number;
  reactionCount: number;
  lastActivityAt: Date;
  createdAt: Date;
  category: { name: string; slug: string };
  author: ForumAuthor;
}

export function topicSummary(
  topic: TopicRow,
  authors: Map<string, ForumAuthor>,
  excerpt: (content: string) => string
): TopicSummary {
  return {
    id: topic.id,
    title: topic.title,
    slug: topic.slug,
    excerpt: excerpt(topic.content),
    pinned: topic.pinned,
    locked: topic.locked,
    resolved: topic.resolved,
    private: topic.private,
    views: topic.views,
    tags: parseTags(topic.tags),
    commentCount: topic._count.comments,
    reactionCount: topic._count.reactions,
    lastActivityAt: topic.lastActivityAt,
    createdAt: topic.createdAt,
    category: topic.category,
    author: authors.get(topic.authorId)!,
  };
}
