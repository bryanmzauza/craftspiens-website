import type { Metadata } from "next";
import { ComprasContent } from "@/components/perfil/ComprasContent";

export const metadata: Metadata = {
  title: "Minhas Compras — CraftSapiens",
  description: "Histórico de compras na loja CraftSapiens.",
  robots: "noindex, nofollow",
};

export default function ComprasPage() {
  return <ComprasContent />;
}
