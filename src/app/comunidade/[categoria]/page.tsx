import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { CategoriaContent } from "@/components/comunidade/CategoriaContent";

export async function generateMetadata({ params }: { params: Promise<{ categoria: string }> }): Promise<Metadata> {
  const { categoria } = await params;
  const category = await prisma.forumCategory
    .findUnique({ where: { slug: categoria }, select: { name: true, description: true } })
    .catch(() => null);
  if (!category) {
    return { title: "Comunidade — CraftSapiens | Fórum" };
  }
  return {
    title: `${category.name} — CraftSapiens | Comunidade`,
    description: category.description ?? `Tópicos de ${category.name} na comunidade CraftSapiens.`,
  };
}

export default async function CategoriaPage({ params }: { params: Promise<{ categoria: string }> }) {
  const { categoria } = await params;
  return (
    <Suspense>
      <CategoriaContent categoriaSlug={categoria} />
    </Suspense>
  );
}
