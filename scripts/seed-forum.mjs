import "dotenv/config";
import * as mariadb from "mariadb";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL não definida no .env");
  process.exit(1);
}

const url = new URL(DATABASE_URL.replace(/^mysql:/, "mariadb:"));
const pool = mariadb.createPool({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  connectionLimit: 2,
});

const CATEGORIES = [
  {
    name: "Anúncios",
    slug: "anuncios",
    description: "Novidades oficiais da CraftSapiens",
    icon: "📢",
    order: 1,
    staff_only: true,
  },
  {
    name: "Geral",
    slug: "geral",
    description: "Discussões livres sobre a CraftSapiens",
    icon: "💬",
    order: 2,
    staff_only: false,
  },
  {
    name: "Dúvidas de Aulas",
    slug: "duvidas",
    description: "Perguntas sobre disciplinas e conteúdos",
    icon: "❓",
    order: 3,
    staff_only: false,
  },
  {
    name: "Sugestões",
    slug: "sugestoes",
    description: "Ideias para melhorar o servidor e a plataforma",
    icon: "💡",
    order: 4,
    staff_only: false,
  },
  {
    name: "Bugs & Problemas",
    slug: "bugs",
    description: "Reportar problemas do servidor ou site",
    icon: "🐛",
    order: 5,
    staff_only: false,
  },
  {
    name: "Showroom",
    slug: "showroom",
    description: "Compartilhe construções e conquistas",
    icon: "🏗️",
    order: 6,
    staff_only: false,
  },
  {
    name: "Off-Topic",
    slug: "off-topic",
    description: "Assuntos gerais fora do tema",
    icon: "🎮",
    order: 7,
    staff_only: false,
  },
];

async function seed() {
  let conn;
  try {
    conn = await pool.getConnection();

    for (const cat of CATEGORIES) {
      const id = `fcat_${cat.slug.replace(/-/g, "_")}`;
      await conn.query(
        `INSERT INTO forum_categories (id, name, slug, description, icon, \`order\`, staff_only, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, true)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           description = VALUES(description),
           icon = VALUES(icon),
           \`order\` = VALUES(\`order\`),
           staff_only = VALUES(staff_only)`,
        [id, cat.name, cat.slug, cat.description, cat.icon, cat.order, cat.staff_only]
      );
      console.log(`✓ Categoria: ${cat.name}`);
    }

    console.log(`\n✅ ${CATEGORIES.length} categorias do fórum inseridas/atualizadas com sucesso!`);
  } catch (err) {
    console.error("Erro ao popular categorias:", err);
    process.exit(1);
  } finally {
    if (conn) conn.release();
    await pool.end();
  }
}

seed();
