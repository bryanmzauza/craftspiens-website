import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNloginById } from "@/lib/nlogin";

// GET /api/perfil/vinculos — contas vinculadas do usuário logado
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { nloginId: true, linkedAccounts: { select: { provider: true, email: true } } },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const nlogin = await getNloginById(user.nloginId);
  const google = user.linkedAccounts.find((account) => account.provider === "google");
  const microsoft = user.linkedAccounts.find((account) => account.provider === "microsoft");

  return NextResponse.json({
    nick: nlogin
      ? {
          name: nlogin.last_name,
          hasPassword: !!nlogin.password,
          javaOriginal: !!nlogin.mojang_id,
          bedrock: !!nlogin.bedrock_id,
        }
      : null,
    google: google ? { email: google.email } : null,
    // Validação feita pela conta Microsoft no site (login ou vínculo)
    microsoft: microsoft ? { email: microsoft.email } : null,
    // Quais logins externos estão configurados neste ambiente
    providers: {
      google: !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
      microsoft: !!(process.env.AUTH_MICROSOFT_ID && process.env.AUTH_MICROSOFT_SECRET),
    },
  });
}
