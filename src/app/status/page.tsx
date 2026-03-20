import type { Metadata } from "next";
import { StatusContent } from "@/components/status/StatusContent";

export const metadata: Metadata = {
  title: "Status do Servidor",
  description:
    "Verifique o status do servidor Minecraft da CraftSapiens em tempo real. Jogadores online, versão e rankings.",
};

export default function StatusPage() {
  return <StatusContent />;
}
