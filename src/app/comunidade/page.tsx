import type { Metadata } from "next";
import { ComunidadeContent } from "@/components/comunidade/ComunidadeContent";

export const metadata: Metadata = {
  title: "Comunidade — CraftSapiens | Fórum",
  description:
    "Participe da comunidade CraftSapiens. Discuta, tire dúvidas e compartilhe suas conquistas com outros alunos e professores do Minecraft educacional.",
};

export default function ComunidadePage() {
  return <ComunidadeContent />;
}
