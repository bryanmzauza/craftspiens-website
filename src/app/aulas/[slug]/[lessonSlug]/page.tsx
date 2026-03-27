import type { Metadata } from "next";
import { LessonContent } from "@/components/aulas/LessonContent";

interface LessonPageProps {
  params: Promise<{ slug: string; lessonSlug: string }>;
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { slug, lessonSlug } = await params;
  const disciplineTitle = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const lessonTitle = lessonSlug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `${lessonTitle} — ${disciplineTitle} | CraftSapiens`,
    description: `Aula de ${disciplineTitle}: ${lessonTitle}. Conteúdo, objetivos e material de estudo no CraftSapiens.`,
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug, lessonSlug } = await params;
  return <LessonContent disciplineSlug={slug} lessonSlug={lessonSlug} />;
}
