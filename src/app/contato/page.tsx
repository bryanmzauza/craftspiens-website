import type { Metadata } from "next";
import { ContatoContent } from "@/components/contato/ContatoContent";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Entre em contato com a CraftSapiens. WhatsApp, email, Discord e formulário de contato. Respondemos em até 10 dias úteis. Porto Alegre, RS.",
};

export default function ContatoPage() {
  return <ContatoContent />;
}
