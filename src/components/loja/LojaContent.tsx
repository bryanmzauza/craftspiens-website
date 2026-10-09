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
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { PublicProduct } from "@/lib/products";

type ProductCategory = PublicProduct["category"];

const DEFAULT_COLOR = "#4CAF50";

const CATEGORY_ICONS: Record<ProductCategory, typeof Crown> = {
  VIP: Crown,
  RANK: Star,
  COSMETICO: Sparkles,
  MOEDA: Coins,
  KIT: Package,
};

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  VIP: "VIP/Premium",
  RANK: "Ranks",
  COSMETICO: "Cosméticos",
  MOEDA: "Moedas",
  KIT: "Kits",
};

const CATEGORIES: (ProductCategory | "todos")[] = ["todos", "RANK", "COSMETICO", "MOEDA", "KIT"];

function formatPrice(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export function LojaContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [categoriaAtiva, setCategoriaAtiva] = useState<ProductCategory | "todos">("todos");
  const [cartItemCount, setCartItemCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/loja/produtos");
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products ?? []);
        }
      } catch {
        // silently fail — mostra estado vazio
      } finally {
        setLoadingProducts(false);
      }
    }
    fetchProducts();
  }, []);

  const vipProducts = useMemo(
    () => products.filter((p) => p.category === "VIP"),
    [products]
  );

  const otherProducts = useMemo(
    () => products.filter((p) => p.category !== "VIP"),
    [products]
  );

  const filteredProducts = useMemo(() => {
    if (categoriaAtiva === "todos") return otherProducts;
    return otherProducts.filter((p) => p.category === categoriaAtiva);
  }, [categoriaAtiva, otherProducts]);

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

  /** Adiciona ao carrinho; retorna true se o item foi adicionado */
  const addToCart = async (productId: string): Promise<boolean> => {
    if (!session) {
      router.push("/login?redirect=/loja");
      return false;
    }
    setAddingId(productId);
    try {
      const res = await fetch("/api/carrinho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) await fetchCartSummary();
      return res.ok;
    } catch {
      // silently fail
      return false;
    } finally {
      setAddingId(null);
    }
  };

  // VIP: adiciona ao carrinho e segue direto para o carrinho
  const buyVip = async (productId: string) => {
    if (await addToCart(productId)) router.push("/loja/carrinho");
  };

  return (
    <>
      <PageHero
        title="LOJA"
        subtitle="Itens exclusivos e planos Premium para turbinar sua experiência."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Loja" }]}
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        {loadingProducts ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-green-cs" />
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-bg-card/50 p-12 text-center">
            <Package size={40} className="mx-auto mb-3 text-[#A0A0A0] opacity-40" />
            <p className="text-[#A0A0A0]">Nenhum produto disponível no momento. Volte em breve!</p>
          </div>
        ) : (
          <>
            {/* Planos VIP */}
            {vipProducts.length > 0 && (
              <section className="mb-16">
                <div className="mb-8 text-center">
                  <SectionTitle>PLANOS VIP / PREMIUM</SectionTitle>
                  <p className="mt-3 text-[#A0A0A0]">
                    Escolha o plano ideal e turbine sua experiência no servidor.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  {vipProducts.map((plan, i) => {
                    const cor = plan.color || DEFAULT_COLOR;
                    const destaque = plan.featured;
                    const adding = addingId === plan.id;
                    return (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className={`relative overflow-hidden rounded-2xl border p-6 ${
                          destaque
                            ? "border-2 bg-bg-card/80"
                            : "border-white/10 bg-bg-card/50"
                        }`}
                        style={destaque ? { borderColor: cor } : {}}
                      >
                        {destaque && (
                          <div
                            className="absolute left-0 right-0 top-0 py-1 text-center text-xs font-bold uppercase text-white"
                            style={{ backgroundColor: cor }}
                          >
                            ⭐ {plan.badge || "Mais popular"}
                          </div>
                        )}

                        <div className={destaque ? "mt-6" : ""}>
                          <div
                            className="mb-4 inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl"
                            style={{ backgroundColor: `${cor}20` }}
                          >
                            {plan.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element -- imagem de produto com host arbitrário
                              <img src={plan.imageUrl} alt={plan.name} className="h-full w-full object-cover" />
                            ) : (
                              <Crown size={24} style={{ color: cor }} />
                            )}
                          </div>

                          {!destaque && plan.badge && (
                            <span
                              className="mb-2 ml-2 inline-block rounded px-2 py-0.5 align-top text-[10px] font-bold uppercase text-white"
                              style={{ backgroundColor: cor }}
                            >
                              {plan.badge}
                            </span>
                          )}

                          <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                          <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-3xl font-bold" style={{ color: cor }}>
                              {formatPrice(plan.price)}
                            </span>
                            {!!plan.durationDays && (
                              <span className="text-sm text-[#A0A0A0]">/{plan.durationDays} dias</span>
                            )}
                          </div>
                          {!!plan.originalPrice && (
                            <span className="text-xs text-[#A0A0A0] line-through">
                              {formatPrice(plan.originalPrice)}
                            </span>
                          )}

                          {plan.benefits.length > 0 ? (
                            <ul className="mt-6 space-y-3">
                              {plan.benefits.map((feat) => (
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
                          ) : (
                            <p className="mt-6 text-sm text-[#E0E0E0]">
                              {plan.shortDescription || plan.description}
                            </p>
                          )}

                          <button
                            onClick={() => buyVip(plan.id)}
                            disabled={adding || !plan.inStock}
                            className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold uppercase text-white transition-all hover:shadow-lg disabled:opacity-60"
                            style={{ backgroundColor: cor }}
                          >
                            {adding && <Loader2 size={16} className="animate-spin" />}
                            {!plan.inStock
                              ? "Esgotado"
                              : adding
                              ? "Adicionando..."
                              : plan.durationDays
                              ? `Comprar (${plan.durationDays} dias)`
                              : "Comprar"}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Produtos */}
            {otherProducts.length > 0 && (
              <section>
                <div className="mb-8">
                  <SectionTitle>PRODUTOS</SectionTitle>
                </div>

                {/* Categorias (apenas as que têm produtos) */}
                <div className="mb-6 flex flex-wrap gap-2">
                  {CATEGORIES.filter(
                    (cat) => cat === "todos" || otherProducts.some((p) => p.category === cat)
                  ).map((cat) => {
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
                    const CatIcon = CATEGORY_ICONS[product.category];
                    const cor = product.color || DEFAULT_COLOR;
                    const adding = addingId === product.id;
                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="group overflow-hidden rounded-xl border border-white/10 bg-bg-card/50 p-4 transition-all hover:border-white/20 hover:shadow-lg"
                      >
                        {/* Imagem do produto (ícone da categoria quando não houver) */}
                        <div
                          className="mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-lg"
                          style={{ backgroundColor: `${cor}10` }}
                        >
                          {product.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- imagem de produto com host arbitrário
                            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <CatIcon size={40} style={{ color: cor }} className="opacity-40" />
                          )}
                        </div>

                        {/* Badges */}
                        {product.badge && (
                          <span
                            className="mb-2 inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                            style={{ backgroundColor: cor }}
                          >
                            {product.badge}
                          </span>
                        )}

                        <h3 className="font-bold text-white">{product.name}</h3>
                        <p className="mt-1 text-xs text-[#A0A0A0] line-clamp-2">
                          {product.shortDescription || product.description}
                        </p>

                        <div className="mt-3 flex items-baseline gap-2">
                          <span className="text-lg font-bold text-green-cs">
                            {formatPrice(product.price)}
                          </span>
                          {!!product.originalPrice && (
                            <span className="text-xs text-[#A0A0A0] line-through">
                              {formatPrice(product.originalPrice)}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => addToCart(product.id)}
                          disabled={adding || !product.inStock}
                          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-green-cs/10 py-2 text-sm font-bold text-green-cs transition-all hover:bg-green-cs hover:text-white disabled:opacity-60"
                        >
                          {adding ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <ShoppingCart size={16} />
                          )}
                          {!product.inStock ? "Esgotado" : adding ? "Adicionando..." : "Adicionar"}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

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
                  {formatPrice(cartTotal)}
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
