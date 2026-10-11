"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check,
  X,
  Crown,
  Sparkles,
  Loader2,
  Package,
  QrCode,
  Zap,
  Server,
  ChevronDown,
  Smartphone,
  Monitor,
} from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { formatPrice, type PublicProduct } from "@/lib/products";
import { comboBaseSlug, comboSlug, cosmeticIcon, isCombo, planFamily, type PlanFamily } from "@/components/loja/catalog-ui";
import moedaSapiens from "@/assets/brand/moeda-sapiens.webp";

const DEFAULT_COLOR = "#4CAF50";
const MONTHS_IN_YEAR = 12;

type Billing = "mensal" | "anual";

function isAnnual(product: PublicProduct): boolean {
  return (product.durationDays ?? 0) >= 360;
}

const STEPS = [
  {
    icon: QrCode,
    title: "Escolha e pague com Pix",
    text: "O QR Code aparece aqui no site. Também dá para pagar com cartão, à vista ou em até 3x com juros.",
  },
  {
    icon: Zap,
    title: "Aprovação em segundos",
    text: "O Pix é confirmado na hora e o pedido muda sozinho para aprovado.",
  },
  {
    icon: Server,
    title: "Entrega em toda a rede",
    text: "VIP, Premium e cosméticos valem em todos os servidores, no Java e no Bedrock.",
  },
];

const FAQ = [
  {
    q: "Como recebo o que comprei?",
    a: "A entrega é automática. Planos e cosméticos são aplicados em até um minuto, mesmo com você offline. Sapiens caem na sua conta assim que você estiver online no servidor.",
  },
  {
    q: "Funciona no Bedrock (celular, tablet, console e Windows)?",
    a: "Sim. Os planos, os Sapiens e os cosméticos desta loja foram escolhidos para funcionar nas duas edições. Basta ter o nick vinculado à sua conta do site.",
  },
  {
    q: "O que acontece se eu renovar antes de acabar?",
    a: "O tempo soma. Se faltam 10 dias de VIP e você compra mais 30, ficam 40 dias.",
  },
  {
    q: "Posso pagar com cartão?",
    a: "Sim, pelo Mercado Pago, à vista ou em até 3 parcelas. O parcelamento tem juros do Mercado Pago, e a página de compra mostra o valor de cada parcela, os juros e o total antes de você pagar. O Pix é a opção recomendada: sem juros e aprovação imediata.",
  },
  {
    q: "Tenho menos de 16 anos, posso comprar?",
    a: "A compra precisa ser feita por um responsável, com o CPF dele. Veja os Termos e Condições.",
  },
];

export function LojaContent() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<Billing>("mensal");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    let active = true;
    fetch("/api/loja/produtos")
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data) => {
        if (active) setProducts(data.products ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const plans = useMemo(() => products.filter((p) => p.category === "VIP" && !isCombo(p.slug)), [products]);
  // Combo com cosméticos, oferecido no card do plano mensal correspondente
  const combosByPlan = useMemo(() => {
    const map = new Map<string, PublicProduct>();
    for (const p of products) if (isCombo(p.slug)) map.set(comboBaseSlug(p.slug), p);
    return map;
  }, [products]);
  const hasAnnual = useMemo(() => plans.some(isAnnual), [plans]);
  const visiblePlans = useMemo(() => {
    const wanted = billing === "anual" && hasAnnual;
    const list = plans.filter((p) => isAnnual(p) === wanted);
    const order: PlanFamily[] = ["vip", "premium"];
    return list.sort((a, b) => order.indexOf(planFamily(a.slug)) - order.indexOf(planFamily(b.slug)));
  }, [plans, billing, hasAnnual]);
  const monthlyBySlugFamily = useMemo(() => {
    const map = new Map<PlanFamily, number>();
    for (const plan of plans) if (!isAnnual(plan)) map.set(planFamily(plan.slug), plan.price);
    return map;
  }, [plans]);

  const sapiens = useMemo(() => products.filter((p) => p.category === "MOEDA"), [products]);
  const cosmetics = useMemo(() => products.filter((p) => p.category === "COSMETICO"), [products]);
  const others = useMemo(
    () => products.filter((p) => !["VIP", "MOEDA", "COSMETICO"].includes(p.category)),
    [products]
  );

  return (
    <>
      <PageHero
        title="LOJA"
        subtitle="Apoie o projeto e receba no jogo na hora: planos, Sapiens e cosméticos para Java e Bedrock."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Loja" }]}
      />

      <div className="mx-auto max-w-7xl px-4 pb-20 lg:px-6">
        {/* Como funciona */}
        <section className="mb-16 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-4 rounded-2xl border border-white/10 bg-bg-card/50 p-5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-cs/15 text-green-cs">
                <step.icon size={22} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-green-cs">Passo {i + 1}</p>
                <h3 className="mt-0.5 font-bold text-white">{step.title}</h3>
                <p className="mt-1 text-sm text-[#A0A0A0]">{step.text}</p>
              </div>
            </motion.div>
          ))}
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-green-cs" />
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-bg-card/50 p-12 text-center">
            <Package size={40} className="mx-auto mb-3 text-[#A0A0A0] opacity-40" />
            <p className="text-[#A0A0A0]">Nenhum produto disponível no momento. Volte em breve.</p>
          </div>
        ) : (
          <>
            {/* Planos */}
            {plans.length > 0 && (
              <section id="planos" className="mb-20 scroll-mt-24">
                <div className="mb-8 text-center">
                  <SectionTitle>PLANOS</SectionTitle>
                  <p className="mt-3 text-[#A0A0A0]">
                    Benefícios em todos os servidores da rede. Renovou antes de acabar? O tempo soma.
                  </p>

                  {hasAnnual && (
                    <div className="mt-6 inline-flex items-center rounded-xl border border-white/10 bg-bg-card/60 p-1">
                      {(["mensal", "anual"] as Billing[]).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setBilling(option)}
                          className={`relative rounded-lg px-5 py-2 text-sm font-bold uppercase transition-all ${
                            billing === option ? "bg-green-cs text-white" : "text-[#A0A0A0] hover:text-white"
                          }`}
                        >
                          {option === "mensal" ? "Mensal" : "Anual"}
                          {option === "anual" && (
                            <span className="ml-2 rounded bg-premium px-1.5 py-0.5 text-[10px] text-black">
                              2 meses grátis
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
                  {visiblePlans.map((plan, i) => {
                    const color = plan.color || DEFAULT_COLOR;
                    const annual = isAnnual(plan);
                    const monthly = monthlyBySlugFamily.get(planFamily(plan.slug));
                    const savings = annual && monthly ? monthly * MONTHS_IN_YEAR - plan.price : 0;
                    const combo = combosByPlan.get(plan.slug);
                    return (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className={`relative flex flex-col overflow-hidden rounded-2xl border p-6 ${
                          plan.featured ? "border-2 bg-bg-card/80" : "border-white/10 bg-bg-card/50"
                        }`}
                        style={plan.featured ? { borderColor: color } : undefined}
                      >
                        {plan.featured && plan.badge && (
                          <div
                            className="absolute left-0 right-0 top-0 py-1 text-center text-xs font-bold uppercase text-black"
                            style={{ backgroundColor: color }}
                          >
                            {plan.badge}
                          </div>
                        )}

                        <div className={`flex items-center gap-3 ${plan.featured ? "mt-5" : ""}`}>
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-xl"
                            style={{ backgroundColor: `${color}22` }}
                          >
                            <Crown size={24} style={{ color }} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                            <p className="text-xs text-[#A0A0A0]">
                              {annual ? "365 dias de acesso" : `${plan.durationDays ?? 30} dias de acesso`}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex items-baseline gap-1">
                          <span className="text-3xl font-bold" style={{ color }}>
                            {formatPrice(plan.price)}
                          </span>
                          <span className="text-sm text-[#A0A0A0]">{annual ? "/ano" : "/mês"}</span>
                        </div>
                        {annual && plan.monthlyPrice != null && (
                          <p className="mt-1 text-xs text-[#A0A0A0]">
                            Equivale a {formatPrice(plan.monthlyPrice)} por mês
                            {savings > 0 && (
                              <span className="ml-2 rounded bg-green-cs/15 px-1.5 py-0.5 font-bold text-green-cs">
                                Economize {formatPrice(savings)}
                              </span>
                            )}
                          </p>
                        )}
                        {!annual && plan.originalPrice != null && (
                          <span className="text-xs text-[#A0A0A0] line-through">{formatPrice(plan.originalPrice)}</span>
                        )}

                        <ul className="mt-6 flex-1 space-y-2.5">
                          {plan.benefits.map((benefit) => (
                            <li key={benefit.label} className="flex items-start gap-2 text-sm">
                              {benefit.included ? (
                                <Check size={16} className="mt-0.5 shrink-0 text-green-cs" />
                              ) : (
                                <X size={16} className="mt-0.5 shrink-0 text-[#A0A0A0]/40" />
                              )}
                              <span className={benefit.included ? "text-[#E0E0E0]" : "text-[#A0A0A0]/50"}>
                                {benefit.label}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <Link
                          href={`/loja/comprar/${plan.slug}`}
                          className="mt-6 flex w-full items-center justify-center rounded-xl py-3 text-sm font-bold uppercase text-white transition-all hover:brightness-110 hover:shadow-lg"
                          style={{ backgroundColor: color }}
                        >
                          {annual ? "Assinar por 1 ano" : "Assinar"}
                        </Link>

                        {combo && (
                          <Link
                            href={`/loja/comprar/${comboSlug(plan.slug)}`}
                            className="mt-3 flex items-center gap-3 rounded-xl border border-dashed p-3 text-left transition-colors hover:bg-white/5"
                            style={{ borderColor: `${color}66` }}
                          >
                            <Sparkles size={20} className="shrink-0" style={{ color }} />
                            <span className="text-xs text-[#A0A0A0]">
                              <strong className="block text-sm text-white">
                                Combo com cosméticos: + {formatPrice(combo.price - plan.price)}
                              </strong>
                              Os 4 rastros e a Entrada Épica por 30 dias, junto com o {plan.name}.
                            </span>
                          </Link>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Sapiens */}
            {sapiens.length > 0 && (
              <section id="sapiens" className="mb-20 scroll-mt-24">
                <div className="mb-8 text-center">
                  <SectionTitle>SAPIENS</SectionTitle>
                  <p className="mt-3 text-[#A0A0A0]">
                    A moeda do servidor. Creditada na sua conta assim que você estiver online.
                  </p>
                </div>
                <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-3">
                  {sapiens.map((pack, i) => {
                    const color = pack.color || DEFAULT_COLOR;
                    return (
                      <motion.div
                        key={pack.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08 }}
                        className={`relative flex flex-col items-center rounded-2xl border p-6 text-center ${
                          pack.featured ? "border-2 bg-bg-card/80" : "border-white/10 bg-bg-card/50"
                        }`}
                        style={pack.featured ? { borderColor: color } : undefined}
                      >
                        {pack.badge && (
                          <span
                            className="absolute right-4 top-4 rounded px-2 py-0.5 text-[10px] font-bold uppercase text-black"
                            style={{ backgroundColor: color }}
                          >
                            {pack.badge}
                          </span>
                        )}
                        <Image src={moedaSapiens} alt="" width={72} height={72} className="h-16 w-16 object-contain" />
                        <h3 className="mt-4 text-lg font-bold text-white">{pack.name}</h3>
                        <p className="mt-1 text-xs text-[#A0A0A0]">{pack.shortDescription}</p>
                        <p className="mt-4 text-2xl font-bold" style={{ color }}>
                          {formatPrice(pack.price)}
                        </p>
                        {pack.originalPrice != null && (
                          <span className="text-xs text-[#A0A0A0] line-through">{formatPrice(pack.originalPrice)}</span>
                        )}
                        <Link
                          href={`/loja/comprar/${pack.slug}`}
                          className="mt-5 w-full rounded-xl bg-green-cs/10 py-2.5 text-sm font-bold uppercase text-green-cs transition-all hover:bg-green-cs hover:text-white"
                        >
                          Comprar
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Cosméticos */}
            {cosmetics.length > 0 && (
              <section id="cosmeticos" className="mb-20 scroll-mt-24">
                <div className="mb-8 text-center">
                  <SectionTitle>COSMÉTICOS</SectionTitle>
                  <p className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[#A0A0A0]">
                    Permanentes e visíveis em todos os servidores.
                    <span className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-0.5 text-xs">
                      <Monitor size={12} /> Java
                    </span>
                    <span className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-0.5 text-xs">
                      <Smartphone size={12} /> Bedrock
                    </span>
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {cosmetics.map((item, i) => {
                    const color = item.color || DEFAULT_COLOR;
                    const Icon = cosmeticIcon(item.slug);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="group flex flex-col rounded-xl border border-white/10 bg-bg-card/50 p-4 transition-all hover:border-white/20 hover:shadow-lg"
                      >
                        <div
                          className="mb-3 flex aspect-[4/3] items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${color}14` }}
                        >
                          <Icon size={44} style={{ color }} className="transition-transform group-hover:scale-110" />
                        </div>
                        {item.badge && (
                          <span
                            className="mb-2 inline-block self-start rounded px-2 py-0.5 text-[10px] font-bold uppercase text-black"
                            style={{ backgroundColor: color }}
                          >
                            {item.badge}
                          </span>
                        )}
                        <h3 className="font-bold text-white">{item.name}</h3>
                        <p className="mt-1 flex-1 text-xs text-[#A0A0A0]">{item.shortDescription || item.description}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-lg font-bold text-green-cs">{formatPrice(item.price)}</span>
                          <Link
                            href={`/loja/comprar/${item.slug}`}
                            className="rounded-lg bg-green-cs/10 px-4 py-2 text-sm font-bold text-green-cs transition-all hover:bg-green-cs hover:text-white"
                          >
                            Comprar
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Outros produtos (categorias antigas ainda ativas) */}
            {others.length > 0 && (
              <section className="mb-20">
                <div className="mb-8">
                  <SectionTitle>OUTROS</SectionTitle>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {others.map((item) => (
                    <div key={item.id} className="flex flex-col rounded-xl border border-white/10 bg-bg-card/50 p-4">
                      <Sparkles size={28} className="mb-3 text-green-cs" />
                      <h3 className="font-bold text-white">{item.name}</h3>
                      <p className="mt-1 flex-1 text-xs text-[#A0A0A0]">{item.shortDescription || item.description}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-lg font-bold text-green-cs">{formatPrice(item.price)}</span>
                        <Link
                          href={`/loja/comprar/${item.slug}`}
                          className="rounded-lg bg-green-cs/10 px-4 py-2 text-sm font-bold text-green-cs transition-all hover:bg-green-cs hover:text-white"
                        >
                          Comprar
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Perguntas frequentes */}
        <section className="mx-auto max-w-3xl">
          <div className="mb-6 text-center">
            <SectionTitle className="!text-xl sm:!text-2xl">PERGUNTAS FREQUENTES</SectionTitle>
          </div>
          <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-bg-card/40">
            {FAQ.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="font-medium text-white">{item.q}</span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-[#A0A0A0] transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                  {open && (
                    <p className="px-5 pb-5 text-sm leading-relaxed text-[#A0A0A0]">
                      {item.a}
                      {item.q.includes("16 anos") && (
                        <>
                          {" "}
                          <Link href="/termos" className="text-green-cs hover:underline">
                            Ler os termos
                          </Link>
                          .
                        </>
                      )}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-center text-xs text-[#A0A0A0]">
            A contribuição é espontânea e ajuda a manter o servidor. Benefícios podem mudar com aviso de 7 dias, conforme os{" "}
            <Link href="/termos" className="text-green-cs hover:underline">
              Termos e Condições
            </Link>
            .
          </p>
        </section>
      </div>
    </>
  );
}
