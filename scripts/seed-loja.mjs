// Catálogo da loja (PostgreSQL).
// Uso: npm run db:seed:loja  (ou node scripts/seed-loja.mjs)
//
// Idempotente: faz upsert pelo slug. Produtos de versões anteriores que não
// estão mais neste arquivo são desativados (nunca apagados, por causa dos pedidos).
//
// Entrega: o site não executa nada no servidor. Quando o pagamento é aprovado,
// cada item vira uma linha em `deliveries` com o slug do produto, a categoria,
// a quantidade, os dias de duração e o jogador (nick, UUID, Java ou Bedrock).
// O plugin da loja, no lobby, mapeia o slug para os comandos (grupo do LuckPerms,
// Sapiens, permissão do cosmético). A tabela slug -> ação está em
// docs/plugin-entregas.md; mudou um slug aqui, mude lá também.
//
// Os benefícios dos planos foram lidos dos grupos `vip`, `premium` e `vip_sg2`
// do LuckPerms do servidor em 10/10/2026. Se os grupos mudarem, atualize aqui.
// As aulas exclusivas são o principal benefício do Premium (o VIP não tem) e
// abrem a lista dele.
// Os preços dos cosméticos são sugestão inicial.

import { prisma, disconnect } from "./lib/pg-prisma.mjs";

const VIP_COLOR = "#FFEB3B";
const PREMIUM_COLOR = "#4CAF50";
const SAPIENS_COLOR = "#FFC107";

// Lidos do LuckPerms: o que cada plano dá hoje. `included: false` marca o que só o Premium tem.
const VIP_BENEFITS = [
  { label: "Tag [Vip] amarela no chat e na tab", included: true },
  { label: "Voar (/fly) no Survival e no Geopolítico", included: true },
  { label: "30 homes e teletransporte sem espera", included: true },
  { label: "Kits VIP diário, semanal e mensal", included: true },
  { label: "Criar lojas de baú e placas coloridas", included: true },
  { label: "Desconto na loja do servidor e bônus ao vender", included: true },
  { label: "+20% de XP em todas as habilidades", included: true },
  { label: "Cores no chat, /hat e baú virtual (/enderchest)", included: true },
  { label: "Entrar no servidor mesmo cheio", included: true },
  { label: "Geopolítico: apelido colorido, brilho e manter XP ao morrer", included: true },
  { label: "Aulas exclusivas Premium", included: false },
  { label: "Tag [Premium] verde e 50 homes", included: false },
  { label: "Kits Premium, +100% de XP em Encantamento", included: false },
  { label: "Warps e quiz exclusivos do Premium", included: false },
];

const PREMIUM_BENEFITS = [
  { label: "Aulas exclusivas Premium", included: true },
  { label: "Tudo do VIP", included: true },
  { label: "Tag [Premium] verde no chat e na tab", included: true },
  { label: "50 homes (2 públicas) e teletransporte sem espera", included: true },
  { label: "Kits Premium diário, semanal e mensal", included: true },
  { label: "Maior desconto na loja do servidor, também no Geopolítico", included: true },
  { label: "+100% de XP em Encantamento e +20% nas demais habilidades", included: true },
  { label: "Warps exclusivos (/warp premium) e quiz Premium", included: true },
  { label: "Acesso à área exclusiva PremiumVIP", included: true },
  { label: "Voar, lojas, cores no chat, /hat e baú virtual", included: true },
  { label: "Entrar no servidor mesmo cheio", included: true },
];

// Preço anual = 10 meses (2 meses grátis)
const MONTHS_PAID_PER_YEAR = 10;

function plan({ slug, name, price, color, featured, badge, order, benefits, annual }) {
  const days = annual ? 365 : 30;
  const monthly = price;
  const finalPrice = annual ? monthly * MONTHS_PAID_PER_YEAR : monthly;
  const label = annual ? "1 ano" : "30 dias";
  return {
    slug,
    name,
    description: annual
      ? `${name.replace(" Anual", "")} por 1 ano com 2 meses grátis. Benefícios em todos os servidores da rede, Java e Bedrock. Renovou antes de acabar? O tempo soma.`
      : `${name} por ${label}. Benefícios em todos os servidores da rede, Java e Bedrock. Renovou antes de acabar? O tempo soma.`,
    shortDescription: annual
      ? `${label} de ${name.replace(" Anual", "")}, equivale a R$ ${(finalPrice / 12).toFixed(2).replace(".", ",")} por mês.`
      : `${label} de ${name} em toda a rede.`,
    price: finalPrice.toFixed(2),
    originalPrice: annual ? (monthly * 12).toFixed(2) : null,
    category: "VIP",
    durationDays: days,
    benefits: JSON.stringify(benefits),
    featured,
    badge,
    color,
    order,
  };
}

const PLANS = [
  plan({ slug: "vip", name: "VIP", price: 35, color: VIP_COLOR, featured: false, badge: null, order: 1, benefits: VIP_BENEFITS, annual: false }),
  plan({ slug: "premium", name: "Premium", price: 70, color: PREMIUM_COLOR, featured: true, badge: "Mais completo", order: 2, benefits: PREMIUM_BENEFITS, annual: false }),
  plan({ slug: "vip-anual", name: "VIP Anual", price: 35, color: VIP_COLOR, featured: false, badge: null, order: 3, benefits: VIP_BENEFITS, annual: true }),
  plan({ slug: "premium-anual", name: "Premium Anual", price: 70, color: PREMIUM_COLOR, featured: true, badge: "2 meses grátis", order: 4, benefits: PREMIUM_BENEFITS, annual: true }),
];

// Combos: plano mensal + os 5 cosméticos por 30 dias, por um acréscimo bem menor
// que o preço dos cosméticos permanentes (R$ 54,50 somados). O plugin aplica os
// cosméticos como permissão temporária, que soma ao renovar e não mexe nos
// permanentes que o jogador já tiver.
const COMBO_ADDON_PRICE = 9.9;
const COMBO_COSMETICS = "Rastros de Chamas, Corações, Notas Musicais e Estrelas";

function combo(base, order) {
  const name = `${base.name} + Cosméticos`;
  const benefits = JSON.parse(base.benefits).filter((b) => b.included);
  return {
    ...base,
    slug: `${base.slug}-cosmeticos`,
    name,
    description: `${base.name} por 30 dias com todos os cosméticos da loja no mesmo período: ${COMBO_COSMETICS} e Entrada Épica. Renovou antes de acabar? O plano e os cosméticos somam.`,
    shortDescription: `${base.name} e os 5 cosméticos por 30 dias.`,
    price: (Number(base.price) + COMBO_ADDON_PRICE).toFixed(2),
    originalPrice: null,
    // Benefícios do plano primeiro (no Premium, as aulas exclusivas abrem a lista)
    benefits: JSON.stringify([
      ...benefits,
      { label: `${COMBO_COSMETICS} por 30 dias`, included: true },
      { label: "Entrada Épica por 30 dias", included: true },
    ]),
    featured: false,
    badge: "Combo",
    order,
  };
}

const COMBOS = [combo(PLANS[0], 5), combo(PLANS[1], 6)];

function sapiensPack({ slug, millions, price, badge, featured, order }) {
  const amount = millions * 1_000_000;
  const perMillion = price / millions;
  return {
    slug,
    name: `${millions}M Sapiens`,
    description: `${millions} ${millions === 1 ? "milhão" : "milhões"} de Sapiens creditados na sua conta do servidor. A moeda vale em toda a rede.`,
    shortDescription: `R$ ${perMillion.toFixed(2).replace(".", ",")} por milhão`,
    price: price.toFixed(2),
    originalPrice: null,
    category: "MOEDA",
    durationDays: null,
    benefits: JSON.stringify([
      `${amount.toLocaleString("pt-BR")} Sapiens`,
      "Creditados assim que você estiver online",
      "Vale em todos os servidores",
    ]),
    featured,
    badge,
    color: SAPIENS_COLOR,
    order,
  };
}

const SAPIENS = [
  sapiensPack({ slug: "sapiens-1m", millions: 1, price: 6, badge: null, featured: false, order: 10 }),
  sapiensPack({ slug: "sapiens-3m", millions: 3, price: 15, badge: "Popular", featured: false, order: 11 }),
  sapiensPack({ slug: "sapiens-20m", millions: 20, price: 70, badge: "Melhor valor", featured: true, order: 12 }),
];

// Cosméticos permanentes, aplicados pelo plugin da loja como permissão global
// (craftsapiens.rastro.<nome>, craftsapiens.entrada.epica). Escolhidos para
// funcionar no Bedrock: partículas que o Geyser traduz e fogos de artifício.
function cosmetic({ slug, name, description, price, color, badge, order, benefits }) {
  return {
    slug,
    name,
    description,
    shortDescription: description,
    price: price.toFixed(2),
    originalPrice: null,
    category: "COSMETICO",
    durationDays: null,
    benefits: JSON.stringify(benefits),
    featured: false,
    badge,
    color,
    order,
  };
}

const COSMETICS = [
  cosmetic({
    slug: "rastro-chamas",
    name: "Rastro de Chamas",
    description: "Deixa um rastro de fogo por onde você anda. Ligue e desligue com /rastro.",
    price: 9.9,
    color: "#FF5722",
    badge: null,
    order: 20,
    benefits: ["Permanente", "Java e Bedrock", "Troque entre os rastros que tiver com /rastro"],
  }),
  cosmetic({
    slug: "rastro-coracoes",
    name: "Rastro de Corações",
    description: "Corações flutuam atrás de você enquanto anda. Ligue e desligue com /rastro.",
    price: 9.9,
    color: "#E91E63",
    badge: null,
    order: 21,
    benefits: ["Permanente", "Java e Bedrock", "Troque entre os rastros que tiver com /rastro"],
  }),
  cosmetic({
    slug: "rastro-notas",
    name: "Rastro de Notas Musicais",
    description: "Notas coloridas acompanham seus passos. Ligue e desligue com /rastro.",
    price: 9.9,
    color: "#9C27B0",
    badge: null,
    order: 22,
    benefits: ["Permanente", "Java e Bedrock", "Troque entre os rastros que tiver com /rastro"],
  }),
  cosmetic({
    slug: "rastro-estrelas",
    name: "Rastro de Estrelas",
    description: "Um brilho branco de estrelas segue você. Ligue e desligue com /rastro.",
    price: 9.9,
    color: "#00BCD4",
    badge: "Novo",
    order: 23,
    benefits: ["Permanente", "Java e Bedrock", "Troque entre os rastros que tiver com /rastro"],
  }),
  cosmetic({
    slug: "entrada-epica",
    name: "Entrada Épica",
    description: "Fogos de artifício e um anúncio no chat toda vez que você entra no servidor.",
    price: 14.9,
    color: "#FFC107",
    badge: null,
    order: 24,
    benefits: ["Permanente", "Java e Bedrock", "Fogos ao entrar em qualquer servidor da rede", "Desligue com /entrada"],
  }),
];

const PRODUCTS = [...PLANS, ...COMBOS, ...SAPIENS, ...COSMETICS];

async function seed() {
  try {
    console.log(`Seed da Loja: ${PRODUCTS.length} produtos\n`);

    for (const product of PRODUCTS) {
      const { slug, ...data } = product;
      await prisma.product.upsert({
        where: { slug },
        update: { ...data, active: true },
        create: {
          id: `prod_${slug.replace(/-/g, "_")}`,
          slug,
          ...data,
          imageUrl: null,
          stock: -1,
          active: true,
        },
      });
      console.log(`${data.category.padEnd(9)} ${data.name.padEnd(28)} R$ ${data.price}`);
    }

    // Produtos de versões anteriores saem da vitrine, mas continuam nos pedidos antigos
    const retired = await prisma.product.updateMany({
      where: { slug: { notIn: PRODUCTS.map((p) => p.slug) }, active: true },
      data: { active: false },
    });
    if (retired.count > 0) console.log(`\n${retired.count} produto(s) antigo(s) desativado(s).`);

    console.log(`\n${PRODUCTS.length} produtos inseridos/atualizados.`);
    console.log("Lembrete: o plugin da loja precisa conhecer estes slugs (docs/plugin-entregas.md).");
  } catch (err) {
    console.error("Erro no seed da loja:", err);
    process.exitCode = 1;
  } finally {
    await disconnect();
  }
}

await seed();
