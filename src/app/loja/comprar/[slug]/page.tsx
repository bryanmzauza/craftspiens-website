import type { Metadata } from "next";
import { ComprarContent } from "@/components/loja/ComprarContent";

export const metadata: Metadata = {
  title: "Comprar — Loja CraftSapiens",
  description: "Finalize sua compra com Pix ou cartão.",
  robots: { index: false, follow: false },
};

export default async function ComprarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ComprarContent slug={slug} />;
}
