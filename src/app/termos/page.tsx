import type { Metadata } from "next";
import { TermosContent } from "@/components/termos/TermosContent";

export const metadata: Metadata = {
  title: "Termos e Condições",
  description:
    "Leia os termos e condições e a política de privacidade da CraftSapiens. Regras do servidor, contribuições VIP, dados pessoais e seus direitos.",
};

export default function TermosPage() {
  return <TermosContent />;
}
