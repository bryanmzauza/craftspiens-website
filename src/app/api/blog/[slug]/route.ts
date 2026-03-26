import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { slug, published: true },
    include: {
      category: true,
      author: { select: { id: true, nlogin: { select: { last_name: true, unique_id: true } } } },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
  }

  // Incrementar views de forma assíncrona (fire-and-forget)
  prisma.blogPost.update({
    where: { id: post.id },
    data: { views: { increment: 1 } },
  }).catch(() => {});

  // Buscar posts relacionados (mesma categoria, excluindo o atual)
  const related = await prisma.blogPost.findMany({
    where: {
      published: true,
      categoryId: post.categoryId,
      id: { not: post.id },
    },
    include: {
      category: true,
      author: { select: { id: true, nlogin: { select: { last_name: true, unique_id: true } } } },
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  // Buscar post anterior e próximo
  const [prev, next] = await Promise.all([
    prisma.blogPost.findFirst({
      where: {
        published: true,
        publishedAt: { lt: post.publishedAt ?? post.createdAt },
      },
      orderBy: { publishedAt: "desc" },
      select: { slug: true, title: true },
    }),
    prisma.blogPost.findFirst({
      where: {
        published: true,
        publishedAt: { gt: post.publishedAt ?? post.createdAt },
      },
      orderBy: { publishedAt: "asc" },
      select: { slug: true, title: true },
    }),
  ]);

  return NextResponse.json({
    post: {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      tags: post.tags ? JSON.parse(post.tags) : [],
      readTime: post.readTime,
      category: { name: post.category.name, slug: post.category.slug },
      author: post.author ? {
        username: post.author.nlogin.last_name,
        uuid: post.author.nlogin.unique_id,
      } : null,
      publishedAt: post.publishedAt,
      views: post.views,
    },
    related: related.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      excerpt: r.excerpt,
      coverImage: r.coverImage,
      tags: r.tags ? JSON.parse(r.tags) : [],
      readTime: r.readTime,
      category: { name: r.category.name, slug: r.category.slug },
      author: r.author ? {
        username: r.author.nlogin.last_name,
        uuid: r.author.nlogin.unique_id,
      } : null,
      publishedAt: r.publishedAt,
    })),
    navigation: { prev, next },
  });
}
