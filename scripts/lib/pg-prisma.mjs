// Cliente Prisma do PostgreSQL (dados do site) para uso nos scripts .mjs.
//
// O client gerado em src/generated/prisma-pg é CommonJS, por isso é carregado
// com createRequire. Requer POSTGRES_URL no .env e `npm run db:generate` executado.

import "dotenv/config";
import { createRequire } from "node:module";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  console.error("Erro: POSTGRES_URL não definida no .env — configure a conexão com o PostgreSQL antes de rodar este script.");
  process.exit(1);
}

const require = createRequire(import.meta.url);

let generated;
try {
  generated = require("../../src/generated/prisma-pg/index.js");
} catch (error) {
  console.error("Erro: Client Prisma do PostgreSQL não encontrado. Rode `npm run db:generate` primeiro.");
  console.error(error);
  process.exit(1);
}

const { PrismaClient, Prisma } = generated;

export { Prisma };

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

/** Encerra a conexão com o PostgreSQL (chamar sempre ao final do script). */
export async function disconnect() {
  await prisma.$disconnect();
}
