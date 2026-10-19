import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/client-ip";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import {
  PANEL_COOKIE,
  checkPanelCode,
  createPanelToken,
  getPanelSession,
  isPanelEnabled,
  logPanel,
  normalizePanelName,
  panelCookieOptions,
} from "@/lib/painel/session";

// GET /api/painel/acesso — sessão atual do painel (ou null)
export async function GET() {
  if (!isPanelEnabled()) return NextResponse.json({ enabled: false, session: null });
  const session = await getPanelSession();
  return NextResponse.json({ enabled: true, session });
}

// POST /api/painel/acesso — { codigo, nome }: abre o painel por 12 horas
export async function POST(request: Request) {
  if (!isPanelEnabled()) {
    return NextResponse.json({ error: "Painel desligado.", code: "PainelDesligado" }, { status: 503 });
  }

  const ip = getClientIp(request.headers);
  const rl = await checkRateLimit(`panel-unlock:${ip}`, RATE_LIMITS.panelUnlock);
  if (!rl.success) {
    return rateLimitResponse(rl, "Muitas tentativas. Aguarde alguns minutos.");
  }

  const body = await request.json().catch(() => ({}));
  const code = typeof body.codigo === "string" ? body.codigo : "";
  const name = normalizePanelName(body.nome);
  if (!name) {
    return NextResponse.json({ error: "Informe seu nome (2 a 30 letras ou números)." }, { status: 400 });
  }
  if (!code || code.length > 200 || !checkPanelCode(code)) {
    console.warn(`[painel] Código incorreto (ip ${ip})`);
    return NextResponse.json({ error: "Código incorreto." }, { status: 401 });
  }

  const { token, expiresAt } = createPanelToken(name);
  const session = { name, expiresAt };
  await logPanel(session, "acesso.entrar", null);
  const res = NextResponse.json({ session });
  res.cookies.set(PANEL_COOKIE, token, panelCookieOptions(expiresAt));
  return res;
}

// DELETE /api/painel/acesso — fecha o painel neste navegador
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PANEL_COOKIE, "", { ...panelCookieOptions(0), expires: new Date(0) });
  return res;
}
