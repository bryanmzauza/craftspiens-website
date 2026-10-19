import type { Metadata } from "next";
import { MembroContent } from "@/components/comunidade/MembroContent";

export async function generateMetadata({ params }: { params: Promise<{ nick: string }> }): Promise<Metadata> {
  const { nick } = await params;
  const safe = /^[A-Za-z0-9_]{3,16}$/.test(nick) ? nick : "Membro";
  return {
    title: `${safe} — CraftSapiens | Comunidade`,
    description: `Posts, comentários e reputação de ${safe} na comunidade CraftSapiens.`,
  };
}

export default async function MembroPage({ params }: { params: Promise<{ nick: string }> }) {
  const { nick } = await params;
  return <MembroContent nick={nick} />;
}
