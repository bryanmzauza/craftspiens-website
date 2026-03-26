"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  const { data: session } = useSession();
  const router = useRouter();
  const [categoriaAtiva, setCategoriaAtiva] = useState<ProductCategory | "todos">("todos");
  const [cartItemCount, setCartItemCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [addingId, setAddingId] = useState<number | null>(null);

  const filteredProducts = useMemo(() => {
    if (categoriaAtiva === "todos") return PRODUCTS;
    return PRODUCTS.filter((p) => p.categoria === categoriaAtiva);
  }, [categoriaAtiva]);

  const fetchCartSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/carrinho");
      if (res.ok) {
        const data = await res.json();
        setCartItemCount(data.itemCount);
        setCartTotal(data.subtotal);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (session) fetchCartSummary();
  }, [session, fetchCartSummary]);

  const addToCart = async (productId: number) => {
    if (!session) {
      router.push("/login?redirect=/loja");
      return;
    }
    setAddingId(productId);
    try {
      const res = await fetch("/api/carrinho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: String(productId) }),
      });
      if (res.ok) await fetchCartSummary();
    } catch {
      // silently fail
    } finally {
      setAddingId(null);
    }
  };

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
                    disabled={addingId === product.id}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-green-cs/10 py-2 text-sm font-bold text-green-cs transition-all hover:bg-green-cs hover:text-white disabled:opacity-60"
                  >
                    {addingId === product.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ShoppingCart size={16} />
                    )}
                    {addingId === product.id ? "Adicionando..." : "Adicionar"}
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
              <Link
                href="/loja/carrinho"
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
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
