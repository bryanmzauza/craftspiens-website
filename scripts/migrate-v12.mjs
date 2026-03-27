/**
 * Migration v0.12 — Conteúdo de aulas e tracking de progresso
 *
 * Uso: node scripts/migrate-v12.mjs
 * Requer: DATABASE_URL no .env
 *
 * Idempotente: usa ADD COLUMN IF NOT EXISTS e CREATE TABLE IF NOT EXISTS
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
  console.log("🔧 Migration v0.12 — Conteúdo de aulas e tracking de progresso\n");

  // 1. Adicionar campos de conteúdo ao website_lessons
  console.log("1/2 — Adicionando campos de conteúdo ao website_lessons...");
  await conn.query(`
    ALTER TABLE website_lessons
    ADD COLUMN IF NOT EXISTS content LONGTEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS video_url VARCHAR(500) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS objectives TEXT DEFAULT NULL;
  `);
  console.log("   ✅ website_lessons content fields OK");

  // 2. Criar tabela website_user_lesson_progress
  console.log("2/2 — Criando tabela website_user_lesson_progress...");
  await conn.query(`
    CREATE TABLE IF NOT EXISTS website_user_lesson_progress (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      user_id VARCHAR(30) NOT NULL,
      lesson_id VARCHAR(30) NOT NULL,
      completed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      UNIQUE KEY uq_user_lesson (user_id, lesson_id),
      CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_progress_lesson FOREIGN KEY (lesson_id) REFERENCES website_lessons(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("   ✅ website_user_lesson_progress OK");

  console.log("\n✅ Migration v0.12 concluída com sucesso!");
} catch (error) {
  console.error("❌ Erro na migration:", error.message);
  process.exit(1);
} finally {
  await conn.release();
  await pool.end();
}
