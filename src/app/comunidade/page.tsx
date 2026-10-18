import type { Metadata } from "next";
import { Suspense } from "react";
import { ComunidadeContent } from "@/components/comunidade/ComunidadeContent";

export const metadata: Metadata = {
  title: "Comunidade — CraftSapiens | Fórum",
  description:
    "Participe da comunidade CraftSapiens. Discuta, tire dúvidas e compartilhe suas conquistas com outros alunos e professores do Minecraft educacional.",
};

// Suspense: a página lê a busca da URL (useSearchParams) no cliente
export default function ComunidadePage() {
  return (
    <Suspense>
      <ComunidadeContent />
    </Suspense>
  );
}
