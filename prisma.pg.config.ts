// Prisma config — PostgreSQL (dados do site)
// Uso: npx prisma generate --schema prisma/schema.pg.prisma
// Ou:  npx prisma db push --schema prisma/schema.pg.prisma
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.pg.prisma",
  migrations: {
    path: "prisma/migrations-pg",
  },
  datasource: {
    url: process.env["POSTGRES_URL"],
  },
});
