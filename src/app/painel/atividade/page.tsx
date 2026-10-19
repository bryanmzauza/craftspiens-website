import { Suspense } from "react";
import { Atividade } from "@/components/painel/Atividade";

export default function Page() {
  return (
    <Suspense>
      <Atividade />
    </Suspense>
  );
}
