// Script para popular o catálogo da loja (PostgreSQL).
// Uso: npm run db:seed:loja  (ou node scripts/seed-loja.mjs)
//
// ATENÇÃO: este catálogo é DADO DE EXEMPLO (o mesmo que estava fixo na página
// da loja). Revise nomes, preços, benefícios e defina o `serverCommand` de cada
// produto antes de usar em produção. Nenhum cupom é criado por este script.
//
// Requer: POSTGRES_URL no .env e tabelas criadas com `npm run db:push:pg`.
// Idempotente: faz upsert pelo slug.
//
// Formato de `benefits` (ver parseBenefits em src/lib/products.ts): JSON com
// uma lista de textos ou de objetos { label, included }.

import { prisma, disconnect } from "./lib/pg-prisma.mjs";

const VIP_PLANS = [
  {
    slug: "vip",
    name: "VIP",
    description: "Assinatura mensal VIP da CraftSapiens: acesso às aulas básicas e avançadas, moedas SAPIENS todo mês e rank VIP exclusivo.",
    shortDescription: "Aulas básicas e avançadas, 100 moedas SAPIENS/mês e rank VIP.",
    price: "19.90",
    color: "#4CAF50",
    featured: false,
    badge: null,
    order: 1,
    benefits: [
      { label: "Acesso ao servidor", included: true },
      { label: "Aulas básicas", included: true },
      { label: "Aulas avançadas", included: true },
      { label: "Aulas ENEM", included: false },
      { label: "100 Moedas SAPIENS/mês", included: true },
      { label: "Rank VIP exclusivo", included: true },
      { label: "Cosméticos exclusivos", included: false },
      { label: "Suporte prioritário", included: false },
    ],
  },
  {
    slug: "vip-plus",
    name: "VIP+",
    description: "Assinatura mensal VIP+ da CraftSapiens: todas as aulas, incluindo ENEM, mais moedas SAPIENS, rank VIP+ e cosméticos exclusivos.",
    shortDescription: "Todas as aulas (inclui ENEM), 300 moedas SAPIENS/mês e cosméticos exclusivos.",
    price: "29.90",
    color: "#FFD700",
    featured: true,
    badge: "MAIS POPULAR",
    order: 2,
    benefits: [
      { label: "Acesso ao servidor", included: true },
      { label: "Aulas básicas", included: true },
      { label: "Aulas avançadas", included: true },
      { label: "Aulas ENEM", included: true },
      { label: "300 Moedas SAPIENS/mês", included: true },
      { label: "Rank VIP+ exclusivo", included: true },
      { label: "Cosméticos exclusivos", included: true },
      { label: "Suporte prioritário", included: false },
    ],
  },
  {
    slug: "premium",
    name: "Premium",
    description: "Assinatura mensal Premium da CraftSapiens: todos os benefícios do VIP+, mais moedas SAPIENS, rank Premium e suporte prioritário.",
    shortDescription: "Tudo do VIP+, 500 moedas SAPIENS/mês e suporte prioritário.",
    price: "49.90",
    color: "#9C27B0",
    featured: false,
    badge: null,
    order: 3,
    benefits: [
      { label: "Acesso ao servidor", included: true },
      { label: "Aulas básicas", included: true },
      { label: "Aulas avançadas", included: true },
      { label: "Aulas ENEM", included: true },
      { label: "500 Moedas SAPIENS/mês", included: true },
      { label: "Rank Premium exclusivo", included: true },
      { label: "Cosméticos exclusivos", included: true },
      { label: "Suporte prioritário", included: true },
    ],
  },
];

const ITEMS = [
  {
    slug: "rank-gold",
    name: "Rank Gold",
    shortDescription: "Título dourado exclusivo no chat e tablist do servidor.",
    price: "19.90",
    originalPrice: null,
    category: "RANK",
    color: "#FFD700",
    badge: null,
    order: 4,
    benefits: ["Prefixo [Gold] no chat", "Cor dourada no tablist", "Acesso a /fly em lobby"],
  },
  {
    slug: "rank-diamond",
    name: "Rank Diamond",
    shortDescription: "Título diamante com efeitos especiais e comandos extras.",
    price: "34.90",
    originalPrice: null,
    category: "RANK",
    color: "#00BCD4",
    badge: "POPULAR",
    order: 5,
    benefits: ["Prefixo [Diamond] no chat", "Partículas de diamante", "Acesso a /fly"],
  },
  {
    slug: "trail-fire",
    name: "Trail Fire",
    shortDescription: "Trilha de partículas de fogo ao caminhar.",
    price: "9.90",
    originalPrice: null,
    category: "COSMETICO",
    color: "#FF5722",
    badge: "NOVO",
    order: 6,
    benefits: ["Partículas de fogo ao andar", "Toggle on/off com comando"],
  },
  {
    slug: "trail-stars",
    name: "Trail Stars",
    shortDescription: "Trilha de estrelas brilhantes que seguem seus passos.",
    price: "9.90",
    originalPrice: null,
    category: "COSMETICO",
    color: "#FFC107",
    badge: null,
    order: 7,
    benefits: ["Partículas de estrelas ao andar", "Toggle on/off com comando"],
  },
  {
    slug: "500-moedas-sapiens",
    name: "500 Moedas SAPIENS",
    shortDescription: "Pacote de 500 moedas para usar no servidor.",
    price: "14.90",
    originalPrice: null,
    category: "MOEDA",
    color: "#4CAF50",
    badge: null,
    order: 8,
    benefits: ["500 moedas creditadas instantaneamente", "Use na loja in-game"],
  },
  {
    slug: "1500-moedas-sapiens",
    name: "1.500 Moedas SAPIENS",
    shortDescription: "Pacote de 1.500 moedas com bônus de 20%.",
    price: "39.90",
    originalPrice: "44.70",
    category: "MOEDA",
    color: "#4CAF50",
    badge: "MAIS VENDIDO",
    order: 9,
    benefits: ["1.500 moedas (inclui 250 bônus)", "Use na loja in-game"],
  },
  {
    slug: "kit-iniciante",
    name: "Kit Iniciante",
    shortDescription: "Ferramentas e itens essenciais para começar no servidor.",
    price: "12.90",
    originalPrice: null,
    category: "KIT",
    color: "#795548",
    badge: null,
    order: 10,
    benefits: ["Armadura de ferro completa", "Ferramentas de diamante", "64 steaks", "32 blocos variados"],
  },
  {
    slug: "kit-aventureiro",
    name: "Kit Aventureiro",
    shortDescription: "Equipamento avançado para explorar e construir.",
    price: "24.90",
    originalPrice: null,
    category: "KIT",
    color: "#FF9800",
    badge: null,
    order: 11,
    benefits: ["Armadura de diamante", "Ferramentas de netherite", "Elytra + fogos", "Stack de materiais"],
  },
];

const PRODUCTS = [
  ...VIP_PLANS.map((plan) => ({
    slug: plan.slug,
    name: plan.name,
    description: plan.description,
    shortDescription: plan.shortDescription,
    price: plan.price,
    originalPrice: null,
    category: "VIP",
    durationDays: 30,
    benefits: JSON.stringify(plan.benefits),
    featured: plan.featured,
    badge: plan.badge,
    color: plan.color,
    order: plan.order,
  })),
  ...ITEMS.map((item) => ({
    slug: item.slug,
    name: item.name,
    description: item.shortDescription,
    shortDescription: item.shortDescription,
    price: item.price,
    originalPrice: item.originalPrice,
    category: item.category,
    durationDays: null,
    benefits: item.benefits.length > 0 ? JSON.stringify(item.benefits) : null,
    featured: false,
    badge: item.badge,
    color: item.color,
    order: item.order,
  })),
];

async function seed() {
  try {
    console.log(`Seed da Loja — ${PRODUCTS.length} produtos (dados de exemplo)\n`);

    for (const product of PRODUCTS) {
      const { slug, ...data } = product;
      await prisma.product.upsert({
        where: { slug },
        update: data,
        create: {
          id: `prod_${slug.replace(/-/g, "_")}`,
          slug,
          ...data,
          imageUrl: null,
          serverCommand: null,
          stock: -1,
          active: true,
        },
      });
      console.log(`${data.category.padEnd(9)} ${data.name}`);
    }

    console.log(`\n${PRODUCTS.length} produtos inseridos/atualizados com sucesso!`);
    console.log("Aviso: Lembre-se: revise o catálogo e configure o serverCommand de cada produto antes de vender.");
  } catch (err) {
    console.error("Erro no seed da loja:", err);
    process.exitCode = 1;
  } finally {
    await disconnect();
  }
}

await seed();
