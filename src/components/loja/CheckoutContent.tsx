"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Loader2,
  ShieldCheck,
  CreditCard,
  QrCode,
  FileText,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";

interface CartProduct {
  id: string;
  name: string;
  price: string;
  category: string;
  shortDescription: string | null;
}

interface CartItemData {
  id: string;
  productId: string;
  quantity: number;
  product: CartProduct;
}

export function CheckoutContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<CartItemData[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    id: string;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/carrinho");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setSubtotal(data.subtotal);
        if (data.items.length === 0) {
          router.replace("/loja");
        }
      }
    } catch {
      setError("Erro ao carregar carrinho");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (session) fetchCart();
    else setLoading(false);
  }, [session, fetchCart]);

  const applyCoupon = async () => {
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
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(data);
        setCouponError("");
      }
    } catch {
      setCouponError("Erro ao validar cupom");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const discount = appliedCoupon
    ? subtotal * (appliedCoupon.discount / 100)
    : 0;
  const total = Math.max(subtotal - discount, 0);

  const handleCheckout = async () => {
    setProcessing(true);
    setError("");

    try {
      const res = await fetch("/api/loja/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: appliedCoupon?.code || "",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar pedido");
        setProcessing(false);
        return;
      }

      // Redirect to MercadoPago checkout
      if (data.initPoint) {
        window.location.href = data.initPoint;
      } else {
        setError("Erro ao gerar link de pagamento");
        setProcessing(false);
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setProcessing(false);
    }
  };

  if (!session) {
    return (
      <>
        <PageHero
          title="CHECKOUT"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Loja", href: "/loja" },
            { label: "Checkout" },
          ]}
        />
        <div className="mx-auto max-w-4xl px-4 pb-24 lg:px-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
            <ShoppingCart className="mx-auto h-16 w-16 text-[#A0A0A0]" />
            <p className="mt-4 text-lg text-[#A0A0A0]">
              Faça login para finalizar sua compra
            </p>
            <div className="mt-6">
              <Button href="/login?redirect=/loja/checkout">FAZER LOGIN</Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHero
        title="CHECKOUT"
        subtitle="Revise seu pedido e finalize o pagamento"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Loja", href: "/loja" },
          { label: "Carrinho", href: "/loja/carrinho" },
          { label: "Checkout" },
        ]}
      />

      <div className="mx-auto max-w-6xl px-4 pb-24 lg:px-6">
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-cs" />
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Order items */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <h3 className="text-lg font-bold text-white mb-4">
                  Itens do Pedido ({items.length})
                </h3>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-white">{item.product.name}</p>
                        {item.product.shortDescription && (
                          <p className="text-xs text-[#A0A0A0]">
                            {item.product.shortDescription}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm text-[#A0A0A0]">
                          {item.quantity}x R${" "}
                          {Number(item.product.price).toFixed(2).replace(".", ",")}
                        </p>
                        <p className="font-bold text-white">
                          R${" "}
                          {(Number(item.product.price) * item.quantity)
                            .toFixed(2)
                            .replace(".", ",")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Payment methods info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <h3 className="text-lg font-bold text-white mb-4">
                  Formas de Pagamento
                </h3>
                <p className="text-sm text-[#A0A0A0] mb-4">
                  Ao clicar em &quot;Pagar&quot;, você será redirecionado para o MercadoPago onde poderá
                  escolher a forma de pagamento.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                    <QrCode size={20} className="text-green-cs shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">PIX</p>
                      <p className="text-xs text-[#A0A0A0]">Aprovação instantânea</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                    <CreditCard size={20} className="text-blue-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">Cartão</p>
                      <p className="text-xs text-[#A0A0A0]">Até 3x sem juros</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                    <FileText size={20} className="text-yellow-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">Boleto</p>
                      <p className="text-xs text-[#A0A0A0]">Até 3 dias úteis</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Summary sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="sticky top-24 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <h3 className="text-lg font-bold text-white">
                  Resumo do Pedido
                </h3>

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
                        onClick={removeCoupon}
                        className="text-xs text-[#A0A0A0] hover:text-white"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1 flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) =>
                          setCouponCode(e.target.value.toUpperCase())
                        }
                        placeholder="CÓDIGO"
                        maxLength={50}
                        className="w-full rounded-lg border border-white/20 bg-white/5 py-2 px-3 text-sm uppercase text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="shrink-0 rounded-lg bg-white/10 px-4 text-sm font-medium text-white hover:bg-white/20 transition-colors disabled:opacity-40"
                      >
                        {couponLoading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          "Aplicar"
                        )}
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <p className="mt-1 text-xs text-error">{couponError}</p>
                  )}
                </div>

                {/* Totals */}
                <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#A0A0A0]">Subtotal</span>
                    <span className="text-white">
                      R$ {subtotal.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-cs">Desconto</span>
                      <span className="text-green-cs">
                        − R$ {discount.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-white/10 pt-3">
                    <span className="font-bold text-white">Total</span>
                    <span className="text-xl font-bold text-green-cs">
                      R$ {total.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-error/30 bg-error/5 p-3">
                    <AlertCircle size={16} className="mt-0.5 shrink-0 text-error" />
                    <p className="text-sm text-error">{error}</p>
                  </div>
                )}

                {/* Pay button */}
                <button
                  onClick={handleCheckout}
                  disabled={processing || items.length === 0}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-cs py-3 text-sm font-bold uppercase text-white transition-all hover:bg-green-dark disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      PROCESSANDO...
                    </>
                  ) : (
                    <>
                      <ExternalLink size={16} />
                      PAGAR R$ {total.toFixed(2).replace(".", ",")}
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#A0A0A0]">
                  <ShieldCheck size={14} />
                  Pagamento seguro via MercadoPago
                </div>

                <p className="mt-3 text-center text-xs text-[#A0A0A0]">
                  Ao pagar, você concorda com os{" "}
                  <Link
                    href="/termos"
                    target="_blank"
                    className="text-green-cs hover:underline"
                  >
                    Termos e Condições
                  </Link>
                </p>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
