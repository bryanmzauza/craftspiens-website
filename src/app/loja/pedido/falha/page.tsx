import type { Metadata } from "next";
import { PedidoResultContent } from "@/components/loja/PedidoResultContent";

export const metadata: Metadata = {
  title: "Pagamento Não Aprovado",
  description: "Houve um problema com seu pagamento.",
  robots: { index: false, follow: false },
};

export default function PedidoFalhaPage() {
  return <PedidoResultContent status="failure" />;
}
