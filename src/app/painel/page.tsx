import { Suspense } from "react";
import { VisaoGeral } from "@/components/painel/VisaoGeral";

export default function Page() {
  return (
    <Suspense>
      <VisaoGeral />
    </Suspense>
  );
}
