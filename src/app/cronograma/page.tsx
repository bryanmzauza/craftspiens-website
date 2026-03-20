import type { Metadata } from "next";
import { CronogramaContent } from "@/components/cronograma/CronogramaContent";

export const metadata: Metadata = {
  title: "Cronograma de Aulas — CraftSapiens | Grade Curricular",
  description:
    "Confira o cronograma completo de aulas gamificadas da CraftSapiens. Horários, disciplinas e professores. Organize seus estudos no Minecraft.",
};

export default function CronogramaPage() {
  return <CronogramaContent />;
}
