import type { Metadata } from "next";
import { PedidoContent } from "@/components/loja/PedidoContent";

export const metadata: Metadata = {
  title: "Pedido — Loja CraftSapiens",
  description: "Acompanhe o pagamento e a entrega do seu pedido.",
  robots: { index: false, follow: false },
};

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PedidoContent orderId={id} />;
}
