import type { Metadata } from "next";
import { TopicoContent } from "@/components/comunidade/TopicoContent";

export const metadata: Metadata = {
  title: "Tópico — CraftSapiens | Fórum",
  description:
    "Leia e participe das discussões da comunidade CraftSapiens.",
};

export default async function TopicoPage({
  params,
}: {
  params: Promise<{ categoria: string; topico: string }>;
}) {
  const { categoria, topico } = await params;
  return <TopicoContent categoriaSlug={categoria} topicoSlug={topico} />;
}
