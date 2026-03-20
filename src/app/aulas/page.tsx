import type { Metadata } from "next";
import { AulasContent } from "@/components/aulas/AulasContent";

export const metadata: Metadata = {
  title: "Aulas",
  description:
    "Explore o catálogo de aulas gamificadas da CraftSapiens. Matemática, Ciências, História e mais — tudo dentro do Minecraft.",
};

export default function AulasPage() {
  return <AulasContent />;
}
