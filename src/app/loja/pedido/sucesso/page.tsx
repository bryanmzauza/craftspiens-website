import type { Metadata } from "next";
import { PedidoResultContent } from "@/components/loja/PedidoResultContent";

export const metadata: Metadata = {
  title: "Pedido Confirmado",
  description: "Seu pedido foi processado com sucesso.",
  robots: { index: false, follow: false },
};

export default function PedidoSucessoPage() {
  return <PedidoResultContent status="success" />;
}
