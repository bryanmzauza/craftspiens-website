import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/client-ip";
import { TERMS_STATEMENTS, TERMS_VERSION, hasAcceptedCurrentTerms } from "@/lib/terms";

// GET /api/perfil/termos — versão vigente e se a conta já a aceitou
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { termsVersion: true, termsAcceptedAt: true },
  });
  return NextResponse.json({
    version: TERMS_VERSION,
    accepted: hasAcceptedCurrentTerms(user?.termsVersion),
    acceptedAt: user?.termsAcceptedAt ?? null,
  });
}

// POST /api/perfil/termos — registra o aceite da versão vigente
// Body: { termos: true, privacidade: true, idade: true }
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const missing = (Object.keys(TERMS_STATEMENTS) as (keyof typeof TERMS_STATEMENTS)[]).filter(
    (key) => (body as Record<string, unknown>)[key] !== true
  );
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "É preciso marcar todas as declarações para continuar.", missing },
      { status: 400 }
    );
  }

  const acceptedAt = new Date();
  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 255);
  const ip = getClientIp(request.headers).slice(0, 45);

  await prisma.$transaction([
    prisma.termsAcceptance.create({
      data: { userId: session.user.id, version: TERMS_VERSION, acceptedAt, ip, userAgent, source: "formulario" },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { termsVersion: TERMS_VERSION, termsAcceptedAt: acceptedAt },
    }),
  ]);

  return NextResponse.json({ success: true, version: TERMS_VERSION, acceptedAt });
}
