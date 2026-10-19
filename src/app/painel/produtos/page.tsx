import { Suspense } from "react";
import { Produtos } from "@/components/painel/Produtos";

export default function Page() {
  return (
    <Suspense>
      <Produtos />
    </Suspense>
  );
}
