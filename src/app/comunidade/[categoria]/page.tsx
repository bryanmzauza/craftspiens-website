import type { Metadata } from "next";
import { CategoriaContent } from "@/components/comunidade/CategoriaContent";

export const metadata: Metadata = {
  title: "Comunidade — CraftSapiens | Fórum",
  description:
    "Explore os tópicos da comunidade CraftSapiens. Discussões, dúvidas e interação entre alunos e professores.",
};

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ categoria: string }>;
}) {
  const { categoria } = await params;
  return <CategoriaContent categoriaSlug={categoria} />;
}
