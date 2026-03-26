import type { Metadata } from "next";
import { Suspense } from "react";
import { RedefinirSenhaContent } from "@/components/auth/RedefinirSenhaContent";

export const metadata: Metadata = {
  title: "Redefinir Senha — CraftSapiens",
  description: "Crie uma nova senha para sua conta CraftSapiens.",
  robots: { index: false, follow: false },
};

export default function RedefinirSenhaPage() {
  return (
    <Suspense>
      <RedefinirSenhaContent />
    </Suspense>
  );
}
