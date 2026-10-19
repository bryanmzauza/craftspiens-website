import { Suspense } from "react";
import { CronogramaPainel } from "@/components/painel/CronogramaPainel";

export default function Page() {
  return (
    <Suspense>
      <CronogramaPainel />
    </Suspense>
  );
}
