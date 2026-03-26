import { prisma } from "@/lib/prisma";
import {
  nloginHashPassword,
  nloginVerifyPassword,
} from "@/lib/nlogin-algorithms";

export async function hashPassword(password: string): Promise<string> {
  return nloginHashPassword(password);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return nloginVerifyPassword(password, hash);
}

export async function findNloginByUsername(username: string) {
  return prisma.nlogin.findFirst({
    where: { last_name: username },
  });
}

export async function findUserByNloginId(nloginId: number) {
  return prisma.user.findUnique({
    where: { nloginId },
    include: { profile: true },
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: { nlogin: true, profile: true },
  });
}

export async function createNloginEntry(
  username: string,
  passwordHash: string
) {
  return prisma.nlogin.create({
    data: {
      last_name: username,
      password: passwordHash,
    },
  });
}

export async function createUserWithProfile(
  nloginId: number,
  email: string
) {
  return prisma.user.create({
    data: {
      nloginId,
      email,
      role: "ALUNO",
      profile: {
        create: {
          sapiensCoins: 0,
          xp: 0,
        },
      },
    },
    include: { profile: true },
  });
}

export async function updateNloginPassword(
  nloginId: number,
  newPasswordHash: string
) {
  return prisma.nlogin.update({
    where: { id: nloginId },
    data: { password: newPasswordHash },
  });
}

export async function updateNloginLastLogin(nloginId: number) {
  return prisma.nlogin.update({
    where: { id: nloginId },
    data: { last_seen: new Date() },
  });
}
