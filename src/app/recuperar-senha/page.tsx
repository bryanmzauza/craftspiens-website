import type { Metadata } from "next";
import { RecuperarSenhaContent } from "@/components/auth/RecuperarSenhaContent";

export const metadata: Metadata = {
  title: "Recuperar Senha — CraftSapiens",
  description:
    "Recupere o acesso à sua conta CraftSapiens. Informe seu email e enviaremos instruções para redefinir sua senha.",
};

export default function RecuperarSenhaPage() {
  return <RecuperarSenhaContent />;
}
