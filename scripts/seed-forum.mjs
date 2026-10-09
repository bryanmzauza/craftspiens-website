// Script para popular as categorias do fórum (PostgreSQL).
// Uso: npm run db:seed:forum  (ou node scripts/seed-forum.mjs)
//
// Requer: POSTGRES_URL no .env e tabelas criadas com `npm run db:push:pg`.
// Idempotente: faz upsert pelo slug.

import { prisma, disconnect } from "./lib/pg-prisma.mjs";

const CATEGORIES = [
  {
    name: "Anúncios",
    slug: "anuncios",
    description: "Novidades oficiais da CraftSapiens",
    icon: "Megaphone",
    order: 1,
    staff_only: true,
  },
  {
    name: "Geral",
    slug: "geral",
    description: "Discussões livres sobre a CraftSapiens",
    icon: "MessageCircle",
    order: 2,
    staff_only: false,
  },
  {
    name: "Dúvidas de Aulas",
    slug: "duvidas",
    description: "Perguntas sobre disciplinas e conteúdos",
    icon: "CircleHelp",
    order: 3,
    staff_only: false,
  },
  {
    name: "Sugestões",
    slug: "sugestoes",
    description: "Ideias para melhorar o servidor e a plataforma",
    icon: "Lightbulb",
    order: 4,
    staff_only: false,
  },
  {
    name: "Bugs & Problemas",
    slug: "bugs",
    description: "Reportar problemas do servidor ou site",
    icon: "Bug",
    order: 5,
    staff_only: false,
  },
  {
    name: "Showroom",
    slug: "showroom",
    description: "Compartilhe construções e conquistas",
    icon: "Hammer",
    order: 6,
    staff_only: false,
  },
  {
    name: "Off-Topic",
    slug: "off-topic",
    description: "Assuntos gerais fora do tema",
    icon: "Gamepad2",
    order: 7,
    staff_only: false,
  },
];

async function seed() {
  try {
    for (const cat of CATEGORIES) {
      const data = {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        order: cat.order,
        staffOnly: cat.staff_only,
      };
      await prisma.forumCategory.upsert({
        where: { slug: cat.slug },
        update: data,
        create: { id: `fcat_${cat.slug.replace(/-/g, "_")}`, slug: cat.slug, active: true, ...data },
      });
      console.log(`Categoria: ${cat.name}`);
    }

    console.log(`\n${CATEGORIES.length} categorias do fórum inseridas/atualizadas com sucesso!`);
  } catch (err) {
    console.error("Erro ao popular categorias:", err);
    process.exitCode = 1;
  } finally {
    await disconnect();
  }
}

await seed();
