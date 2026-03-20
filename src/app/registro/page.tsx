import type { Metadata } from "next";
import { RegistroContent } from "@/components/auth/RegistroContent";

export const metadata: Metadata = {
  title: "Criar Conta",
  description:
    "Crie sua conta grátis na CraftSapiens e comece a aprender jogando Minecraft. Mesma conta para o site e servidor.",
};

export default function RegistroPage() {
  return <RegistroContent />;
}
