import type { Metadata } from "next";
import { PerfilContent } from "@/components/perfil/PerfilContent";

export const metadata: Metadata = {
  title: "Meu Perfil — CraftSapiens",
  description: "Painel do jogador CraftSapiens — métricas, progresso e configurações.",
  robots: "noindex, nofollow",
};

export default function PerfilPage() {
  return <PerfilContent />;
}
