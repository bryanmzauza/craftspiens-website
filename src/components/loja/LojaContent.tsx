"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Star,
  Sparkles,
  Coins,
  Package,
  ShoppingCart,
  Check,
  X,
  Gem,
  Zap,
  Shield,
  HeadphonesIcon,
} from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";

type ProductCategory = "vip" | "rank" | "cosmetico" | "moeda" | "kit";

interface Product {
  id: number;
  nome: string;
  descricaoCurta: string;
  preco: number;
  precoOriginal?: number;
  categoria: ProductCategory;
  cor: string;
  badge?: string;
  beneficios: string[];
}

interface VipPlan {
  id: string;
  nome: string;
  preco: number;
  cor: string;
  icon: typeof Crown;
  popular?: boolean;
  features: { label: string; included: boolean }[];
}

const VIP_PLANS: VipPlan[] = [
  {
    id: "vip",
    nome: "VIP",
    preco: 19.9,
    cor: "#4CAF50",
    icon: Star,
    features: [
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
    id: "vip-plus",
    nome: "VIP+",
    preco: 29.9,
    cor: "#FFD700",
    icon: Crown,
    popular: true,
    features: [
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
    id: "premium",
    nome: "Premium",
    preco: 49.9,
    cor: "#9C27B0",
    icon: Gem,
    features: [
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

const PRODUCTS: Product[] = [
  {
    id: 1,
    nome: "Rank Gold",
    descricaoCurta: "Título dourado exclusivo no chat e tablist do servidor.",
    preco: 19.9,
    categoria: "rank",
    cor: "#FFD700",
    beneficios: ["Prefixo [Gold] no chat", "Cor dourada no tablist", "Acesso a /fly em lobby"],
  },
  {
    id: 2,
    nome: "Rank Diamond",
    descricaoCurta: "Título diamante com efeitos especiais e comandos extras.",
    preco: 34.9,
    categoria: "rank",
    cor: "#00BCD4",
    badge: "POPULAR",
    beneficios: ["Prefixo [Diamond] no chat", "Partículas de diamante", "Acesso a /fly"],
  },
  {
    id: 3,
    nome: "Trail Fire",
    descricaoCurta: "Trilha de partículas de fogo ao caminhar.",
    preco: 9.9,
    categoria: "cosmetico",
    cor: "#FF5722",
    badge: "NOVO",
    beneficios: ["Partículas de fogo ao andar", "Toggle on/off com comando"],
  },
  {
    id: 4,
    nome: "Trail Stars",
    descricaoCurta: "Trilha de estrelas brilhantes que seguem seus passos.",
    preco: 9.9,
    categoria: "cosmetico",
    cor: "#FFC107",
    beneficios: ["Partículas de estrelas ao andar", "Toggle on/off com comando"],
  },
  {
    id: 5,
    nome: "500 Moedas SAPIENS",
    descricaoCurta: "Pacote de 500 moedas para usar no servidor.",
    preco: 14.9,
    categoria: "moeda",
    cor: "#4CAF50",
    beneficios: ["500 moedas creditadas instantaneamente", "Use na loja in-game"],
  },
  {
    id: 6,
    nome: "1.500 Moedas SAPIENS",
    descricaoCurta: "Pacote de 1.500 moedas com bônus de 20%.",
    preco: 39.9,
    precoOriginal: 44.7,
    categoria: "moeda",
    cor: "#4CAF50",
    badge: "MAIS VENDIDO",
    beneficios: ["1.500 moedas (inclui 250 bônus)", "Use na loja in-game"],
  },
  {
    id: 7,
    nome: "Kit Iniciante",
    descricaoCurta: "Ferramentas e itens essenciais para começar no servidor.",
    preco: 12.9,
    categoria: "kit",
    cor: "#795548",
    beneficios: ["Armadura de ferro completa", "Ferramentas de diamante", "64 steaks", "32 blocos variados"],
  },
  {
    id: 8,
    nome: "Kit Aventureiro",
    descricaoCurta: "Equipamento avançado para explorar e construir.",
    preco: 24.9,
    categoria: "kit",
    cor: "#FF9800",
    beneficios: ["Armadura de diamante", "Ferramentas de netherite", "Elytra + fogos", "Stack de materiais"],
  },
];

const CATEGORY_ICONS: Record<ProductCategory, typeof Crown> = {
  vip: Crown,
  rank: Star,
  cosmetico: Sparkles,
  moeda: Coins,
  kit: Package,
};

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  vip: "VIP/Premium",
  rank: "Ranks",
  cosmetico: "Cosméticos",
  moeda: "Moedas",
  kit: "Kits",
};

const CATEGORIES: (ProductCategory | "todos")[] = ["todos", "rank", "cosmetico", "moeda", "kit"];

export function LojaContent() {
  const [categoriaAtiva, setCategoriaAtiva] = useState<ProductCategory | "todos">("todos");
  const [carrinho, setCarrinho] = useState<Map<number, number>>(new Map());
  const [showCarrinho, setShowCarrinho] = useState(false);

  const filteredProducts = useMemo(() => {
    if (categoriaAtiva === "todos") return PRODUCTS;
    return PRODUCTS.filter((p) => p.categoria === categoriaAtiva);
  }, [categoriaAtiva]);

  const addToCart = (productId: number) => {
    setCarrinho((prev) => {
      const next = new Map(prev);
      next.set(productId, (next.get(productId) || 0) + 1);
      return next;
    });
  };

  const removeFromCart = (productId: number) => {
    setCarrinho((prev) => {
      const next = new Map(prev);
      next.delete(productId);
      return next;
    });
  };

  const cartTotal = useMemo(() => {
    let total = 0;
    carrinho.forEach((qty, id) => {
      const product = PRODUCTS.find((p) => p.id === id);
      if (product) total += product.preco * qty;
    });
    return total;
  }, [carrinho]);

  const cartItemCount = useMemo(() => {
    let count = 0;
    carrinho.forEach((qty) => (count += qty));
    return count;
  }, [carrinho]);

  return (
    <>
      <PageHero
        title="LOJA"
        subtitle="Itens exclusivos e planos Premium para turbinar sua experiência."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Loja" }]}
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        {/* Planos VIP */}
        <section className="mb-16">
          <div className="mb-8 text-center">
            <SectionTitle>PLANOS VIP / PREMIUM</SectionTitle>
            <p className="mt-3 text-[#A0A0A0]">
              Escolha o plano ideal e turbine sua experiência no servidor.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {VIP_PLANS.map((plan, i) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative overflow-hidden rounded-2xl border p-6 ${
                    plan.popular
                      ? "border-2 bg-bg-card/80"
                      : "border-white/10 bg-bg-card/50"
                  }`}
                  style={
                    plan.popular ? { borderColor: plan.cor } : {}
                  }
                >
                  {plan.popular && (
                    <div
                      className="absolute left-0 right-0 top-0 py-1 text-center text-xs font-bold text-white"
                      style={{ backgroundColor: plan.cor }}
                    >
                      ⭐ MAIS POPULAR
                    </div>
                  )}

                  <div className={plan.popular ? "mt-6" : ""}>
                    <div
                      className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${plan.cor}20` }}
                    >
                      <Icon size={24} style={{ color: plan.cor }} />
                    </div>

                    <h3 className="text-xl font-bold text-white">{plan.nome}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-bold" style={{ color: plan.cor }}>
                        R$ {plan.preco.toFixed(2).replace(".", ",")}
                      </span>
                      <span className="text-sm text-[#A0A0A0]">/mês</span>
                    </div>

                    <ul className="mt-6 space-y-3">
                      {plan.features.map((feat) => (
                        <li key={feat.label} className="flex items-center gap-2 text-sm">
                          {feat.included ? (
                            <Check size={16} className="shrink-0 text-green-cs" />
                          ) : (
                            <X size={16} className="shrink-0 text-[#A0A0A0]/40" />
                          )}
                          <span className={feat.included ? "text-[#E0E0E0]" : "text-[#A0A0A0]/50"}>
                            {feat.label}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button
                      className="mt-6 w-full rounded-xl py-3 text-sm font-bold uppercase text-white transition-all hover:shadow-lg"
                      style={{ backgroundColor: plan.cor }}
                    >
                      Assinar {plan.nome}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Produtos */}
        <section>
          <div className="mb-8">
            <SectionTitle>PRODUTOS</SectionTitle>
          </div>

          {/* Categorias */}
          <div className="mb-6 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const label = cat === "todos" ? "Todos" : CATEGORY_LABELS[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setCategoriaAtiva(cat)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    categoriaAtiva === cat
                      ? "bg-green-cs/20 text-green-cs"
                      : "text-[#A0A0A0] hover:text-white"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Grid de produtos */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product, i) => {
              const CatIcon = CATEGORY_ICONS[product.categoria];
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="group overflow-hidden rounded-xl border border-white/10 bg-bg-card/50 p-4 transition-all hover:border-white/20 hover:shadow-lg"
                >
                  {/* Imagem placeholder */}
                  <div
                    className="mb-3 flex aspect-square items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${product.cor}10` }}
                  >
                    <CatIcon size={40} style={{ color: product.cor }} className="opacity-40" />
                  </div>

                  {/* Badges */}
                  {product.badge && (
                    <span
                      className="mb-2 inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                      style={{ backgroundColor: product.cor }}
                    >
                      {product.badge}
                    </span>
                  )}

                  <h3 className="font-bold text-white">{product.nome}</h3>
                  <p className="mt-1 text-xs text-[#A0A0A0] line-clamp-2">{product.descricaoCurta}</p>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-green-cs">
                      R$ {product.preco.toFixed(2).replace(".", ",")}
                    </span>
                    {product.precoOriginal && (
                      <span className="text-xs text-[#A0A0A0] line-through">
                        R$ {product.precoOriginal.toFixed(2).replace(".", ",")}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => addToCart(product.id)}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-green-cs/10 py-2 text-sm font-bold text-green-cs transition-all hover:bg-green-cs hover:text-white"
                  >
                    <ShoppingCart size={16} /> Adicionar
                  </button>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Floating Cart Bar */}
        <AnimatePresence>
          {cartItemCount > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2"
            >
              <button
                onClick={() => setShowCarrinho(true)}
                className="flex items-center gap-4 rounded-2xl border border-green-cs/30 bg-bg-primary/95 px-6 py-3 shadow-2xl backdrop-blur-xl transition-all hover:border-green-cs/60"
              >
                <div className="relative">
                  <ShoppingCart size={20} className="text-green-cs" />
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-cs text-[10px] font-bold text-white">
                    {cartItemCount}
                  </span>
                </div>
                <span className="text-sm text-white">
                  R$ {cartTotal.toFixed(2).replace(".", ",")}
                </span>
                <span className="rounded-lg bg-green-cs px-4 py-1.5 text-sm font-bold text-white">
                  Ver Carrinho
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart Modal */}
        <AnimatePresence>
          {showCarrinho && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
              onClick={() => setShowCarrinho(false)}
            >
              <div className="absolute inset-0 bg-black/70" />
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg rounded-t-2xl border border-white/10 bg-bg-primary p-6 sm:rounded-2xl"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-[family-name:var(--font-press-start)] text-sm text-white">
                    SEU CARRINHO
                  </h2>
                  <button
                    onClick={() => setShowCarrinho(false)}
                    className="text-[#A0A0A0] transition-colors hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                {cartItemCount === 0 ? (
                  <p className="py-8 text-center text-sm text-[#A0A0A0]">Carrinho vazio</p>
                ) : (
                  <>
                    <div className="max-h-64 space-y-3 overflow-y-auto">
                      {Array.from(carrinho.entries()).map(([productId, qty]) => {
                        const product = PRODUCTS.find((p) => p.id === productId);
                        if (!product) return null;
                        return (
                          <div
                            key={productId}
                            className="flex items-center justify-between rounded-lg border border-white/10 p-3"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-white">{product.nome}</p>
                              <p className="text-xs text-[#A0A0A0]">
                                {qty}x R$ {product.preco.toFixed(2).replace(".", ",")}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-green-cs">
                                R$ {(product.preco * qty).toFixed(2).replace(".", ",")}
                              </span>
                              <button
                                onClick={() => removeFromCart(productId)}
                                className="text-[#A0A0A0] transition-colors hover:text-error"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 border-t border-white/10 pt-4">
                      <div className="flex items-center justify-between text-lg font-bold">
                        <span className="text-white">Total:</span>
                        <span className="text-green-cs">
                          R$ {cartTotal.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                      <button className="mt-4 w-full rounded-xl bg-green-cs py-3 text-sm font-bold uppercase text-white transition-all hover:bg-green-dark hover:shadow-lg">
                        Finalizar Compra
                      </button>
                      <p className="mt-2 text-center text-xs text-[#A0A0A0]">
                        Você será redirecionado para o checkout seguro.
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
