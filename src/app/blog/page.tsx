import type { Metadata } from "next";
import { BlogContent } from "@/components/blog/BlogContent";

export const metadata: Metadata = {
  title: "Blog — CraftSapiens | Novidades e Atualizações",
  description:
    "Novidades, atualizações e conteúdo exclusivo do universo CraftSapiens. Fique por dentro de tudo sobre ensino gamificado no Minecraft.",
};

export default function BlogPage() {
  return <BlogContent />;
}
