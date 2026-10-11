import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGameAccount, PLATFORM_LABELS } from "@/lib/game-account";

// GET /api/loja/conta-jogo — conta do jogo que vai receber a entrega: se existe
// no nLogin e se é Java ou Bedrock. A página de compra mostra isso antes de pagar.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (session.user.nloginId == null) {
    return NextResponse.json({ linked: false, exists: false, account: null });
  }

  const account = await getGameAccount(session.user.nloginId);
  if (!account) {
    return NextResponse.json({ linked: true, exists: false, account: null });
  }

  return NextResponse.json({
    linked: true,
    exists: true,
    account: {
      username: account.username,
      platform: account.platform,
      platformLabel: PLATFORM_LABELS[account.platform],
    },
  });
}
