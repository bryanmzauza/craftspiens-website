import { Suspense } from "react";
import { Entregas } from "@/components/painel/Entregas";

export default function Page() {
  return (
    <Suspense>
      <Entregas />
    </Suspense>
  );
}
