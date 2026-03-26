import type { Metadata } from "next";
import { CarrinhoContent } from "@/components/loja/CarrinhoContent";

export const metadata: Metadata = {
  title: "Carrinho — Loja CraftSapiens",
  description: "Revise os itens do seu carrinho e finalize sua compra na CraftSapiens.",
  robots: { index: false, follow: false },
};

export default function CarrinhoPage() {
  return <CarrinhoContent />;
}
