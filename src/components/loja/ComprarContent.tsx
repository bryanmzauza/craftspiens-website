"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
  QrCode,
  ShieldCheck,
  Sparkles,
  Tag,
  UserX,
  X,
  Monitor,
  Smartphone,
} from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";
import { formatPrice, type PublicProduct } from "@/lib/products";
import { formatCpf, isValidCpf, normalizeCpf } from "@/lib/cpf";
import { CATEGORY_LABELS, comboBaseSlug, comboSlug, isCombo, productIcon } from "@/components/loja/catalog-ui";
import {
  MAX_INSTALLMENTS,
  buildInstallmentPlans,
  formatPercent,
  type InstallmentRate,
} from "@/lib/installments";

type Method = "pix" | "cartao";

type GameAccountInfo = {
  linked: boolean;
  exists: boolean;
  account: { username: string; platform: "JAVA" | "BEDROCK"; platformLabel: string } | null;
};

const METHODS: { id: Method; icon: typeof QrCode; title: string; text: string; tag?: string }[] = [
  {
    id: "pix",
    icon: QrCode,
    title: "Pix",
    text: "QR Code aqui no site. Sem juros, aprovação em segundos.",
    tag: "Recomendado",
  },
  {
    id: "cartao",
    icon: CreditCard,
    title: "Cartão",
    text: `À vista ou em até ${MAX_INSTALLMENTS}x com juros, na página segura do Mercado Pago.`,
  },
];

export function ComprarContent({ slug }: { slug: string }) {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [products, setProducts] = useState<PublicProduct[] | undefined>(undefined);
  // Produto escolhido: começa no da URL e pode trocar entre o plano e o combo com cosméticos
  const [selectedSlug, setSelectedSlug] = useState(slug);
  // Taxas de parcelamento do Mercado Pago; null quando a consulta falhou
  const [installmentRates, setInstallmentRates] = useState<InstallmentRate[] | null | undefined>(undefined);
  // Conta do jogo que recebe a entrega: existe no servidor? Java ou Bedrock?
  const [gameAccount, setGameAccount] = useState<GameAccountInfo | undefined>(undefined);
  const [method, setMethod] = useState<Method>("pix");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // CPF de quem paga: o salvo na conta aparece mascarado; "editingCpf" pede um novo
  const [savedCpf, setSavedCpf] = useState<string | null>(null);
  const [editingCpf, setEditingCpf] = useState(false);
  const [cpf, setCpf] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/loja/produtos")
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data) => {
        if (active) setProducts((data.products as PublicProduct[] | undefined) ?? []);
      })
      .catch(() => {
        if (active) setProducts([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/loja/parcelas")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active) setInstallmentRates((data?.rates as InstallmentRate[] | undefined) ?? null);
      })
      .catch(() => {
        if (active) setInstallmentRates(null);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    let active = true;
    fetch("/api/loja/conta-jogo", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active) setGameAccount(data ?? { linked: false, exists: false, account: null });
      })
      .catch(() => {
        if (active) setGameAccount({ linked: false, exists: false, account: null });
      });
    return () => {
      active = false;
    };
  }, [session]);

  useEffect(() => {
    if (!session) return;
    let active = true;
    fetch("/api/perfil", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        setSavedCpf(data.payerCpf ?? null);
        setEditingCpf(!data.payerCpf);
      })
      .catch(() => {
        if (active) setEditingCpf(true);
      });
    return () => {
      active = false;
    };
  }, [session]);

  const cpfDigits = normalizeCpf(cpf);
  const cpfInvalid = editingCpf && cpfDigits.length === 11 && !isValidCpf(cpfDigits);
  const cpfReady = editingCpf ? isValidCpf(cpfDigits) : !!savedCpf;

  const product = products === undefined ? undefined : (products.find((p) => p.slug === selectedSlug) ?? null);

  // Plano mensal com combo: oferece a troca entre os dois na mesma página
  const planSlug = comboBaseSlug(selectedSlug);
  const basePlan = products?.find((p) => p.slug === planSlug && p.category === "VIP");
  const comboPlan = products?.find((p) => p.slug === comboSlug(planSlug));
  const withCosmetics = isCombo(selectedSlug);
  const cosmeticsSeparately = (products ?? [])
    .filter((p) => p.category === "COSMETICO")
    .reduce((sum, p) => sum + p.price, 0);

  const discount = product && appliedCoupon ? product.price * (appliedCoupon.discount / 100) : 0;
  const total = product ? Math.max(Math.round((product.price - discount) * 100) / 100, 1) : 0;
  const installmentPlans = useMemo(
    () => (installmentRates ? buildInstallmentPlans(total, installmentRates) : []),
    [installmentRates, total]
  );
  const longestPlan = installmentPlans.length > 1 ? installmentPlans[installmentPlans.length - 1] : null;
  const hasNick = session?.user.nloginId != null;
  const accountMissing = hasNick && gameAccount !== undefined && !gameAccount.exists;
  const PlatformIcon = gameAccount?.account?.platform === "BEDROCK" ? Smartphone : Monitor;

  const Icon = useMemo(() => (product ? productIcon(product.category, product.slug) : QrCode), [product]);

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
        setAppliedCoupon({ code: data.code, discount: data.discount });
      }
    } catch {
      setCouponError("Erro ao validar cupom");
    } finally {
      setCouponLoading(false);
    }
  };

  const submit = async () => {
    if (!product) return;
    setProcessing(true);
    setError("");
    try {
      const res = await fetch("/api/loja/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: product.slug,
          method,
          couponCode: appliedCoupon?.code || "",
          cpf: editingCpf ? cpfDigits : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "EmailNaoVerificado") {
          router.push(`/confirmar-email?redirect=/loja/comprar/${product.slug}`);
          return;
        }
        if (data.code === "CpfObrigatorio" || data.code === "CpfInvalido") setEditingCpf(true);
        setError(data.error || "Erro ao criar o pedido");
        setProcessing(false);
        return;
      }
      if (data.method === "cartao" && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      router.push(`/loja/pedido/${data.orderId}`);
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setProcessing(false);
    }
  };

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Loja", href: "/loja" },
    { label: product?.name ?? "Comprar" },
  ];

  if (sessionStatus === "loading" || product === undefined) {
    return (
      <>
        <PageHero title="COMPRAR" breadcrumbs={breadcrumbs} />
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-cs" />
        </div>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <PageHero title="COMPRAR" breadcrumbs={breadcrumbs} />
        <div className="mx-auto max-w-4xl px-4 pb-24 lg:px-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="text-lg text-[#A0A0A0]">Entre na sua conta para comprar</p>
            <div className="mt-6">
              <Button href={`/login?redirect=/loja/comprar/${slug}`}>FAZER LOGIN</Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <PageHero title="COMPRAR" breadcrumbs={breadcrumbs} />
        <div className="mx-auto max-w-4xl px-4 pb-24 lg:px-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="text-lg text-[#A0A0A0]">Produto não encontrado ou indisponível.</p>
            <div className="mt-6">
              <Button href="/loja">VOLTAR À LOJA</Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const color = product.color || "#4CAF50";

  return (
    <>
      <PageHero title="COMPRAR" subtitle="Revise o pedido e escolha como pagar" breadcrumbs={breadcrumbs} />

      <div className="mx-auto max-w-5xl px-4 pb-24 lg:px-6">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Produto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 lg:col-span-3"
          >
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${color}22` }}
                >
                  <Icon size={32} style={{ color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color }}>
                    {CATEGORY_LABELS[product.category] ?? product.category}
                    {product.durationDays ? ` · ${product.durationDays} dias` : ""}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-white">{product.name}</h2>
                  <p className="mt-2 text-sm text-[#A0A0A0]">{product.description}</p>
                </div>
              </div>

              {product.benefits.length > 0 && (
                <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                  {product.benefits.map((benefit) => (
                    <li key={benefit.label} className="flex items-start gap-2 text-sm">
                      {benefit.included ? (
                        <Check size={16} className="mt-0.5 shrink-0 text-green-cs" />
                      ) : (
                        <X size={16} className="mt-0.5 shrink-0 text-[#A0A0A0]/40" />
                      )}
                      <span className={benefit.included ? "text-[#E0E0E0]" : "text-[#A0A0A0]/50"}>{benefit.label}</span>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-6 flex flex-wrap items-center gap-x-1 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-[#A0A0A0]">
                Entrega para o nick <strong className="text-white">{gameAccount?.account?.username ?? session.user.username}</strong>
                {gameAccount?.account && (
                  <span className="inline-flex items-center gap-1 rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                    <PlatformIcon size={11} /> {gameAccount.account.platformLabel}
                  </span>
                )}
                , feita pelo servidor quando você entra no lobby. Planos e cosméticos valem em toda a rede.
              </p>
            </div>

            {/* Combo: plano mensal + cosméticos por 30 dias */}
            {basePlan && comboPlan && (
              <button
                type="button"
                onClick={() => setSelectedSlug(withCosmetics ? basePlan.slug : comboPlan.slug)}
                aria-pressed={withCosmetics}
                className={`flex w-full items-start gap-4 rounded-xl border p-5 text-left transition-all ${
                  withCosmetics ? "border-green-cs bg-green-cs/10" : "border-dashed border-white/20 bg-white/5 hover:border-white/40"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                    withCosmetics ? "border-green-cs bg-green-cs" : "border-white/30"
                  }`}
                >
                  {withCosmetics && <Check size={14} className="text-white" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <Sparkles size={16} className="text-warning" />
                    <span className="font-bold text-white">
                      Adicionar os cosméticos por + {formatPrice(comboPlan.price - basePlan.price)}
                    </span>
                    <span className="rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-warning">
                      Combo
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-[#A0A0A0]">
                    Rastros de Chamas, Corações, Notas Musicais e Estrelas e a Entrada Épica, por 30 dias, junto com o{" "}
                    {basePlan.name}. Renovando o combo, os dias somam.
                  </span>
                  {cosmeticsSeparately > 0 && (
                    <span className="mt-1 block text-xs text-[#A0A0A0]">
                      Comprados separados, os 5 cosméticos custam {formatPrice(cosmeticsSeparately)} (permanentes).
                    </span>
                  )}
                </span>
              </button>
            )}

            {/* Conta do jogo não encontrada no servidor */}
            {accountMissing && (
              <div className="flex items-start gap-3 rounded-xl border border-error/30 bg-error/5 p-4">
                <UserX size={20} className="mt-0.5 shrink-0 text-error" />
                <div className="text-sm">
                  <p className="font-bold text-white">A conta do jogo vinculada não foi encontrada no servidor</p>
                  <p className="mt-1 text-[#A0A0A0]">
                    Entre no servidor com este nick ao menos uma vez ou vincule o nick de novo antes de comprar.
                  </p>
                  <Link href="/perfil/configuracoes" className="mt-2 inline-block font-bold text-error hover:underline">
                    Ir para Contas vinculadas
                  </Link>
                </div>
              </div>
            )}

            {/* Sem nick vinculado */}
            {!hasNick && (
              <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
                <UserX size={20} className="mt-0.5 shrink-0 text-warning" />
                <div className="text-sm">
                  <p className="font-bold text-white">Vincule seu nick do Minecraft para comprar</p>
                  <p className="mt-1 text-[#A0A0A0]">
                    A entrega é feita no jogo, por isso a conta precisa de um nick vinculado.
                  </p>
                  <Link href="/perfil/configuracoes" className="mt-2 inline-block font-bold text-warning hover:underline">
                    Ir para Contas vinculadas
                  </Link>
                </div>
              </div>
            )}

            {/* Forma de pagamento */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h3 className="mb-4 text-lg font-bold text-white">Forma de pagamento</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {METHODS.map((option) => {
                  const selected = method === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setMethod(option.id)}
                      aria-pressed={selected}
                      className={`relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                        selected ? "border-green-cs bg-green-cs/10" : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <option.icon size={22} className={`shrink-0 ${selected ? "text-green-cs" : "text-[#A0A0A0]"}`} />
                      <div>
                        <p className="font-bold text-white">
                          {option.title}
                          {option.tag && (
                            <span className="ml-2 rounded bg-green-cs/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-green-cs">
                              {option.tag}
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-[#A0A0A0]">{option.text}</p>
                      </div>
                      {selected && <Check size={16} className="absolute right-3 top-3 text-green-cs" />}
                    </button>
                  );
                })}
              </div>

              {/* Parcelas: valor de cada uma, juros e total, antes de ir para o Mercado Pago */}
              {method === "cartao" && (
                <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-bold text-white">Parcelas no cartão</p>
                  {installmentRates === undefined ? (
                    <div className="flex justify-center py-4">
                      <Loader2 size={18} className="animate-spin text-[#A0A0A0]" />
                    </div>
                  ) : installmentPlans.length === 0 ? (
                    <p className="mt-2 text-xs text-[#A0A0A0]">
                      Não foi possível carregar a simulação agora. O valor de cada parcela, os juros e o total aparecem
                      na página do Mercado Pago antes de você confirmar.
                    </p>
                  ) : (
                    <>
                      <table className="mt-3 w-full text-left text-xs">
                        <thead className="text-[#A0A0A0]">
                          <tr>
                            <th className="pb-2 font-medium">Parcelas</th>
                            <th className="pb-2 font-medium">Juros</th>
                            <th className="pb-2 text-right font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {installmentPlans.map((plan) => (
                            <tr key={plan.installments} className="border-t border-white/10 align-top">
                              <td className="py-2 pr-2 font-bold text-white">
                                {plan.installments}x de {formatPrice(plan.installmentAmount)}
                              </td>
                              <td className="py-2 pr-2 text-[#A0A0A0]">
                                {plan.interest > 0 ? (
                                  <>
                                    <span className="text-white">
                                      {formatPrice(plan.interest)} ({formatPercent(plan.rate)})
                                    </span>
                                    <span className="block">
                                      {formatPercent(plan.monthlyRate)} ao mês, {formatPercent(plan.annualRate)} ao ano
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-green-cs">Sem juros</span>
                                )}
                              </td>
                              <td className="py-2 text-right font-bold text-white">{formatPrice(plan.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {installmentPlans.length === 1 && (
                        <p className="mt-2 text-xs text-[#A0A0A0]">
                          Para este valor, o Mercado Pago só aceita o cartão à vista.
                        </p>
                      )}
                      <p className="mt-3 text-xs text-[#A0A0A0]">
                        Os juros são do Mercado Pago e só existem se você parcelar. Simulação com as taxas atuais para Visa
                        e Mastercard: você escolhe as parcelas na página do Mercado Pago e vê o valor final antes de
                        confirmar. No Pix não há juros.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Resumo */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="sticky top-24 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <h3 className="text-lg font-bold text-white">Resumo</h3>

              {/* Cupom */}
              <div className="mt-6">
                <label className="text-xs font-medium text-[#A0A0A0]">Cupom de desconto</label>
                {appliedCoupon ? (
                  <div className="mt-1 flex items-center justify-between rounded-lg border border-green-cs/30 bg-green-cs/5 px-3 py-2">
                    <span className="text-sm font-bold text-green-cs">
                      {appliedCoupon.code} ({appliedCoupon.discount}% off)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCode("");
                      }}
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
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="shrink-0 rounded-lg bg-white/10 px-4 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-40"
                    >
                      {couponLoading ? <Loader2 size={14} className="animate-spin" /> : "Aplicar"}
                    </button>
                  </div>
                )}
                {couponError && <p className="mt-1 text-xs text-error">{couponError}</p>}
              </div>

              {/* CPF */}
              <div className="mt-6">
                <label htmlFor="comprar-cpf" className="text-xs font-medium text-[#A0A0A0]">
                  CPF de quem vai pagar
                </label>
                {!editingCpf && savedCpf ? (
                  <div className="mt-1 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-white">{savedCpf}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCpf(true);
                        setCpf("");
                      }}
                      className="text-xs text-[#A0A0A0] hover:text-white"
                    >
                      Trocar
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      id="comprar-cpf"
                      inputMode="numeric"
                      autoComplete="off"
                      value={cpf}
                      onChange={(e) => setCpf(formatCpf(e.target.value))}
                      placeholder="000.000.000-00"
                      className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
                    />
                    {cpfInvalid && <p className="mt-1 text-xs text-error">CPF inválido. Confira os números.</p>}
                    {savedCpf && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCpf(false);
                          setCpf("");
                        }}
                        className="mt-1 text-xs text-[#A0A0A0] hover:text-white"
                      >
                        Usar o CPF salvo ({savedCpf})
                      </button>
                    )}
                  </>
                )}
                <p className="mt-1 text-xs text-[#A0A0A0]">
                  Pode ser do aluno ou de um responsável. Vai para o Mercado Pago e fica salvo na conta.
                </p>
              </div>

              {/* Totais */}
              <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[#A0A0A0]">{product.name}</span>
                  <span className="text-white">{formatPrice(product.price)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-cs">Desconto</span>
                    <span className="text-green-cs">- {formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-white/10 pt-3">
                  <span className="font-bold text-white">{method === "cartao" ? "Total à vista" : "Total"}</span>
                  <span className="text-xl font-bold text-green-cs">{formatPrice(total)}</span>
                </div>
                {method === "cartao" && longestPlan && (
                  <p className="text-right text-xs text-[#A0A0A0]">
                    ou {longestPlan.installments}x de {formatPrice(longestPlan.installmentAmount)} com juros (total{" "}
                    {formatPrice(longestPlan.total)})
                  </p>
                )}
              </div>

              <label className="mt-6 flex cursor-pointer items-start gap-2">
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
                  . Tenho 16 anos ou mais, ou a compra é feita por um responsável.
                </span>
              </label>

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-error/30 bg-error/5 p-3">
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-error" />
                  <p className="text-sm text-error">{error}</p>
                </div>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={processing || !cpfReady || !termsAccepted || !hasNick || accountMissing || !product.inStock}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-cs py-3 text-sm font-bold uppercase text-white transition-all hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                {processing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processando...
                  </>
                ) : method === "pix" ? (
                  <>
                    <QrCode size={16} />
                    Gerar Pix de {formatPrice(total)}
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    Pagar {formatPrice(total)} no cartão
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#A0A0A0]">
                <ShieldCheck size={14} />
                Pagamento processado pelo Mercado Pago
              </div>

              <Link href="/loja" className="mt-4 inline-flex items-center gap-1 text-sm text-green-cs hover:underline">
                <ArrowLeft size={14} /> Voltar à loja
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
