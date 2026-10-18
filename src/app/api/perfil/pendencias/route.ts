import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAccountStatus, pendingRequirements } from "@/lib/account-requirements";
import { TERMS_VERSION } from "@/lib/terms";

// GET /api/perfil/pendencias — o que falta na conta para usar o fórum e a loja
// (aviso no topo do site depois do login)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const status = await getAccountStatus(session.user.id);
  if (!status) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  return NextResponse.json(
    {
      requirements: status,
      pending: pendingRequirements(status),
      terms: { accepted: status.termosAceitos, version: TERMS_VERSION },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
