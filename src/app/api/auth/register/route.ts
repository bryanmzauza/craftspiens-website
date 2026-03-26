import { NextResponse } from "next/server";
import {
  findNloginByUsername,
  hashPassword,
  createNloginEntry,
  createUserWithProfile,
} from "@/lib/nlogin";
import { prisma } from "@/lib/prisma";

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
    const body = await request.json();
    const { username, email, password, birthdate } = body;

    if (!username || !email || !password || !birthdate) {
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

    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
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
    const user = await createUserWithProfile(nloginRecord.id, email);

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
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}
