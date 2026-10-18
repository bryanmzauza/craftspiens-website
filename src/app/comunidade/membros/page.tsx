import type { Metadata } from "next";
import { Suspense } from "react";
import { MembrosContent } from "@/components/comunidade/MembrosContent";

export const metadata: Metadata = {
  title: "Membros — CraftSapiens | Comunidade",
  description: "Quem participa da comunidade CraftSapiens: busque pelo nick e veja os tópicos e comentários de cada membro.",
};

// Suspense: a página lê busca, ordem e página da URL (useSearchParams) no cliente
export default function MembrosPage() {
  return (
    <Suspense>
      <MembrosContent />
    </Suspense>
  );
}
