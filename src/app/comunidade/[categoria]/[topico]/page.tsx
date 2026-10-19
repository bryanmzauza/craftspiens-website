import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { markdownToText } from "@/lib/forum/markdown";
import { TopicoContent } from "@/components/comunidade/TopicoContent";

// Título e descrição do tópico para busca e compartilhamento. Tópicos privados
// ficam com o texto genérico: a API decide quem pode ver o conteúdo.
export async function generateMetadata({ params }: { params: Promise<{ topico: string }> }): Promise<Metadata> {
  const { topico } = await params;
  const post = await prisma.post
    .findUnique({ where: { slug: topico }, select: { title: true, content: true, private: true } })
    .catch(() => null);
  if (!post || post.private) {
    return { title: "Post — CraftSapiens | Comunidade", description: "Leia e participe das discussões da comunidade CraftSapiens." };
  }
  return {
    title: `${post.title} — CraftSapiens | Comunidade`,
    description: markdownToText(post.content, 160),
  };
}

export default async function TopicoPage({ params }: { params: Promise<{ categoria: string; topico: string }> }) {
  const { categoria, topico } = await params;
  return <TopicoContent categoriaSlug={categoria} topicoSlug={topico} />;
}
