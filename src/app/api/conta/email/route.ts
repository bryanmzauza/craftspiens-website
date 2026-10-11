import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNloginById } from "@/lib/nlogin";
import { isPlaceholderEmail } from "@/lib/email-verification";

// GET /api/conta/email — situação do e-mail da conta logada
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, emailVerifiedAt: true, nloginId: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const nlogin = await getNloginById(user.nloginId);
  const placeholder = isPlaceholderEmail(user.email);

  return NextResponse.json({
    email: placeholder ? null : user.email,
    verified: !!user.emailVerifiedAt && !placeholder,
    // Trocar um e-mail já verificado exige a senha do jogo, quando a conta tem uma
    requiresPassword: !!user.emailVerifiedAt && !placeholder && !!nlogin?.password,
  });
}
