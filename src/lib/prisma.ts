// =============================================================================
// Dual Database: PostgreSQL (site) + MariaDB (nLogin/Minecraft)
// =============================================================================
// Os clientes são criados na primeira utilização, para que importar este módulo
// (por exemplo durante o `next build`) não exija as variáveis de ambiente.
import { PrismaClient as PrismaClientPg } from "@/generated/prisma-pg";
import { PrismaClient as PrismaClientMariaDb } from "@/generated/prisma-mariadb";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { getEnv } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientPg | undefined;
  prismaMariaDb: PrismaClientMariaDb | undefined;
};

// --- PostgreSQL (dados do site) ---
function getPgClient(): PrismaClientPg {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg({ connectionString: getEnv().POSTGRES_URL });
    globalForPrisma.prisma = new PrismaClientPg({ adapter });
  }
  return globalForPrisma.prisma;
}

// --- MariaDB (nLogin — autenticação Minecraft) ---
function getMariaDbClient(): PrismaClientMariaDb {
  if (!globalForPrisma.prismaMariaDb) {
    // O CLI do Prisma exige mysql://, mas o adapter MariaDB exige mariadb://
    const url = getEnv().DATABASE_URL.replace(/^mysql:\/\//, "mariadb://");
    globalForPrisma.prismaMariaDb = new PrismaClientMariaDb({ adapter: new PrismaMariaDb(url) });
  }
  return globalForPrisma.prismaMariaDb;
}

function lazy<T extends object>(factory: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      const client = factory();
      const value = Reflect.get(client, prop);
      return typeof value === "function" ? value.bind(client) : value;
    },
  });
}

export const prisma = lazy(getPgClient);
export const prismaMariaDb = lazy(getMariaDbClient);
