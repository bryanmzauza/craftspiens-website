import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NotificacoesContent } from "@/components/comunidade/NotificacoesContent";

export const metadata: Metadata = {
  title: "Notificações — CraftSapiens | Comunidade",
  description: "Respostas, curtidas e menções recebidas na comunidade CraftSapiens.",
};

export default async function NotificacoesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?redirect=/comunidade/notificacoes");
  return <NotificacoesContent />;
}
