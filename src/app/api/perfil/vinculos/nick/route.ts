import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findNloginByUsername, verifyPassword } from "@/lib/nlogin";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,16}$/;

// POST /api/perfil/vinculos/nick — vincula um nick do Minecraft a uma conta sem
// nick (criada pelo Google), confirmando a senha usada no jogo. Contas originais
// (Java) não têm como provar a posse pela senha: elas são vinculadas pela Microsoft.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const rateCheck = await checkRateLimit(`link-nick:${session.user.id}`, RATE_LIMITS.passwordChange);
  if (!rateCheck.success) {
    return rateLimitResponse(rateCheck, "Muitas tentativas. Tente novamente mais tarde.");
  }

  const body = await request.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!USERNAME_REGEX.test(username) || !password || password.length > 128) {
    return NextResponse.json({ error: "Informe o nick e a senha usada no servidor." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, nloginId: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }
  if (user.nloginId != null) {
    return NextResponse.json({ error: "Sua conta já tem um nick vinculado." }, { status: 409 });
  }

  const nlogin = await findNloginByUsername(username);
  if (!nlogin) {
    return NextResponse.json(
      { error: "Nick não encontrado. Entre no servidor uma vez para criar sua conta do jogo." },
      { status: 404 }
    );
  }

  if (nlogin.mojang_id || !nlogin.password) {
    return NextResponse.json(
      {
        error: "Este nick é de uma conta original. Use o botão Vincular com Microsoft para confirmar que a conta é sua.",
        code: "ContaOriginal",
      },
      { status: 409 }
    );
  }

  if (!(await verifyPassword(password, nlogin.password))) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 403 });
  }

  const owner = await prisma.user.findUnique({ where: { nloginId: nlogin.id }, select: { id: true } });
  if (owner) {
    return NextResponse.json(
      {
        error:
          "Este nick já tem uma conta no site. Entre com o nick e a senha e vincule o Google em Contas vinculadas.",
      },
      { status: 409 }
    );
  }

  await prisma.user.update({ where: { id: user.id }, data: { nloginId: nlogin.id } });
  return NextResponse.json({ success: true, nick: nlogin.last_name });
}
