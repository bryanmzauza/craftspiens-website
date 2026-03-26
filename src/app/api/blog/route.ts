import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 9)));
  const categoria = searchParams.get("categoria");
  const busca = searchParams.get("busca");

  const where: Record<string, unknown> = { published: true };

  if (categoria) {
    where.category = { slug: categoria };
  }

  if (busca) {
    where.OR = [
      { title: { contains: busca } },
      { excerpt: { contains: busca } },
    ];
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: { category: true, author: { select: { id: true, nlogin: { select: { last_name: true, unique_id: true } } } } },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return NextResponse.json({
    posts: posts.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      coverImage: p.coverImage,
      tags: p.tags ? JSON.parse(p.tags) : [],
      readTime: p.readTime,
      category: { name: p.category.name, slug: p.category.slug },
      author: p.author ? {
        username: p.author.nlogin.last_name,
        uuid: p.author.nlogin.unique_id,
      } : null,
      publishedAt: p.publishedAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
