/**
 * Migration v0.9 — Disciplinas, Aulas, Carrinho + campos adicionais de Product
 *
 * Uso: node scripts/migrate-v09.mjs
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
  console.log("🔧 Migration v0.9 — Disciplines, Lessons, Cart + Product enhancements\n");

  // 1. Criar tabela website_disciplines
  console.log("1/4 — Criando tabela website_disciplines...");
  await conn.query(`
    CREATE TABLE IF NOT EXISTS website_disciplines (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) NOT NULL UNIQUE,
      description TEXT NOT NULL,
      short_description VARCHAR(255) NOT NULL,
      icon VARCHAR(50) NOT NULL,
      color VARCHAR(20) NOT NULL,
      banner VARCHAR(500) DEFAULT NULL,
      levels VARCHAR(100) NOT NULL,
      \`order\` INT NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("   ✅ website_disciplines OK");

  // 2. Criar tabela website_lessons
  console.log("2/4 — Criando tabela website_lessons...");
  await conn.query(`
    CREATE TABLE IF NOT EXISTS website_lessons (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      discipline_id VARCHAR(30) NOT NULL,
      title VARCHAR(200) NOT NULL,
      slug VARCHAR(200) NOT NULL UNIQUE,
      description TEXT NOT NULL,
      \`order\` INT NOT NULL DEFAULT 0,
      duration_minutes INT DEFAULT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      CONSTRAINT fk_lesson_discipline FOREIGN KEY (discipline_id) REFERENCES website_disciplines(id) ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("   ✅ website_lessons OK");

  // 3. Criar tabela website_cart_items
  console.log("3/4 — Criando tabela website_cart_items...");
  await conn.query(`
    CREATE TABLE IF NOT EXISTS website_cart_items (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      user_id VARCHAR(30) NOT NULL,
      product_id VARCHAR(30) NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      UNIQUE KEY uq_cart_user_product (user_id, product_id),
      CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("   ✅ website_cart_items OK");

  // 4. Adicionar campos faltantes na tabela products
  console.log("4/4 — Adicionando campos ao products...");
  await conn.query(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS short_description VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS duration_days INT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS benefits TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS server_command VARCHAR(500) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS stock INT NOT NULL DEFAULT -1,
    ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS badge VARCHAR(50) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS \`order\` INT NOT NULL DEFAULT 0;
  `);
  console.log("   ✅ products enhanced OK");

  console.log("\n✅ Migration v0.9 concluída com sucesso!");
} catch (error) {
  console.error("❌ Erro na migration:", error.message);
  process.exit(1);
} finally {
  await conn.release();
  await pool.end();
}
