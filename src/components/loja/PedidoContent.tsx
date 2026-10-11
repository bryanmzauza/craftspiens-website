"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  RefreshCw,
  Server,
  ShoppingBag,
  XCircle,
  AlertTriangle,
  Timer,
} from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/products";

type OrderStatus = "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";
type DeliveryStatus = "PENDING" | "PROCESSING" | "DELIVERED" | "FAILED";

interface OrderData {
  id: string;
  status: OrderStatus;
  total: number;
  installments: number | null;
  paidAmount: number | null;
  paymentMethod: string | null;
  paymentKind: "pix" | "cartao" | null;
  pix: { code: string; qrBase64: string | null; expiresAt: string | null; expired: boolean } | null;
  checkoutUrl: string | null;
  items: { id: string; product: { name: string; slug: string; category: string }; quantity: number; price: number }[];
  delivery: {
    summary: "none" | "pending" | "delivered" | "failed";
    items: { name: string; status: DeliveryStatus; requiresOnline: boolean }[];
  };
  paidAt: string | null;
  createdAt: string;
}

const POLL_MS = 4000;

function remaining(expiresAt: string | null, now: number): number {
  if (!expiresAt) return 0;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function PedidoContent({ orderId }: { orderId: string }) {
  const { data: session, status: sessionStatus } = useSession();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  // Relógio para a contagem regressiva do Pix; o restante é derivado dele
  const [now, setNow] = useState(() => Date.now());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/loja/pedido/${orderId}`, { cache: "no-store" });
      if (res.status === 404 || res.status === 403) {
        setNotFound(true);
        return null;
      }
      if (!res.ok) return null;
      const data = (await res.json()) as OrderData;
      setOrder(data);
      return data;
    } catch {
      return null;
    }
  }, [orderId]);

  // Consulta o pedido enquanto houver algo para esperar: pagamento pendente ou entrega em andamento
  useEffect(() => {
    if (!session) return;
    let stopped = false;

    const tick = async () => {
      const data = await load();
      if (stopped) return;
      const waitingPayment = !data || (data.status === "PENDING" && !data.pix?.expired);
      const waitingDelivery = data?.status === "APPROVED" && data.delivery.summary === "pending";
      if (waitingPayment || waitingDelivery) {
        const delay = document.visibilityState === "visible" ? POLL_MS : POLL_MS * 4;
        timer.current = setTimeout(tick, delay);
      }
    };
    tick();

    return () => {
      stopped = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [session, load]);

  // Contagem regressiva do Pix: só o relógio muda; os segundos restantes são calculados no render
  const countingDown = order?.status === "PENDING" && !!order.pix?.expiresAt;
  useEffect(() => {
    if (!countingDown) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [countingDown]);
  const secondsLeft = remaining(order?.pix?.expiresAt ?? null, now);

  const copyCode = async () => {
    if (!order?.pix) return;
    try {
      await navigator.clipboard.writeText(order.pix.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sem permissão de área de transferência: o usuário seleciona o texto manualmente
    }
  };

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Loja", href: "/loja" },
    { label: "Pedido" },
  ];

  if (sessionStatus === "loading" || (!order && !notFound && session)) {
    return (
      <>
        <PageHero title="PEDIDO" breadcrumbs={breadcrumbs} />
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-cs" />
        </div>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <PageHero title="PEDIDO" breadcrumbs={breadcrumbs} />
        <div className="mx-auto max-w-2xl px-4 pb-24 lg:px-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="text-lg text-[#A0A0A0]">Entre na sua conta para ver o pedido</p>
            <div className="mt-6">
              <Button href={`/login?redirect=/loja/pedido/${orderId}`}>FAZER LOGIN</Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (notFound || !order) {
    return (
      <>
        <PageHero title="PEDIDO" breadcrumbs={breadcrumbs} />
        <div className="mx-auto max-w-2xl px-4 pb-24 lg:px-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="text-lg text-[#A0A0A0]">Pedido não encontrado.</p>
            <div className="mt-6">
              <Button href="/perfil/compras">MINHAS COMPRAS</Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const product = order.items[0]?.product;
  const pixExpired = order.status === "PENDING" && !!order.pix && (order.pix.expired || secondsLeft === 0);
  const retryHref = product ? `/loja/comprar/${product.slug}` : "/loja";

  return (
    <>
      <PageHero
        title="PEDIDO"
        subtitle={product ? product.name : undefined}
        breadcrumbs={breadcrumbs}
      />

      <div className="mx-auto max-w-2xl px-4 pb-24 lg:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8"
        >
          {/* Pix pendente */}
          {order.status === "PENDING" && order.pix && !pixExpired && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-bold text-warning">
                <Timer size={14} />
                Pix expira em {formatCountdown(secondsLeft)}
              </div>
              <h2 className="mt-4 text-2xl font-bold text-white">Pague {formatPrice(order.total)} com Pix</h2>
              <p className="mt-2 text-sm text-[#A0A0A0]">
                Abra o app do seu banco, escolha pagar com Pix e escaneie o código. A confirmação aparece aqui sozinha.
              </p>

              {order.pix.qrBase64 && (
                <div className="mx-auto mt-6 w-fit rounded-2xl bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- imagem gerada pelo MercadoPago, em base64 */}
                  <img
                    src={`data:image/png;base64,${order.pix.qrBase64}`}
                    alt="QR Code do Pix"
                    width={240}
                    height={240}
                    className="h-60 w-60"
                  />
                </div>
              )}

              <p className="mt-6 text-xs font-medium text-[#A0A0A0]">Ou copie o código Pix copia e cola</p>
              <div className="mt-2 flex items-stretch gap-2">
                <input
                  readOnly
                  value={order.pix.code}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 font-[family-name:var(--font-jetbrains-mono)] text-xs text-white focus:border-green-cs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={copyCode}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-green-cs px-4 text-sm font-bold text-white transition-colors hover:bg-green-dark"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#A0A0A0]">
                <Loader2 size={14} className="animate-spin text-green-cs" />
                Aguardando o pagamento...
              </div>
            </div>
          )}

          {/* Pix expirado */}
          {pixExpired && (
            <div className="text-center">
              <Clock size={56} className="mx-auto text-warning" />
              <h2 className="mt-4 text-2xl font-bold text-white">Este Pix expirou</h2>
              <p className="mt-2 text-sm text-[#A0A0A0]">
                Nada foi cobrado. Gere um novo código para continuar a compra.
              </p>
              <div className="mt-6">
                <Button href={retryHref}>
                  <RefreshCw size={16} className="mr-2" />
                  GERAR NOVO PIX
                </Button>
              </div>
            </div>
          )}

          {/* Cartão pendente */}
          {order.status === "PENDING" && !order.pix && (
            <div className="text-center">
              <Loader2 size={48} className="mx-auto animate-spin text-green-cs" />
              <h2 className="mt-4 text-2xl font-bold text-white">Aguardando o pagamento</h2>
              <p className="mt-2 text-sm text-[#A0A0A0]">
                Pagamentos no cartão podem levar alguns minutos para serem confirmados pelo Mercado Pago.
                Esta página atualiza sozinha.
              </p>
              {order.checkoutUrl && (
                <a
                  href={order.checkoutUrl}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                  <ExternalLink size={16} /> Abrir o pagamento de novo
                </a>
              )}
            </div>
          )}

          {/* Aprovado */}
          {order.status === "APPROVED" && (
            <div className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                <CheckCircle size={64} className="mx-auto text-green-cs" />
              </motion.div>
              <h2 className="mt-4 text-2xl font-bold text-white">Pagamento aprovado</h2>
              <p className="mt-2 text-sm text-[#A0A0A0]">Obrigado por apoiar a CraftSapiens.</p>

              <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-left">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Server size={16} className="text-green-cs" />
                  Entrega no servidor
                </div>
                <ul className="mt-3 space-y-2">
                  {order.delivery.items.length === 0 && (
                    <li className="text-sm text-[#A0A0A0]">
                      {order.delivery.summary === "none"
                        ? "Este item é entregue manualmente pela equipe."
                        : "Preparando a entrega..."}
                    </li>
                  )}
                  {order.delivery.items.map((item, i) => (
                    <li key={`${item.name}-${i}`} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-[#E0E0E0]">{item.name}</span>
                      <DeliveryBadge status={item.status} requiresOnline={item.requiresOnline} />
                    </li>
                  ))}
                </ul>
                {order.delivery.summary === "pending" && (
                  <p className="mt-3 text-xs text-[#A0A0A0]">
                    {order.delivery.items.some((d) => d.requiresOnline)
                      ? "Entre no lobby do servidor para receber. A entrega acontece assim que você entrar."
                      : "O servidor entrega em até um minuto. Se você já estiver online, entre no lobby para receber."}
                  </p>
                )}
                {order.delivery.summary === "failed" && (
                  <p className="mt-3 flex items-start gap-2 text-xs text-warning">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    A entrega automática não conseguiu concluir. A equipe foi avisada; se precisar, fale conosco pelo Discord com o número do pedido.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Recusado */}
          {order.status === "REJECTED" && !pixExpired && (
            <div className="text-center">
              <XCircle size={56} className="mx-auto text-error" />
              <h2 className="mt-4 text-2xl font-bold text-white">Pagamento não concluído</h2>
              <p className="mt-2 text-sm text-[#A0A0A0]">
                O pagamento foi recusado, cancelado ou expirou. Nada foi entregue. Você pode tentar de novo.
              </p>
              <div className="mt-6">
                <Button href={retryHref}>TENTAR NOVAMENTE</Button>
              </div>
            </div>
          )}

          {/* Reembolsado */}
          {order.status === "REFUNDED" && (
            <div className="text-center">
              <RefreshCw size={56} className="mx-auto text-info" />
              <h2 className="mt-4 text-2xl font-bold text-white">Pedido reembolsado</h2>
              <p className="mt-2 text-sm text-[#A0A0A0]">O valor foi devolvido e os benefícios foram removidos do servidor.</p>
            </div>
          )}

          {/* Detalhes */}
          <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-4 text-left text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#A0A0A0]">Pedido</span>
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-white">{order.id}</span>
            </div>
            {order.items.map((item) => (
              <div key={item.id} className="mt-2 flex justify-between">
                <span className="text-white">
                  {item.quantity > 1 ? `${item.quantity}x ` : ""}
                  {item.product.name}
                </span>
                <span className="text-[#A0A0A0]">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="mt-3 flex justify-between border-t border-white/10 pt-3">
              <span className="font-bold text-white">Total</span>
              <span className="font-bold text-green-cs">{formatPrice(order.total)}</span>
            </div>
            {/* Cartão parcelado: o que foi pago de fato, com os juros do Mercado Pago */}
            {order.installments != null && order.installments > 1 && order.paidAmount != null && (
              <div className="mt-2 space-y-1 text-xs text-[#A0A0A0]">
                <div className="flex justify-between">
                  <span>Parcelado no cartão</span>
                  <span>
                    {order.installments}x de {formatPrice(order.paidAmount / order.installments)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Juros do Mercado Pago</span>
                  <span>
                    {order.paidAmount > order.total ? formatPrice(order.paidAmount - order.total) : "sem juros"}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-white">
                  <span>Total pago</span>
                  <span>{formatPrice(order.paidAmount)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button href="/perfil/compras" variant="secondary">
              <ShoppingBag size={16} className="mr-2" />
              MINHAS COMPRAS
            </Button>
            <Link href="/loja" className="inline-flex items-center gap-1 text-sm text-green-cs hover:underline">
              <ArrowLeft size={14} /> Voltar à loja
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export function DeliveryBadge({ status, requiresOnline }: { status: DeliveryStatus; requiresOnline: boolean }) {
  const config: Record<DeliveryStatus, { label: string; color: string; icon: typeof Check; spin?: boolean }> = {
    PENDING: { label: requiresOnline ? "Ao entrar no lobby" : "Na fila", color: "#FFC107", icon: Clock },
    PROCESSING: { label: "Entregando", color: "#FFC107", icon: Loader2, spin: true },
    DELIVERED: { label: "Entregue", color: "#4CAF50", icon: Check },
    FAILED: { label: "Precisa de atenção", color: "#E53935", icon: AlertTriangle },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold"
      style={{ backgroundColor: `${c.color}20`, color: c.color }}
    >
      <Icon size={12} className={c.spin ? "animate-spin" : ""} />
      {c.label}
    </span>
  );
}
