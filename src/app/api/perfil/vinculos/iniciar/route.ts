import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setLinkIntent, type LinkProvider } from "@/lib/link-intent";

// POST /api/perfil/vinculos/iniciar — registra a intenção de vincular uma conta
// externa. Em seguida o cliente chama signIn(provider); no retorno, a conta
// externa é vinculada ao usuário logado em vez de iniciar outra sessão.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const provider = body.provider as LinkProvider;
  if (provider !== "google" && provider !== "microsoft") {
    return NextResponse.json({ error: "Provedor inválido." }, { status: 400 });
  }

  await setLinkIntent(session.user.id, provider);
  return NextResponse.json({ success: true });
}
