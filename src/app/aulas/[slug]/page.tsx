import type { Metadata } from "next";
import { DisciplinaContent } from "@/components/aulas/DisciplinaContent";

interface DisciplinaPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: DisciplinaPageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `${title} — Aulas CraftSapiens`,
    description: `Conheça as aulas de ${title} da CraftSapiens. Conteúdo programático, professores e como participar.`,
  };
}

export default async function DisciplinaPage({ params }: DisciplinaPageProps) {
  const { slug } = await params;
  return <DisciplinaContent slug={slug} />;
}
