import type { Metadata } from "next";
import { LojaContent } from "@/components/loja/LojaContent";

export const metadata: Metadata = {
  title: "Loja — CraftSapiens | Planos VIP e Itens Exclusivos",
  description:
    "Adquira planos VIP, ranks exclusivos, cosméticos e moedas SAPIENS na loja da CraftSapiens. Turbine sua experiência no Minecraft educacional.",
};

export default function LojaPage() {
  return <LojaContent />;
}
