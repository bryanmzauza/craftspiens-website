// =============================================================================
// Dual Database: PostgreSQL (site) + MariaDB (nLogin/Minecraft)
// =============================================================================
import { PrismaClient as PrismaClientPg } from "@/generated/prisma-pg";
import { PrismaClient as PrismaClientMariaDb } from "@/generated/prisma-mariadb";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientPg | undefined;
  prismaMariaDb: PrismaClientMariaDb | undefined;
};

// --- PostgreSQL (dados do site) ---
function createPgClient() {
  const adapter = new PrismaPg(process.env.POSTGRES_URL!);
  return new PrismaClientPg({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPgClient();

// --- MariaDB (nLogin — autenticação Minecraft) ---
function createMariaDbClient() {
  const url = process.env.DATABASE_URL!.replace(/^mysql:\/\//, "mariadb://");
  const adapter = new PrismaMariaDb(url);
  return new PrismaClientMariaDb({ adapter });
}

export const prismaMariaDb = globalForPrisma.prismaMariaDb ?? createMariaDbClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaMariaDb = prismaMariaDb;
}
