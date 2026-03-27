"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  Loader2,
  ArrowLeft,
  Tag,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHero } from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";

interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  originalPrice: string | null;
  category: string;
  imageUrl: string | null;
  shortDescription: string | null;
  badge: string | null;
  color: string | null;
}

interface CartItemData {
  id: string;
  productId: string;
  quantity: number;
  product: CartProduct;
}

const CATEGORY_COLORS: Record<string, string> = {
  VIP: "#FFD700",
  RANK: "#2196F3",
  COSMETICO: "#9C27B0",
  MOEDA: "#4CAF50",
  KIT: "#FF9800",
};

export function CarrinhoContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<CartItemData[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/carrinho");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setSubtotal(data.subtotal);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) fetchCart();
    else setLoading(false);
  }, [session, fetchCart]);

  const updateQuantity = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    setUpdating(itemId);
    try {
      const res = await fetch(`/api/carrinho/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (res.ok) await fetchCart();
    } catch {
      // silently fail
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdating(itemId);
    try {
      const res = await fetch(`/api/carrinho/${itemId}`, { method: "DELETE" });
      if (res.ok) await fetchCart();
    } catch {
      // silently fail
    } finally {
      setUpdating(null);
    }
  };

  if (!session) {
    return (
      <>
        <PageHero
          title="CARRINHO"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Loja", href: "/loja" },
            { label: "Carrinho" },
          ]}
        />
        <div className="mx-auto max-w-4xl px-4 pb-24 lg:px-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
            <ShoppingCart className="mx-auto h-16 w-16 text-[#A0A0A0]" />
            <p className="mt-4 text-lg text-[#A0A0A0]">
              Faça login para acessar seu carrinho
            </p>
            <div className="mt-6">
              <Button href="/login?redirect=/loja/carrinho">FAZER LOGIN</Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHero
        title="CARRINHO"
        subtitle={items.length > 0 ? `${items.length} ${items.length === 1 ? "item" : "itens"} no carrinho` : undefined}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Loja", href: "/loja" },
          { label: "Carrinho" },
        ]}
      />

      <div className="mx-auto max-w-6xl px-4 pb-24 lg:px-6">
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-cs" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
            <ShoppingCart className="mx-auto h-16 w-16 text-[#A0A0A0]" />
            <p className="mt-4 text-lg text-[#A0A0A0]">Seu carrinho está vazio</p>
            <p className="mt-2 text-sm text-[#A0A0A0]">
              Explore a loja e adicione itens ao seu carrinho.
            </p>
            <div className="mt-6">
              <Button href="/loja">VER PRODUTOS</Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Items list */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                  >
                    {/* Product icon */}
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${item.product.color || "#4CAF50"}20`,
                      }}
                    >
                      <span
                        className="text-xs font-bold uppercase"
                        style={{ color: CATEGORY_COLORS[item.product.category] || "#4CAF50" }}
                      >
                        {item.product.category.slice(0, 3)}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">
                        {item.product.name}
                      </h4>
                      {item.product.shortDescription && (
                        <p className="text-xs text-[#A0A0A0] truncate">
                          {item.product.shortDescription}
                        </p>
                      )}
                      <p className="mt-1 text-sm font-bold text-green-cs">
                        R$ {Number(item.product.price).toFixed(2).replace(".", ",")}
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || updating === item.id}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-[#A0A0A0] hover:border-white/20 hover:text-white disabled:opacity-40"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-white">
                        {updating === item.id ? (
                          <Loader2 size={14} className="mx-auto animate-spin" />
                        ) : (
                          item.quantity
                        )}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={updating === item.id}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-[#A0A0A0] hover:border-white/20 hover:text-white disabled:opacity-40"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Subtotal per item */}
                    <div className="hidden w-24 text-right sm:block">
                      <p className="text-sm font-bold text-white">
                        R$ {(Number(item.product.price) * item.quantity).toFixed(2).replace(".", ",")}
                      </p>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={updating === item.id}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-error/60 hover:bg-error/10 hover:text-error transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              <Link
                href="/loja"
                className="mt-4 inline-flex items-center gap-2 text-sm text-green-cs hover:underline"
              >
                <ArrowLeft size={16} />
                Continuar comprando
              </Link>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <h3 className="text-lg font-bold text-white">Resumo do Pedido</h3>

                {/* Coupon */}
                <div className="mt-6">
                  <label className="text-xs font-medium text-[#A0A0A0]">
                    Cupom de desconto
                  </label>
                  {appliedCoupon ? (
                    <div className="mt-1 flex items-center justify-between rounded-lg border border-green-cs/30 bg-green-cs/5 px-3 py-2">
                      <span className="text-sm font-bold text-green-cs">
                        {appliedCoupon.code} ({appliedCoupon.discount}% off)
                      </span>
                      <button
                        onClick={() => { setAppliedCoupon(null); setCouponCode(""); setCouponError(""); }}
                        className="text-xs text-[#A0A0A0] hover:text-white"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1 flex gap-2">
                      <div className="relative flex-1">
                        <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]" />
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="CÓDIGO"
                          maxLength={50}
                          className="w-full rounded-lg border border-white/20 bg-white/5 py-2 pl-9 pr-3 text-sm uppercase text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          if (!couponCode.trim()) return;
                          setCouponError("");
                          setCouponLoading(true);
                          try {
                            const res = await fetch("/api/cupons/validar", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ code: couponCode }),
                            });
                            const data = await res.json();
                            if (!res.ok) {
                              setCouponError(data.error || "Cupom inválido");
                            } else {
                              setAppliedCoupon({ code: data.code, discount: data.discount });
                              setCouponError("");
                            }
                          } catch { setCouponError("Erro ao validar"); }
                          finally { setCouponLoading(false); }
                        }}
                        disabled={couponLoading || !couponCode.trim()}
                        className="rounded-lg bg-white/10 px-4 text-sm font-medium text-white hover:bg-white/20 transition-colors disabled:opacity-40"
                      >
                        {couponLoading ? <Loader2 size={14} className="animate-spin" /> : "Aplicar"}
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <p className="mt-1 text-xs text-error">{couponError}</p>
                  )}
                </div>

                {/* Totals */}
                {(() => {
                  const discountValue = appliedCoupon ? subtotal * (appliedCoupon.discount / 100) : 0;
                  const totalValue = Math.max(subtotal - discountValue, 0);
                  return (
                    <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#A0A0A0]">Subtotal</span>
                        <span className="text-white">
                          R$ {subtotal.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                      {discountValue > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-cs">Desconto</span>
                          <span className="text-green-cs">− R$ {discountValue.toFixed(2).replace(".", ",")}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-white/10 pt-3">
                        <span className="font-bold text-white">Total</span>
                        <span className="text-xl font-bold text-green-cs">
                          R$ {totalValue.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Terms */}
                <label className="mt-6 flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 accent-green-cs"
                  />
                  <span className="text-xs text-[#A0A0A0]">
                    Li e concordo com os{" "}
                    <Link href="/termos" target="_blank" className="text-green-cs hover:underline">
                      Termos e Condições
                    </Link>
                  </span>
                </label>

                {/* Checkout button */}
                <button
                  onClick={() => router.push("/loja/checkout")}
                  disabled={!termsAccepted || items.length === 0}
                  className="mt-4 w-full rounded-xl bg-green-cs py-3 text-sm font-bold uppercase text-white transition-all hover:bg-green-dark disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  FINALIZAR COMPRA
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#A0A0A0]">
                  <ShieldCheck size={14} />
                  Pagamento seguro via MercadoPago
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
