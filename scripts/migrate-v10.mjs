/**
 * Migration v0.10 — Seed de cupons de exemplo
 *
 * A tabela `coupons` já existe no schema (criada via create-tables.mjs na v0.1).
 * Este script popula cupons de exemplo para teste e adiciona a coluna
 * payment_method na tabela orders (se ausente).
 *
 * Uso: node scripts/migrate-v10.mjs
 * Requer: DATABASE_URL no .env
 */
import "dotenv/config";
import * as mariadb from "mariadb";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ DATABASE_URL não configurada no .env");
  process.exit(1);
}

const url = new URL(dbUrl.replace(/^mysql:/, "mariadb:"));

const pool = mariadb.createPool({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  connectionLimit: 1,
});

async function migrate() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log("✅ Conectado ao banco de dados\n");

    // Ensure orders.payment_method column allows longer values for MercadoPago IDs
    console.log("📦 Verificando coluna payment_method em orders...");
    try {
      await conn.query(`
        ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT NULL
      `);
      console.log("   ✅ Coluna payment_method verificada\n");
    } catch (e) {
      console.log("   ⚠️ Coluna payment_method já existe ou erro:", e.message, "\n");
    }

    // Ensure orders.payment_id can hold MercadoPago preference IDs
    console.log("📦 Verificando coluna payment_id em orders...");
    try {
      await conn.query(`
        ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255) DEFAULT NULL
      `);
      console.log("   ✅ Coluna payment_id verificada\n");
    } catch (e) {
      console.log("   ⚠️ Coluna payment_id já existe ou erro:", e.message, "\n");
    }

    // Seed example coupons
    console.log("🏷️ Inserindo cupons de exemplo...");
    const coupons = [
      {
        id: "cpn_bemvindo10",
        code: "BEMVINDO10",
        discount: 10.00,
        max_uses: null,
        uses: 0,
        active: 1,
        expires_at: null,
      },
      {
        id: "cpn_sapiens20",
        code: "SAPIENS20",
        discount: 20.00,
        max_uses: 50,
        uses: 0,
        active: 1,
        expires_at: "2027-12-31 23:59:59",
      },
      {
        id: "cpn_prime5",
        code: "PRIME5",
        discount: 5.00,
        max_uses: 100,
        uses: 0,
        active: 1,
        expires_at: null,
      },
    ];

    for (const coupon of coupons) {
      await conn.query(`
        INSERT INTO coupons (id, code, discount, max_uses, uses, active, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          discount = VALUES(discount),
          max_uses = VALUES(max_uses),
          active = VALUES(active),
          expires_at = VALUES(expires_at)
      `, [
        coupon.id,
        coupon.code,
        coupon.discount,
        coupon.max_uses,
        coupon.uses,
        coupon.active,
        coupon.expires_at,
      ]);
      console.log(`   ✅ Cupom ${coupon.code} (${coupon.discount}%)`);
    }

    console.log("\n🎉 Migração v0.10 concluída com sucesso!");
  } catch (err) {
    console.error("❌ Erro na migração:", err.message);
    process.exit(1);
  } finally {
    if (conn) conn.release();
    await pool.end();
  }
}

migrate();
