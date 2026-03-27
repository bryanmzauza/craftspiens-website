import type { Metadata } from "next";
import { PedidoResultContent } from "@/components/loja/PedidoResultContent";

export const metadata: Metadata = {
  title: "Pagamento Pendente",
  description: "Seu pagamento está sendo processado.",
  robots: { index: false, follow: false },
};

export default function PedidoPendentePage() {
  return <PedidoResultContent status="pending" />;
}
