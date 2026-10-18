import { NextResponse } from "next/server";
import {
  findNloginByUsername,
  hashPassword,
  createNloginEntry,
  createUserWithProfile,
} from "@/lib/nlogin";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma-pg";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";
import { sendWelcomeEmail } from "@/lib/email";
import { isAtLeastMinAge, MIN_AGE, parseBirthDate } from "@/lib/birth-date";
import { TERMS_VERSION } from "@/lib/terms";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,16}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request.headers);
    const rateCheck = await checkRateLimit(`register:${ip}`, RATE_LIMITS.register);

    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck, "Muitas tentativas de registro. Tente novamente mais tarde.");
    }

    const body = await request.json().catch(() => ({}));
    const { username, password, birthdate } = body;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      typeof birthdate !== "string" ||
      !username ||
      !email ||
      !password ||
      !birthdate
    ) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios." },
        { status: 400 }
      );
    }

    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        { error: "Username deve ter 3-16 caracteres (letras, números e _)." },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Email inválido." },
        { status: 400 }
      );
    }

    if (
      password.length < 8 ||
      password.length > 128 ||
      !/[a-zA-Z]/.test(password) ||
      !/\d/.test(password)
    ) {
      return NextResponse.json(
        { error: "Senha deve ter mínimo 8 caracteres, com ao menos 1 letra e 1 número." },
        { status: 400 }
      );
    }

    const birth = parseBirthDate(birthdate);
    if (!birth) {
      return NextResponse.json({ error: "Data de nascimento inválida." }, { status: 400 });
    }
    if (!isAtLeastMinAge(birth)) {
      return NextResponse.json(
        { error: `Você precisa ter pelo menos ${MIN_AGE} anos para se registrar.` },
        { status: 400 }
      );
    }

    // Aceite dos Termos e da Política de Privacidade (registrado em terms_acceptances)
    if (body.terms !== true) {
      return NextResponse.json(
        { error: "Você precisa aceitar os Termos e Condições e a Política de Privacidade." },
        { status: 400 }
      );
    }

    // Nick já cadastrado no servidor (tabela nlogin): a conta do site é criada
    // sozinha no primeiro login com o nick e a senha do jogo. Não se cria outra
    // conta com o mesmo nick, nem em nome de quem já joga.
    const existingNlogin = await findNloginByUsername(username);
    if (existingNlogin) {
      return NextResponse.json(
        {
          error: "Este nick já existe no servidor. Se ele é seu, entre com o nick e a senha que você usa no jogo.",
          code: "NickDoJogo",
        },
        { status: 409 }
      );
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Este email já está cadastrado." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const nloginRecord = await createNloginEntry(username, passwordHash);
    const user = await createUserWithProfile(nloginRecord.id, email, birth);

    const acceptedAt = new Date();
    await prisma.$transaction([
      prisma.termsAcceptance.create({
        data: {
          userId: user.id,
          version: TERMS_VERSION,
          acceptedAt,
          ip: ip.slice(0, 45),
          userAgent: (request.headers.get("user-agent") ?? "").slice(0, 255),
          source: "cadastro",
        },
      }),
      prisma.user.update({ where: { id: user.id }, data: { termsVersion: TERMS_VERSION, termsAcceptedAt: acceptedAt } }),
    ]);

    // Email de boas-vindas (fire-and-forget)
    sendWelcomeEmail(email, username).catch((err) =>
      console.error("Erro ao enviar email de boas-vindas:", err)
    );

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          username: nloginRecord.last_name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Este email já está cadastrado." },
        { status: 409 }
      );
    }
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}
