/**
 * Migração v0.13 — Copia os dados do site do MariaDB para o PostgreSQL
 *
 * Migração ÚNICA (one-time). Até a v0.12 todas as tabelas do site ficavam no
 * MariaDB, junto com a tabela `nlogin` do servidor Minecraft. A partir da v0.13
 * os dados do site vivem no PostgreSQL e apenas o `nlogin` continua no MariaDB.
 * Este script LÊ (somente SELECT, sessão em modo READ ONLY) as tabelas do site
 * no MariaDB e as grava no PostgreSQL. Nada é alterado ou apagado no MariaDB.
 *
 * Antes de rodar:
 *   1. FAÇA BACKUP dos dois bancos (mysqldump do MariaDB e pg_dump do PostgreSQL).
 *   2. Configure DATABASE_URL (MariaDB) e POSTGRES_URL (PostgreSQL) no .env.
 *   3. Crie as tabelas no PostgreSQL: `npm run db:push:pg`.
 *   4. Rode a migração ANTES dos seeds (`npm run db:seed`), para que os
 *      registros reais não conflitem com os de exemplo por slug/código.
 *
 * Uso:
 *   node scripts/migrate-v13.mjs --dry-run   → só lê o MariaDB: mostra a contagem
 *                                              de linhas por tabela, as colunas
 *                                              ausentes/ignoradas e valida a
 *                                              conversão. Não grava nada.
 *   node scripts/migrate-v13.mjs             → executa a migração
 *   (ou `npm run db:migrate-v13 -- --dry-run`)
 *
 * Idempotente: as inserções usam `createMany({ skipDuplicates: true })`, então
 * rodar de novo não duplica registros (os já existentes são mantidos como estão).
 *
 * Ao final é exibida uma tabela origem × destino por modelo. O script termina
 * com código 1 se houver qualquer erro ou divergência de contagem. Tabelas que
 * não existirem no MariaDB são puladas com aviso. A tabela `rate_limits` é nova
 * (só existe no PostgreSQL) e não é migrada.
 */
import "dotenv/config";
import * as mariadb from "mariadb";

const DRY_RUN = process.argv.includes("--dry-run");
const BATCH_SIZE = 500;
const ID_CHUNK = 1000;

// ── Conexão MariaDB (somente leitura) ─────────────────────────────────────

const mariaDbUrl = process.env.DATABASE_URL;
if (!mariaDbUrl) {
  console.error("❌ DATABASE_URL (MariaDB de origem) não definida no .env");
  process.exit(1);
}

function mariaDbConfig(raw) {
  const url = new URL(raw.replace(/^mysql:/, "mariadb:"));
  return {
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    connectionLimit: 1,
    connectTimeout: 10000,
    // Datas como texto: interpretadas como UTC, igual ao adapter Prisma do MariaDB
    dateStrings: true,
  };
}

// ── Conversões ────────────────────────────────────────────────────────────

const ENUMS = {
  Role: ["ALUNO", "PROFESSOR", "MODERADOR", "ADMIN"],
  ProductCategory: ["VIP", "RANK", "COSMETICO", "MOEDA", "KIT"],
  OrderStatus: ["PENDING", "APPROVED", "REJECTED", "REFUNDED"],
  ReactionType: ["LIKE", "DISLIKE"],
};

const INT_MIN = -2147483648;
const INT_MAX = 2147483647;

class MappingError extends Error {}

function parseDate(value) {
  if (value instanceof Date) return value;
  const text = String(value).trim();
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T00:00:00Z` : `${text.replace(" ", "T")}Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()) || text.startsWith("0000-")) return null;
  return date;
}

function slugify(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

/**
 * Leitor de uma linha do MariaDB. Só permite ler colunas declaradas em
 * `columns` da tabela; colunas ausentes no banco chegam como undefined e
 * recebem o valor padrão informado.
 */
function rowReader(spec, row) {
  const rowId = row.id ?? "(sem id)";
  const fail = (col, msg) => {
    throw new MappingError(`${spec.source}.${col} (id=${rowId}): ${msg}`);
  };
  const raw = (col) => {
    if (!spec.columns.includes(col)) {
      throw new Error(`Bug no script: coluna "${col}" não declarada em ${spec.source}`);
    }
    return row[col];
  };
  const missing = (v) => v === undefined || v === null;

  const str = (col, fallback = null) => {
    const v = raw(col);
    if (missing(v)) return fallback;
    return Buffer.isBuffer(v) ? v.toString("utf8") : String(v);
  };
  const int = (col, fallback = null) => {
    const v = raw(col);
    if (missing(v)) return fallback;
    const n = Number(v); // INT chega como number; BIGINT como bigint
    if (!Number.isInteger(n) || n < INT_MIN || n > INT_MAX) fail(col, `inteiro inválido "${v}"`);
    return n;
  };
  const bool = (col, fallback) => {
    const v = raw(col);
    if (missing(v)) return fallback;
    if (Buffer.isBuffer(v)) return v.length > 0 && v[0] === 1;
    if (typeof v === "boolean") return v;
    if (v === 1 || v === "1" || v === 1n) return true;
    if (v === 0 || v === "0" || v === 0n) return false;
    return fail(col, `booleano inválido "${v}"`);
  };
  const decimal = (col, fallback = null) => {
    const v = raw(col);
    if (missing(v)) return fallback;
    const text = String(v);
    if (!/^-?\d+(\.\d+)?$/.test(text)) fail(col, `decimal inválido "${v}"`);
    return text;
  };
  const date = (col, fallback = null) => {
    const v = raw(col);
    if (missing(v)) return fallback;
    const d = parseDate(v);
    if (!d) fail(col, `data inválida "${v}"`);
    return d;
  };
  const enumOf = (col, name, fallback = null) => {
    const v = str(col);
    if (v === null) return fallback;
    if (!ENUMS[name].includes(v)) fail(col, `valor "${v}" fora do enum ${name}`);
    return v;
  };
  const required = (value, col) => {
    if (missing(value)) fail(col, "campo obrigatório nulo ou ausente");
    return value;
  };

  return {
    req: (col) => required(str(col), col),
    str,
    int,
    intReq: (col) => required(int(col), col),
    bool,
    decimal,
    decimalReq: (col) => required(decimal(col), col),
    date,
    dateReq: (col) => required(date(col), col),
    enumOf,
    enumReq: (col, name) => required(enumOf(col, name), col),
  };
}

// ── Mapeamento tabela MariaDB → modelo Prisma (PostgreSQL) ───────────────
// A ordem respeita as chaves estrangeiras. `columns` lista as colunas lidas
// da origem; `map` recebe o leitor e a data de "agora" (fallback de datas).

const TABLES = [
  {
    model: "User",
    delegate: "user",
    source: "users",
    columns: ["id", "nlogin_id", "email", "role", "birth_date", "deactivated_at", "created_at", "updated_at"],
    map: (r, now) => {
      const createdAt = r.date("created_at", now);
      return {
        id: r.req("id"),
        nloginId: r.intReq("nlogin_id"),
        email: r.req("email"),
        role: r.enumOf("role", "Role", "ALUNO"),
        birthDate: r.date("birth_date"),
        deactivatedAt: r.date("deactivated_at"),
        sessionVersion: 0, // coluna nova (v0.14): começa em 0
        createdAt,
        updatedAt: r.date("updated_at", createdAt),
      };
    },
  },
  {
    model: "Profile",
    delegate: "profile",
    source: "profiles",
    columns: [
      "id", "user_id", "avatar", "bio", "sapiens_coins", "xp", "playtime_minutes", "aulas_concluidas",
      "ranking_position", "perfil_publico", "mostrar_tempo_online", "mostrar_atividade",
      "notif_forum_respostas", "notif_lembretes_aulas", "notif_novidades", "notif_resumo_semanal",
    ],
    map: (r) => ({
      id: r.req("id"),
      userId: r.req("user_id"),
      avatar: r.str("avatar"),
      bio: r.str("bio"),
      sapiensCoins: r.int("sapiens_coins", 0),
      xp: r.int("xp", 0),
      playtimeMinutes: r.int("playtime_minutes", 0),
      aulasConcluidas: r.int("aulas_concluidas", 0),
      rankingPosition: r.int("ranking_position"),
      perfilPublico: r.bool("perfil_publico", true),
      mostrarTempoOnline: r.bool("mostrar_tempo_online", true),
      mostrarAtividade: r.bool("mostrar_atividade", true),
      notifForumRespostas: r.str("notif_forum_respostas", "email"),
      notifLembretesAulas: r.str("notif_lembretes_aulas", "email"),
      notifNovidades: r.str("notif_novidades", "off"),
      notifResumoSemanal: r.str("notif_resumo_semanal", "off"),
    }),
  },
  {
    model: "ForumCategory",
    delegate: "forumCategory",
    source: "forum_categories",
    columns: ["id", "name", "slug", "description", "icon", "order", "staff_only", "active"],
    map: (r) => ({
      id: r.req("id"),
      name: r.req("name"),
      slug: r.req("slug"),
      description: r.str("description"),
      icon: r.str("icon"),
      order: r.int("order", 0),
      staffOnly: r.bool("staff_only", false),
      active: r.bool("active", true),
    }),
  },
  {
    model: "BlogCategory",
    delegate: "blogCategory",
    source: "blog_categories",
    columns: ["id", "name", "slug"],
    map: (r) => ({
      id: r.req("id"),
      name: r.req("name"),
      slug: r.req("slug"),
    }),
  },
  {
    model: "Product",
    delegate: "product",
    source: "products",
    columns: [
      "id", "name", "slug", "description", "short_description", "price", "original_price", "category",
      "image_url", "duration_days", "benefits", "server_command", "stock", "featured", "badge", "color",
      "order", "active", "created_at",
    ],
    map: (r, now) => ({
      id: r.req("id"),
      name: r.req("name"),
      slug: r.req("slug"),
      description: r.req("description"),
      shortDescription: r.str("short_description"),
      price: r.decimalReq("price"),
      originalPrice: r.decimal("original_price"),
      category: r.enumReq("category", "ProductCategory"),
      imageUrl: r.str("image_url"),
      durationDays: r.int("duration_days"),
      benefits: r.str("benefits"),
      serverCommand: r.str("server_command"),
      stock: r.int("stock", -1),
      featured: r.bool("featured", false),
      badge: r.str("badge"),
      color: r.str("color"),
      order: r.int("order", 0),
      active: r.bool("active", true),
      createdAt: r.date("created_at", now),
    }),
  },
  {
    model: "Coupon",
    delegate: "coupon",
    source: "coupons",
    columns: ["id", "code", "discount", "max_uses", "uses", "active", "expires_at", "created_at"],
    map: (r, now) => ({
      id: r.req("id"),
      code: r.req("code"),
      discount: r.decimalReq("discount"),
      maxUses: r.int("max_uses"),
      uses: r.int("uses", 0),
      active: r.bool("active", true),
      expiresAt: r.date("expires_at"),
      createdAt: r.date("created_at", now),
    }),
  },
  {
    model: "Order",
    delegate: "order",
    source: "orders",
    columns: [
      "id", "user_id", "status", "total", "payment_method", "payment_id", "coupon_id", "created_at", "updated_at",
    ],
    map: (r, now) => {
      const createdAt = r.date("created_at", now);
      return {
        id: r.req("id"),
        userId: r.req("user_id"),
        status: r.enumOf("status", "OrderStatus", "PENDING"),
        total: r.decimalReq("total"),
        paymentMethod: r.str("payment_method"),
        paymentId: r.str("payment_id"),
        couponId: r.str("coupon_id"),
        createdAt,
        updatedAt: r.date("updated_at", createdAt),
      };
    },
  },
  {
    model: "OrderItem",
    delegate: "orderItem",
    source: "order_items",
    columns: ["id", "order_id", "product_id", "quantity", "price"],
    map: (r) => ({
      id: r.req("id"),
      orderId: r.req("order_id"),
      productId: r.req("product_id"),
      quantity: r.int("quantity", 1),
      price: r.decimalReq("price"),
    }),
  },
  {
    model: "Post",
    delegate: "post",
    source: "posts",
    columns: [
      "id", "title", "slug", "content", "author_id", "category_id", "pinned", "locked", "resolved", "views",
      "tags", "last_activity_at", "created_at", "updated_at",
    ],
    map: (r, now) => {
      const id = r.req("id");
      const title = r.req("title");
      const createdAt = r.date("created_at", now);
      const updatedAt = r.date("updated_at", createdAt);
      let slug = r.str("slug");
      if (!slug) {
        // Slug é obrigatório e único no PostgreSQL: gera um a partir do título + id
        slug = `${slugify(title) || "topico"}-${id}`.slice(0, 300);
        console.warn(`   ⚠️ posts id=${id}: slug ausente, gerado "${slug}"`);
      }
      return {
        id,
        title,
        slug,
        content: r.req("content"),
        authorId: r.req("author_id"),
        categoryId: r.req("category_id"),
        pinned: r.bool("pinned", false),
        locked: r.bool("locked", false),
        resolved: r.bool("resolved", false),
        views: r.int("views", 0),
        tags: r.str("tags"),
        lastActivityAt: r.date("last_activity_at", updatedAt),
        createdAt,
        updatedAt,
      };
    },
  },
  {
    model: "Comment",
    delegate: "comment",
    source: "comments",
    columns: ["id", "content", "author_id", "post_id", "parent_id", "created_at", "updated_at"],
    map: (r, now) => {
      const createdAt = r.date("created_at", now);
      return {
        id: r.req("id"),
        content: r.req("content"),
        authorId: r.req("author_id"),
        postId: r.req("post_id"),
        parentId: r.str("parent_id"),
        createdAt,
        updatedAt: r.date("updated_at", createdAt),
      };
    },
    // Auto-relação (respostas): insere por nível — primeiro os comentários
    // raiz, depois as respostas deles, e assim por diante.
    levels: (rows) => levelsByParent(rows, "parentId"),
  },
  {
    model: "Reaction",
    delegate: "reaction",
    source: "reactions",
    columns: ["id", "user_id", "post_id", "comment_id", "type"],
    map: (r) => ({
      id: r.req("id"),
      userId: r.req("user_id"),
      postId: r.str("post_id"),
      commentId: r.str("comment_id"),
      type: r.enumReq("type", "ReactionType"),
    }),
  },
  {
    model: "Report",
    delegate: "report",
    source: "reports",
    columns: ["id", "user_id", "reason", "post_id", "comment_id", "resolved", "created_at"],
    map: (r, now) => ({
      id: r.req("id"),
      userId: r.req("user_id"),
      reason: r.req("reason"),
      postId: r.str("post_id"),
      commentId: r.str("comment_id"),
      resolved: r.bool("resolved", false),
      createdAt: r.date("created_at", now),
    }),
  },
  {
    model: "BlogPost",
    delegate: "blogPost",
    source: "blog_posts",
    columns: [
      "id", "title", "slug", "content", "excerpt", "cover_image", "author_id", "category_id", "tags", "views",
      "read_time", "published", "published_at", "created_at", "updated_at",
    ],
    map: (r, now) => {
      const createdAt = r.date("created_at", now);
      return {
        id: r.req("id"),
        title: r.req("title"),
        slug: r.req("slug"),
        content: r.req("content"),
        excerpt: r.str("excerpt"),
        coverImage: r.str("cover_image"),
        authorId: r.str("author_id"),
        categoryId: r.req("category_id"),
        tags: r.str("tags"),
        views: r.int("views", 0),
        readTime: r.int("read_time", 5),
        published: r.bool("published", false),
        publishedAt: r.date("published_at"),
        createdAt,
        updatedAt: r.date("updated_at", createdAt),
      };
    },
  },
  {
    model: "Discipline",
    delegate: "discipline",
    source: "website_disciplines",
    columns: [
      "id", "name", "slug", "description", "short_description", "icon", "color", "banner", "levels", "order",
      "active", "created_at", "updated_at",
    ],
    map: (r, now) => {
      const createdAt = r.date("created_at", now);
      return {
        id: r.req("id"),
        name: r.req("name"),
        slug: r.req("slug"),
        description: r.req("description"),
        shortDescription: r.req("short_description"),
        icon: r.req("icon"),
        color: r.req("color"),
        banner: r.str("banner"),
        levels: r.req("levels"),
        order: r.int("order", 0),
        active: r.bool("active", true),
        createdAt,
        updatedAt: r.date("updated_at", createdAt),
      };
    },
  },
  {
    model: "Lesson",
    delegate: "lesson",
    source: "website_lessons",
    columns: [
      "id", "discipline_id", "title", "slug", "description", "content", "video_url", "objectives", "order",
      "duration_minutes", "active", "created_at", "updated_at",
    ],
    map: (r, now) => {
      const createdAt = r.date("created_at", now);
      return {
        id: r.req("id"),
        disciplineId: r.req("discipline_id"),
        title: r.req("title"),
        slug: r.req("slug"),
        description: r.req("description"),
        content: r.str("content"),
        videoUrl: r.str("video_url"),
        objectives: r.str("objectives"),
        order: r.int("order", 0),
        duration: r.int("duration_minutes"),
        active: r.bool("active", true),
        createdAt,
        updatedAt: r.date("updated_at", createdAt),
      };
    },
  },
  {
    model: "UserLessonProgress",
    delegate: "userLessonProgress",
    source: "website_user_lesson_progress",
    columns: ["id", "user_id", "lesson_id", "completed_at"],
    map: (r, now) => ({
      id: r.req("id"),
      userId: r.req("user_id"),
      lessonId: r.req("lesson_id"),
      completedAt: r.date("completed_at", now),
    }),
  },
  {
    model: "CartItem",
    delegate: "cartItem",
    source: "website_cart_items",
    columns: ["id", "user_id", "product_id", "quantity", "created_at"],
    map: (r, now) => ({
      id: r.req("id"),
      userId: r.req("user_id"),
      productId: r.req("product_id"),
      quantity: r.int("quantity", 1),
      createdAt: r.date("created_at", now),
    }),
  },
  {
    model: "PasswordResetToken",
    delegate: "passwordResetToken",
    source: "password_reset_tokens",
    columns: ["id", "user_id", "token_hash", "expires_at", "used_at", "created_at"],
    map: (r, now) => ({
      id: r.req("id"),
      userId: r.req("user_id"),
      tokenHash: r.req("token_hash"),
      expiresAt: r.dateReq("expires_at"),
      usedAt: r.date("used_at"),
      createdAt: r.date("created_at", now),
    }),
  },
  {
    model: "ContactMessage",
    delegate: "contactMessage",
    source: "contact_messages",
    columns: ["id", "name", "email", "category", "subject", "message", "read", "created_at"],
    map: (r, now) => ({
      id: r.req("id"),
      name: r.req("name"),
      email: r.req("email"),
      category: r.req("category"),
      subject: r.req("subject"),
      message: r.req("message"),
      read: r.bool("read", false),
      createdAt: r.date("created_at", now),
    }),
  },
  {
    model: "Newsletter",
    delegate: "newsletter",
    source: "newsletter",
    columns: ["id", "email", "confirmed", "confirm_token", "unsubscribed_at", "created_at"],
    map: (r, now) => ({
      id: r.req("id"),
      email: r.req("email"),
      confirmed: r.bool("confirmed", false),
      confirmToken: r.str("confirm_token"),
      unsubscribedAt: r.date("unsubscribed_at"),
      createdAt: r.date("created_at", now),
    }),
  },
];

/** Agrupa linhas de uma auto-relação por profundidade (raízes primeiro). */
function levelsByParent(rows, parentField) {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const depth = new Map();

  const depthOf = (row) => {
    const path = new Set();
    let current = row;
    let d = 0;
    while (current[parentField] && byId.has(current[parentField])) {
      if (depth.has(current.id)) {
        d += depth.get(current.id);
        break;
      }
      if (path.has(current.id)) {
        throw new MappingError(`Ciclo de ${parentField} detectado no id=${row.id}`);
      }
      path.add(current.id);
      current = byId.get(current[parentField]);
      d += 1;
    }
    return d;
  };

  const levels = [];
  for (const row of rows) {
    const d = depthOf(row);
    depth.set(row.id, d);
    (levels[d] ??= []).push(row);
  }
  return levels.filter(Boolean);
}

// ── Execução ──────────────────────────────────────────────────────────────

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

async function listSourceTables(conn) {
  const rows = await conn.query(
    "SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()"
  );
  return new Set(rows.map((row) => row.name));
}

async function listSourceColumns(conn, table) {
  const rows = await conn.query(
    "SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
    [table]
  );
  return rows.map((row) => row.name);
}

/** Fase 1: lê e converte todas as tabelas (nada é gravado ainda). */
async function readSource(conn) {
  const existing = await listSourceTables(conn);
  const now = new Date();
  const results = [];
  let errors = 0;

  for (const spec of TABLES) {
    if (!existing.has(spec.source)) {
      console.warn(`⚠️  ${spec.source}: tabela não existe no MariaDB — pulando ${spec.model}.`);
      results.push({ spec, skipped: true, data: [] });
      continue;
    }

    const sourceColumns = await listSourceColumns(conn, spec.source);
    const absent = spec.columns.filter((c) => !sourceColumns.includes(c));
    const ignored = sourceColumns.filter((c) => !spec.columns.includes(c));

    const rows = await conn.query(`SELECT * FROM \`${spec.source}\``);
    console.log(`📦 ${spec.source.padEnd(30)} ${String(rows.length).padStart(7)} linhas  → ${spec.model}`);
    if (absent.length) console.warn(`   ⚠️ colunas ausentes no MariaDB (usando valor padrão): ${absent.join(", ")}`);
    if (ignored.length) console.warn(`   ⚠️ colunas do MariaDB sem destino no PostgreSQL (NÃO migradas): ${ignored.join(", ")}`);

    const data = [];
    for (const row of rows) {
      try {
        data.push(spec.map(rowReader(spec, row), now));
      } catch (error) {
        if (!(error instanceof MappingError)) throw error;
        console.error(`   ❌ ${error.message}`);
        errors += 1;
      }
    }
    results.push({ spec, skipped: false, data });
  }

  return { results, errors };
}

/** Fase 2: grava no PostgreSQL em lotes com skipDuplicates. */
async function writeTable(prisma, { spec, data }) {
  const delegate = prisma[spec.delegate];
  const levels = spec.levels ? spec.levels(data) : [data];
  let inserted = 0;
  for (const level of levels) {
    for (const batch of chunk(level, BATCH_SIZE)) {
      const result = await delegate.createMany({ data: batch, skipDuplicates: true });
      inserted += result.count;
    }
  }
  return inserted;
}

/** Fase 3: confere quantos ids da origem existem no destino. */
async function verifyTable(prisma, { spec, data }) {
  const delegate = prisma[spec.delegate];
  let present = 0;
  for (const ids of chunk(data.map((row) => row.id), ID_CHUNK)) {
    present += await delegate.count({ where: { id: { in: ids } } });
  }
  const total = await delegate.count();
  return { present, total };
}

function printSummary(rows) {
  console.log("\n" + "═".repeat(86));
  console.log(
    "Modelo".padEnd(22) + "Origem".padStart(9) + "Inseridos".padStart(11) + "No destino".padStart(12) +
      "Total PG".padStart(10) + "  Status"
  );
  console.log("─".repeat(86));
  for (const row of rows) {
    console.log(
      row.model.padEnd(22) +
        String(row.source).padStart(9) +
        String(row.inserted).padStart(11) +
        String(row.present).padStart(12) +
        String(row.total).padStart(10) +
        "  " + row.status
    );
  }
  console.log("═".repeat(86));
}

async function main() {
  const pool = mariadb.createPool(mariaDbConfig(mariaDbUrl));
  let conn;
  let pg = null;
  let failed = false;

  try {
    conn = await pool.getConnection();
    // Garante que esta sessão nunca escreva no MariaDB
    await conn.query("SET SESSION TRANSACTION READ ONLY");

    console.log("═".repeat(60));
    console.log(`  MIGRAÇÃO v0.13 — MariaDB → PostgreSQL${DRY_RUN ? "  (DRY RUN)" : ""}`);
    console.log("═".repeat(60) + "\n");

    const { results, errors } = await readSource(conn);
    conn.release();
    conn = undefined;

    const totalRows = results.reduce((sum, r) => sum + r.data.length, 0);
    console.log(`\nTotal: ${totalRows} linhas convertidas em ${results.filter((r) => !r.skipped).length} tabelas.`);

    if (errors > 0) {
      console.error(`\n❌ ${errors} linha(s) com erro de conversão. Nada foi gravado no PostgreSQL.`);
      failed = true;
      return;
    }

    if (DRY_RUN) {
      console.log("\n✅ Dry run concluído: leitura e conversão OK. Nada foi gravado.");
      return;
    }

    pg = await import("./lib/pg-prisma.mjs");
    const summary = [];
    let aborted = false;

    for (const result of results) {
      const { spec } = result;
      const line = { model: spec.model, source: result.data.length, inserted: "-", present: "-", total: "-", status: "" };
      summary.push(line);

      if (result.skipped) {
        line.status = "⚠️ tabela ausente no MariaDB";
        continue;
      }
      if (aborted) {
        line.status = "⏭️ não executado";
        failed = true;
        continue;
      }

      try {
        console.log(`\n➡️  ${spec.model}: gravando ${result.data.length} registros...`);
        line.inserted = await writeTable(pg.prisma, result);
        const { present, total } = await verifyTable(pg.prisma, result);
        line.present = present;
        line.total = total;
        if (present === result.data.length) {
          line.status = "✅ OK";
        } else {
          line.status = `❌ faltam ${result.data.length - present} (conflito de chave única?)`;
          failed = true;
        }
      } catch (error) {
        console.error(`❌ Erro ao gravar ${spec.model}:`, error);
        line.status = "❌ erro";
        failed = true;
        // As próximas tabelas dependem desta (chaves estrangeiras): interrompe
        aborted = true;
      }
    }

    printSummary(summary);

    if (failed) {
      console.error(
        "\n❌ Migração terminou com erros ou divergências. Corrija e rode de novo (é idempotente).\n" +
          "   Divergência em 'No destino' indica registros pulados por conflito de chave única\n" +
          "   (slug, email, código...) com dados que já existiam no PostgreSQL."
      );
    } else {
      console.log("\n🎉 Migração v0.13 concluída: todos os registros estão no PostgreSQL.");
    }
  } catch (error) {
    console.error("\n❌ Erro na migração:", error);
    failed = true;
  } finally {
    if (conn) conn.release();
    await pool.end();
    if (pg) await pg.disconnect();
    if (failed) process.exitCode = 1;
  }
}

await main();
