/**
 * Migration v0.8 — Tabela password_reset_tokens + alterações na newsletter
 *
 * Uso: node scripts/migrate-v08.mjs
 * Requer: DATABASE_URL no .env
 *
 * Idempotente: usa CREATE TABLE IF NOT EXISTS e ADD COLUMN IF NOT EXISTS
 */
import "dotenv/config";
import { createPool } from "mariadb";

const url = process.env.DATABASE_URL?.replace(/^mysql:\/\//, "mariadb://");
if (!url) {
  console.error("DATABASE_URL not set in .env");
  process.exit(1);
}

const pool = createPool({
  uri: url,
  connectTimeout: 10000,
  multipleStatements: true,
});

const conn = await pool.getConnection();

try {
  console.log("🔧 Migration v0.8 — Password Reset Tokens + Newsletter updates\n");

  // 1. Criar tabela password_reset_tokens
  console.log("1/3 — Criando tabela password_reset_tokens...");
  await conn.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      user_id VARCHAR(30) NOT NULL,
      token_hash VARCHAR(255) NOT NULL UNIQUE,
      expires_at DATETIME(3) NOT NULL,
      used_at DATETIME(3),
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("   ✅ password_reset_tokens OK");

  // 2. Adicionar coluna unsubscribed_at à newsletter
  console.log("2/3 — Adicionando coluna unsubscribed_at à newsletter...");
  await conn.query(`
    ALTER TABLE newsletter
    ADD COLUMN IF NOT EXISTS unsubscribed_at DATETIME(3) DEFAULT NULL;
  `);
  console.log("   ✅ newsletter.unsubscribed_at OK");

  // 3. Adicionar colunas faltantes ao users (birth_date, deactivated_at)
  console.log("3/3 — Verificando colunas do users...");
  await conn.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS birth_date DATE DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS deactivated_at DATETIME(3) DEFAULT NULL;
  `);
  console.log("   ✅ users birth_date/deactivated_at OK");

  console.log("\n✅ Migration v0.8 concluída com sucesso!");
} catch (error) {
  console.error("❌ Erro na migration:", error.message);
  process.exit(1);
} finally {
  await conn.release();
  await pool.end();
}
