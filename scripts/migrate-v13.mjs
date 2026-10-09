/**
 * Migration v0.13 — Migrar dados do MariaDB para PostgreSQL
 *
 * Esta migração copia todos os dados do site (exceto nLogin) do MariaDB
 * para o novo PostgreSQL. O nLogin permanece no MariaDB.
 *
 * Pré-requisitos:
 *   1. PostgreSQL rodando (docker compose up -d)
 *   2. Gerar schemas: npx prisma generate && npx prisma generate --schema prisma/schema.pg.prisma
 *   3. Criar tabelas PG: npx prisma db push --schema prisma/schema.pg.prisma
 *   4. DATABASE_URL e POSTGRES_URL configurados no .env
 *
 * Uso: node scripts/migrate-v13.mjs
 */
import "dotenv/config";
import * as mariadb from "mariadb";
import pg from "pg";

// ── Validar variáveis de ambiente ──────────────────────────────────────
const mariaDbUrl = process.env.DATABASE_URL;
const postgresUrl = process.env.POSTGRES_URL;

if (!mariaDbUrl) {
  console.error("❌ DATABASE_URL não configurada no .env");
  process.exit(1);
}
if (!postgresUrl) {
  console.error("❌ POSTGRES_URL não configurada no .env");
  process.exit(1);
}

// ── Conexão MariaDB ────────────────────────────────────────────────────
const mdbUrl = new URL(mariaDbUrl.replace(/^mysql:/, "mariadb:"));
const mdbPool = mariadb.createPool({
  host: mdbUrl.hostname,
  port: Number(mdbUrl.port) || 3306,
  user: mdbUrl.username,
  password: mdbUrl.password,
  database: mdbUrl.pathname.slice(1),
  connectionLimit: 1,
});

// ── Conexão PostgreSQL ─────────────────────────────────────────────────
const pgPool = new pg.Pool({ connectionString: postgresUrl, max: 1 });

// ── Helpers ────────────────────────────────────────────────────────────
function toIso(d) {
  if (!d) return null;
  return new Date(d).toISOString();
}

function toBool(v) {
  return v === 1 || v === true;
}

async function migrateTable(mdb, pgClient, { mariaTable, pgTable, columns, transform }) {
  console.log(`\n📦 Migrando ${mariaTable} → ${pgTable}...`);
  const rows = await mdb.query(`SELECT * FROM ${mariaTable}`);
  if (!rows.length) {
    console.log(`   ⚠️ Tabela ${mariaTable} vazia, pulando.`);
    return 0;
  }

  let count = 0;
  for (const row of rows) {
    const data = transform ? transform(row) : row;
    const cols = columns || Object.keys(data);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
    const values = cols.map((c) => data[c]);

    try {
      await pgClient.query(
        `INSERT INTO "${pgTable}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        values
      );
      count++;
    } catch (err) {
      console.error(`   ❌ Erro ao inserir em ${pgTable}:`, err.message);
    }
  }
  console.log(`   ✅ ${count}/${rows.length} registros migrados`);
  return count;
}

// ── Migração Principal ─────────────────────────────────────────────────
async function migrate() {
  let mdb;
  let pgClient;

  try {
    mdb = await mdbPool.getConnection();
    pgClient = await pgPool.connect();
    console.log("✅ Conectado ao MariaDB e PostgreSQL\n");
    console.log("═".repeat(60));
    console.log("  MIGRAÇÃO v0.13 — MariaDB → PostgreSQL");
    console.log("═".repeat(60));

    // 1. Users
    await migrateTable(mdb, pgClient, {
      mariaTable: "website_users",
      pgTable: "users",
      columns: ["id", "nloginId", "email", "role", "birthDate", "createdAt", "updatedAt", "deactivatedAt"],
      transform: (r) => ({
        id: r.id,
        nloginId: r.nlogin_id,
        email: r.email,
        role: r.role,
        birthDate: toIso(r.birth_date),
        createdAt: toIso(r.created_at),
        updatedAt: toIso(r.updated_at),
        deactivatedAt: toIso(r.deactivated_at),
      }),
    });

    // 2. Profiles
    await migrateTable(mdb, pgClient, {
      mariaTable: "website_profiles",
      pgTable: "profiles",
      columns: [
        "id", "userId", "bio", "avatar", "sapiensCoins", "xp",
        "playtimeMinutes", "aulasConcluidas", "rankingPosition",
        "perfilPublico", "mostrarTempoOnline", "mostrarAtividade",
        "notifForumRespostas", "notifLembretesAulas", "notifNovidades",
        "notifResumoSemanal", "createdAt", "updatedAt",
      ],
      transform: (r) => ({
        id: r.id,
        userId: r.user_id,
        bio: r.bio,
        avatar: r.avatar,
        sapiensCoins: r.sapiens_coins,
        xp: r.xp,
        playtimeMinutes: r.playtime_minutes,
        aulasConcluidas: r.aulas_concluidas,
        rankingPosition: r.ranking_position,
        perfilPublico: toBool(r.perfil_publico),
        mostrarTempoOnline: toBool(r.mostrar_tempo_online),
        mostrarAtividade: toBool(r.mostrar_atividade),
        notifForumRespostas: toBool(r.notif_forum_respostas),
        notifLembretesAulas: toBool(r.notif_lembretes_aulas),
        notifNovidades: toBool(r.notif_novidades),
        notifResumoSemanal: toBool(r.notif_resumo_semanal),
        createdAt: toIso(r.created_at),
        updatedAt: toIso(r.updated_at),
      }),
    });

    // 3. Products
    await migrateTable(mdb, pgClient, {
      mariaTable: "website_products",
      pgTable: "products",
      columns: [
        "id", "name", "slug", "description", "price", "originalPrice",
        "image", "category", "stock", "featured", "active", "createdAt", "updatedAt",
      ],
      transform: (r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        price: r.price,
        originalPrice: r.original_price,
        image: r.image,
        category: r.category,
        stock: r.stock,
        featured: toBool(r.featured),
        active: toBool(r.active),
        createdAt: toIso(r.created_at),
        updatedAt: toIso(r.updated_at),
      }),
    });

    // 4. Orders
    await migrateTable(mdb, pgClient, {
      mariaTable: "website_orders",
      pgTable: "orders",
      columns: [
        "id", "userId", "status", "total", "couponId", "discount",
        "paymentMethod", "paymentId", "createdAt", "updatedAt",
      ],
      transform: (r) => ({
        id: r.id,
        userId: r.user_id,
        status: r.status,
        total: r.total,
        couponId: r.coupon_id,
        discount: r.discount,
        paymentMethod: r.payment_method,
        paymentId: r.payment_id,
        createdAt: toIso(r.created_at),
        updatedAt: toIso(r.updated_at),
      }),
    });

    // 5. Order Items
    await migrateTable(mdb, pgClient, {
      mariaTable: "website_order_items",
      pgTable: "order_items",
      columns: ["id", "orderId", "productId", "quantity", "price"],
      transform: (r) => ({
        id: r.id,
        orderId: r.order_id,
        productId: r.product_id,
        quantity: r.quantity,
        price: r.price,
      }),
    });

    // 6. Coupons
    await migrateTable(mdb, pgClient, {
      mariaTable: "coupons",
      pgTable: "coupons",
      columns: [
        "id", "code", "discount", "maxUses", "uses", "active", "expiresAt", "createdAt",
      ],
      transform: (r) => ({
        id: r.id,
        code: r.code,
        discount: r.discount,
        maxUses: r.max_uses,
        uses: r.uses,
        active: toBool(r.active),
        expiresAt: toIso(r.expires_at),
        createdAt: toIso(r.created_at),
      }),
    });

    // 7. Forum Categories
    await migrateTable(mdb, pgClient, {
      mariaTable: "forum_categories",
      pgTable: "forum_categories",
      columns: [
        "id", "name", "slug", "description", "icon", "order",
        "staffOnly", "active", "createdAt",
      ],
      transform: (r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        icon: r.icon,
        order: r.order,
        staffOnly: toBool(r.staff_only),
        active: toBool(r.active),
        createdAt: toIso(r.created_at),
      }),
    });

    // 8. Posts (Forum Topics)
    await migrateTable(mdb, pgClient, {
      mariaTable: "posts",
      pgTable: "posts",
      columns: [
        "id", "title", "slug", "content", "authorId", "categoryId",
        "pinned", "locked", "resolved", "views", "tags",
        "lastActivityAt", "createdAt", "updatedAt",
      ],
      transform: (r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        content: r.content,
        authorId: r.author_id,
        categoryId: r.category_id,
        pinned: toBool(r.pinned),
        locked: toBool(r.locked),
        resolved: toBool(r.resolved),
        views: r.views,
        tags: r.tags,
        lastActivityAt: toIso(r.last_activity_at),
        createdAt: toIso(r.created_at),
        updatedAt: toIso(r.updated_at),
      }),
    });

    // 9. Comments
    await migrateTable(mdb, pgClient, {
      mariaTable: "comments",
      pgTable: "comments",
      columns: [
        "id", "content", "authorId", "postId", "parentId", "createdAt", "updatedAt",
      ],
      transform: (r) => ({
        id: r.id,
        content: r.content,
        authorId: r.author_id,
        postId: r.post_id,
        parentId: r.parent_id,
        createdAt: toIso(r.created_at),
        updatedAt: toIso(r.updated_at),
      }),
    });

    // 10. Reactions
    await migrateTable(mdb, pgClient, {
      mariaTable: "reactions",
      pgTable: "reactions",
      columns: ["id", "type", "userId", "postId", "commentId", "createdAt"],
      transform: (r) => ({
        id: r.id,
        type: r.type,
        userId: r.user_id,
        postId: r.post_id,
        commentId: r.comment_id,
        createdAt: toIso(r.created_at),
      }),
    });

    // 11. Reports
    await migrateTable(mdb, pgClient, {
      mariaTable: "reports",
      pgTable: "reports",
      columns: [
        "id", "reason", "details", "reporterId", "postId", "commentId",
        "resolved", "createdAt",
      ],
      transform: (r) => ({
        id: r.id,
        reason: r.reason,
        details: r.details,
        reporterId: r.reporter_id,
        postId: r.post_id,
        commentId: r.comment_id,
        resolved: toBool(r.resolved),
        createdAt: toIso(r.created_at),
      }),
    });

    // 12. Blog Categories
    await migrateTable(mdb, pgClient, {
      mariaTable: "blog_categories",
      pgTable: "blog_categories",
      columns: ["id", "name", "slug", "createdAt"],
      transform: (r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        createdAt: toIso(r.created_at),
      }),
    });

    // 13. Blog Posts
    await migrateTable(mdb, pgClient, {
      mariaTable: "blog_posts",
      pgTable: "blog_posts",
      columns: [
        "id", "title", "slug", "content", "excerpt", "coverImage",
        "tags", "readTime", "published", "views", "authorId",
        "categoryId", "publishedAt", "createdAt", "updatedAt",
      ],
      transform: (r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        content: r.content,
        excerpt: r.excerpt,
        coverImage: r.cover_image,
        tags: r.tags,
        readTime: r.read_time,
        published: toBool(r.published),
        views: r.views,
        authorId: r.author_id,
        categoryId: r.category_id,
        publishedAt: toIso(r.published_at),
        createdAt: toIso(r.created_at),
        updatedAt: toIso(r.updated_at),
      }),
    });

    // 14. Contact Messages
    await migrateTable(mdb, pgClient, {
      mariaTable: "contact_messages",
      pgTable: "contact_messages",
      columns: ["id", "name", "email", "subject", "message", "createdAt"],
      transform: (r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        subject: r.subject,
        message: r.message,
        createdAt: toIso(r.created_at),
      }),
    });

    // 15. Newsletter
    await migrateTable(mdb, pgClient, {
      mariaTable: "newsletters",
      pgTable: "newsletters",
      columns: ["id", "email", "confirmed", "token", "createdAt"],
      transform: (r) => ({
        id: r.id,
        email: r.email,
        confirmed: toBool(r.confirmed),
        token: r.token,
        createdAt: toIso(r.created_at),
      }),
    });

    // 16. Password Reset Tokens
    await migrateTable(mdb, pgClient, {
      mariaTable: "password_reset_tokens",
      pgTable: "password_reset_tokens",
      columns: ["id", "token", "userId", "expiresAt", "used", "createdAt"],
      transform: (r) => ({
        id: r.id,
        token: r.token,
        userId: r.user_id,
        expiresAt: toIso(r.expires_at),
        used: toBool(r.used),
        createdAt: toIso(r.created_at),
      }),
    });

    // 17. Disciplines
    await migrateTable(mdb, pgClient, {
      mariaTable: "website_disciplines",
      pgTable: "disciplines",
      columns: [
        "id", "name", "slug", "description", "icon", "color",
        "order", "active", "createdAt", "updatedAt",
      ],
      transform: (r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        icon: r.icon,
        color: r.color,
        order: r.order,
        active: toBool(r.active),
        createdAt: toIso(r.created_at),
        updatedAt: toIso(r.updated_at),
      }),
    });

    // 18. Lessons
    await migrateTable(mdb, pgClient, {
      mariaTable: "website_lessons",
      pgTable: "lessons",
      columns: [
        "id", "title", "slug", "description", "content", "videoUrl",
        "duration", "order", "active", "disciplineId", "createdAt", "updatedAt",
      ],
      transform: (r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        description: r.description,
        content: r.content,
        videoUrl: r.video_url,
        duration: r.duration,
        order: r.order,
        active: toBool(r.active),
        disciplineId: r.discipline_id,
        createdAt: toIso(r.created_at),
        updatedAt: toIso(r.updated_at),
      }),
    });

    // 19. User Lesson Progress
    await migrateTable(mdb, pgClient, {
      mariaTable: "website_user_lesson_progress",
      pgTable: "user_lesson_progress",
      columns: ["id", "userId", "lessonId", "completed", "completedAt", "createdAt"],
      transform: (r) => ({
        id: r.id,
        userId: r.user_id,
        lessonId: r.lesson_id,
        completed: toBool(r.completed),
        completedAt: toIso(r.completed_at),
        createdAt: toIso(r.created_at),
      }),
    });

    // 20. Cart Items
    await migrateTable(mdb, pgClient, {
      mariaTable: "website_cart_items",
      pgTable: "cart_items",
      columns: ["id", "userId", "productId", "quantity", "createdAt"],
      transform: (r) => ({
        id: r.id,
        userId: r.user_id,
        productId: r.product_id,
        quantity: r.quantity,
        createdAt: toIso(r.created_at),
      }),
    });

    console.log("\n" + "═".repeat(60));
    console.log("  🎉 Migração v0.13 concluída com sucesso!");
    console.log("═".repeat(60));
    console.log("\nPróximos passos:");
    console.log("  1. Verifique os dados no PostgreSQL");
    console.log("  2. Atualize o .env se necessário");
    console.log("  3. Reinicie o servidor de desenvolvimento");
  } catch (err) {
    console.error("\n❌ Erro na migração:", err.message);
    process.exit(1);
  } finally {
    if (mdb) mdb.release();
    await mdbPool.end();
    await pgPool.end();
  }
}

migrate();
