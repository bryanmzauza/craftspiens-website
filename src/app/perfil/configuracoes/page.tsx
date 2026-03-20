import type { Metadata } from "next";
import { ConfiguracoesContent } from "@/components/perfil/ConfiguracoesContent";

export const metadata: Metadata = {
  title: "Configurações — CraftSapiens",
  description: "Configurações da conta CraftSapiens.",
  robots: "noindex, nofollow",
};

export default function ConfiguracoesPage() {
  return <ConfiguracoesContent />;
}
