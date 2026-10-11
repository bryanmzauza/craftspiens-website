import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfirmarEmailContent } from "@/components/auth/ConfirmarEmailContent";

export const metadata: Metadata = {
  title: "Confirme seu e-mail",
  description: "Confirme o e-mail da sua conta CraftSapiens.",
  robots: "noindex, nofollow",
};

export default function ConfirmarEmailPage() {
  return (
    <Suspense>
      <ConfirmarEmailContent />
    </Suspense>
  );
}
