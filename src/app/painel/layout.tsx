import type { Metadata } from "next";
import { connection } from "next/server";
import { getPanelSession, isPanelEnabled } from "@/lib/painel/session";
import { PainelIndisponivel, PainelLogin } from "@/components/painel/PainelLogin";
import { PainelShell } from "@/components/painel/PainelShell";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

// Painel da equipe: sem o código de acesso (PAINEL_CODIGO), só a tela do código.
// As rotas /api/painel conferem a sessão de novo em cada chamada.
export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  // Sempre por requisição: nada do painel pode ser pré-renderizado no build
  await connection();
  if (!isPanelEnabled()) return <PainelIndisponivel />;
  const session = await getPanelSession();
  if (!session) return <PainelLogin />;
  return (
    <PainelShell name={session.name} expiresAt={session.expiresAt}>
      {children}
    </PainelShell>
  );
}
