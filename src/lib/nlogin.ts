import { prisma, prismaMariaDb } from "@/lib/prisma";
import {
  nloginHashPassword,
  nloginVerifyPassword,
} from "@/lib/nlogin-algorithms";

// --- Helpers para consultas cross-database ---

// Contas criadas pelo Google podem ainda não ter nick vinculado (nloginId nulo):
// todas as funções abaixo aceitam esse caso.

/** Busca dados nLogin por ID (MariaDB) */
export async function getNloginById(id: number | null) {
  if (id == null) return null;
  return prismaMariaDb.nlogin.findFirst({ where: { id } });
}

/** Busca múltiplos nLogins por IDs — para batch enrichment */
export async function getNloginsByIds(ids: (number | null)[]) {
  const valid = [...new Set(ids.filter((id): id is number => id != null))];
  if (valid.length === 0) return [];
  return prismaMariaDb.nlogin.findMany({ where: { id: { in: valid } } });
}

/** Mapa nloginId → registro do nLogin, para resolver vários autores de uma vez */
export async function getNloginMap(ids: Iterable<number | null>) {
  const nlogins = await getNloginsByIds([...ids]);
  const map = new Map(nlogins.map((n) => [n.id, n]));
  return {
    get: (id: number | null | undefined) => (id == null ? undefined : map.get(id)),
  };
}

/** Enriquece um user (ou array) com dados nLogin do MariaDB */
export async function enrichUsersWithNlogin<T extends { nloginId: number | null }>(
  users: T[]
): Promise<(T & { nlogin: { last_name: string; unique_id: string | null } })[]> {
  const nloginMap = await getNloginMap(users.map((u) => u.nloginId));
  return users.map((u) => ({
    ...u,
    nlogin: nloginMap.get(u.nloginId) ?? { last_name: "Unknown", unique_id: null },
  }));
}

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
  return prismaMariaDb.nlogin.findFirst({
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
  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });
  if (!user) return null;

  // Buscar nlogin separadamente (cross-database); nulo se a conta não tem nick
  const nlogin = await getNloginById(user.nloginId);

  return { ...user, nlogin };
}

export async function createNloginEntry(
  username: string,
  passwordHash: string
) {
  return prismaMariaDb.nlogin.create({
    data: {
      last_name: username,
      password: passwordHash,
    },
  });
}

export async function createUserWithProfile(
  nloginId: number,
  email: string,
  birthDate?: Date
) {
  return prisma.user.create({
    data: {
      nloginId,
      email,
      role: "ALUNO",
      birthDate: birthDate ?? null,
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
  return prismaMariaDb.nlogin.update({
    where: { id: nloginId },
    data: { password: newPasswordHash },
  });
}

export async function updateNloginLastLogin(nloginId: number) {
  return prismaMariaDb.nlogin.update({
    where: { id: nloginId },
    data: { last_seen: new Date() },
  });
}
