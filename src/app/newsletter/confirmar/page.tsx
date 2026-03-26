import type { Metadata } from "next";
import { Suspense } from "react";
import { NewsletterConfirmarContent } from "@/components/newsletter/NewsletterConfirmarContent";

export const metadata: Metadata = {
  title: "Confirmar Inscrição — Newsletter CraftSapiens",
  description: "Confirme sua inscrição na newsletter da CraftSapiens.",
  robots: { index: false, follow: false },
};

export default function NewsletterConfirmarPage() {
  return (
    <Suspense>
      <NewsletterConfirmarContent />
    </Suspense>
  );
}
