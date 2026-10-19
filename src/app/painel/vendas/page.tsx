import { Suspense } from "react";
import { Vendas } from "@/components/painel/Vendas";

export default function Page() {
  return (
    <Suspense>
      <Vendas />
    </Suspense>
  );
}
