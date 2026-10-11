import type { Metadata } from "next";
import { LojaContent } from "@/components/loja/LojaContent";

export const metadata: Metadata = {
  title: "Loja — CraftSapiens | VIP, Premium, Sapiens e Cosméticos",
  description:
    "Planos VIP e Premium, pacotes de Sapiens e cosméticos para Java e Bedrock. Pague com Pix e receba automaticamente em todos os servidores da CraftSapiens.",
};

export default function LojaPage() {
  return <LojaContent />;
}
