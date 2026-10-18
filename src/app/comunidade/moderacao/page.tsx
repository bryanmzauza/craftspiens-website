import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canModerate } from "@/lib/forum/permissions";
import { ModeracaoContent } from "@/components/comunidade/ModeracaoContent";

export const metadata: Metadata = {
  title: "Moderação — CraftSapiens | Comunidade",
  description: "Denúncias pendentes e suspensões do fórum da comunidade CraftSapiens.",
};

// Só moderadores e admins; os demais recebem 404 para a página nem existir para eles
export default async function ModeracaoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?redirect=/comunidade/moderacao");
  if (!canModerate(session.user.role)) notFound();
  return <ModeracaoContent />;
}
