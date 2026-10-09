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

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,16}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isAtLeast13(dateStr: string): boolean {
  const birth = new Date(dateStr);
  if (isNaN(birth.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 13;
}

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

    if (!isAtLeast13(birthdate)) {
      return NextResponse.json(
        { error: "Você precisa ter pelo menos 13 anos para se registrar." },
        { status: 400 }
      );
    }

    const existingNlogin = await findNloginByUsername(username);
    if (existingNlogin) {
      return NextResponse.json(
        { error: "Este username já está em uso." },
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
    const user = await createUserWithProfile(
      nloginRecord.id,
      email,
      new Date(birthdate)
    );

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
