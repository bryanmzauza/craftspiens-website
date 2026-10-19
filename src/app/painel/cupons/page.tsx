import { Suspense } from "react";
import { Cupons } from "@/components/painel/Cupons";

export default function Page() {
  return (
    <Suspense>
      <Cupons />
    </Suspense>
  );
}
