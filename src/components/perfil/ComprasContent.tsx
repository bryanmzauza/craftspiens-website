"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Calendar,
  CreditCard,
  QrCode,
  Check,
  Clock,
  XCircle,
  RefreshCw,
  Filter,
  Crown,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { DeliveryBadge } from "@/components/loja/PedidoContent";
import { productIcon } from "@/components/loja/catalog-ui";
import { formatPrice } from "@/lib/products";

type ApiOrderStatus = "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";
type DeliveryStatus = "PENDING" | "PROCESSING" | "DELIVERED" | "FAILED";

interface OrderItem {
  id: string;
  product: {
    name: string;
    slug: string;
    category: string;
    imageUrl: string | null;
    durationDays: number | null;
    color: string | null;
  };
  quantity: number;
  price: number;
}

interface ApiOrder {
  id: string;
  status: ApiOrderStatus;
  total: number;
  installments: number | null;
  paidAmount: number | null;
  paymentMethod: string | null;
  paymentKind: "pix" | "cartao" | null;
  pending: boolean;
  coupon: { code: string; discount: number } | null;
  items: OrderItem[];
  delivery: {
    summary: "none" | "pending" | "delivered" | "failed";
    items: { name: string; status: DeliveryStatus; requiresOnline: boolean }[];
  };
  createdAt: string;
  paidAt: string | null;
}

interface ComprasResponse {
  orders: ApiOrder[];
  plans: { name: string; color: string | null; expiresAt: string }[];
  summary: { totalSpent: number; totalOrders: number; approvedOrders: number };
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

const STATUS_CONFIG: Record<ApiOrderStatus, { label: string; cor: string; icon: typeof Check }> = {
  APPROVED: { label: "Aprovado", cor: "#4CAF50", icon: Check },
  PENDING: { label: "Aguardando pagamento", cor: "#FFC107", icon: Clock },
  REJECTED: { label: "Não concluído", cor: "#E53935", icon: XCircle },
  REFUNDED: { label: "Reembolsado", cor: "#2196F3", icon: RefreshCw },
};

const PAYMENT_LABELS: Record<string, string> = {
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  account_money: "Saldo Mercado Pago",
};

function paymentLabel(order: ApiOrder): { label: string; icon: typeof CreditCard } {
  const method = order.paymentMethod?.toLowerCase();
  if (method && PAYMENT_LABELS[method]) {
    return { label: PAYMENT_LABELS[method], icon: method === "pix" ? QrCode : CreditCard };
  }
  if (order.paymentKind === "cartao") return { label: "Mercado Pago", icon: CreditCard };
  if (method) return { label: method, icon: CreditCard };
  return { label: "Pix", icon: QrCode };
}

export function ComprasContent() {
  const { data: session } = useSession();
  const [data, setData] = useState<ComprasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<ApiOrderStatus | "todos">("todos");
  const [page, setPage] = useState(1);

  const fetchCompras = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "todos") params.set("status", filterStatus);
      params.set("page", String(page));
      const res = await fetch(`/api/perfil/compras?${params}`);
      if (res.ok) setData(await res.json());
    } catch {
      // Sem conexão: mantém o que já estava na tela
    } finally {
      setLoading(false);
    }
  }, [filterStatus, page]);

  useEffect(() => {
    if (session?.user) fetchCompras();
  }, [session, fetchCompras]);

  function handleFilterChange(status: ApiOrderStatus | "todos") {
    setFilterStatus(status);
    setPage(1);
  }

  const orders = data?.orders || [];
  const pagination = data?.pagination;
  const summary = data?.summary;
  const plans = data?.plans || [];

  return (
    <>
      <PageHero
        title="MINHAS COMPRAS"
        subtitle="Pedidos, pagamentos e entregas no servidor."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Perfil", href: "/perfil" },
          { label: "Compras" },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        {/* Planos ativos */}
        {plans.length > 0 && (
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            {plans.map((plan) => {
              const color = plan.color || "#FFD700";
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4"
                  style={{ borderColor: `${color}55`, backgroundColor: `${color}0d` }}
                >
                  <div className="flex items-center gap-3">
                    <Crown size={24} style={{ color }} />
                    <div>
                      <p className="font-bold text-white">{plan.name} ativo</p>
                      <p className="text-sm text-[#A0A0A0]">
                        Válido até {new Date(plan.expiresAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/loja#planos"
                    className="rounded-lg px-4 py-2 text-sm font-bold text-black transition-all hover:brightness-110"
                    style={{ backgroundColor: color }}
                  >
                    Renovar
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Resumo + Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-sm text-[#A0A0A0]">
            Total gasto: <span className="font-bold text-green-cs">{formatPrice(summary?.totalSpent ?? 0)}</span> ·{" "}
            {summary?.approvedOrders ?? 0} {summary?.approvedOrders === 1 ? "compra aprovada" : "compras aprovadas"}
          </p>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[#A0A0A0]" />
            <select
              value={filterStatus}
              onChange={(e) => handleFilterChange(e.target.value as ApiOrderStatus | "todos")}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white focus:border-green-cs focus:outline-none"
            >
              <option value="todos" className="bg-bg-primary">Todos</option>
              <option value="APPROVED" className="bg-bg-primary">Aprovados</option>
              <option value="PENDING" className="bg-bg-primary">Aguardando pagamento</option>
              <option value="REJECTED" className="bg-bg-primary">Não concluídos</option>
              <option value="REFUNDED" className="bg-bg-primary">Reembolsados</option>
            </select>
          </div>
        </motion.div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-green-cs" />
          </div>
        )}

        {!loading && (
          <div className="space-y-3">
            {orders.map((order, i) => {
              const statusConf = STATUS_CONFIG[order.status];
              const payment = paymentLabel(order);
              const StatusIcon = statusConf.icon;
              const PaymentIcon = payment.icon;
              const first = order.items[0];
              const Icon = first ? productIcon(first.product.category, first.product.slug) : ShoppingBag;
              const color = first?.product.color || "#4CAF50";
              const productNames = order.items
                .map((item) => (item.quantity > 1 ? `${item.quantity}x ${item.product.name}` : item.product.name))
                .join(", ");

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl border border-white/10 bg-bg-card/50 p-4 transition-all hover:border-white/20"
                >
                  <div className="flex flex-wrap items-center gap-4">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Icon size={20} style={{ color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-white">{productNames}</h3>
                        <span
                          className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold"
                          style={{ backgroundColor: `${statusConf.cor}20`, color: statusConf.cor }}
                        >
                          <StatusIcon size={12} />
                          {statusConf.label}
                        </span>
                        {order.coupon && (
                          <span className="rounded bg-green-cs/20 px-2 py-0.5 text-[10px] font-bold text-green-cs">
                            {order.coupon.code} -{order.coupon.discount}%
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#A0A0A0]">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <PaymentIcon size={12} />
                          {payment.label}
                        </span>
                        <span className="font-mono text-[10px]">{order.id}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-lg font-bold text-white">{formatPrice(order.paidAmount ?? order.total)}</span>
                        {order.installments != null && order.installments > 1 && order.paidAmount != null && (
                          <p className="text-[11px] text-[#A0A0A0]">
                            {order.installments}x de {formatPrice(order.paidAmount / order.installments)}
                            {order.paidAmount > order.total ? `, juros de ${formatPrice(order.paidAmount - order.total)}` : ", sem juros"}
                          </p>
                        )}
                      </div>
                      {order.pending ? (
                        <Link
                          href={`/loja/pedido/${order.id}`}
                          className="rounded-lg bg-green-cs px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-green-dark"
                        >
                          Pagar
                        </Link>
                      ) : (
                        <Link
                          href={`/loja/pedido/${order.id}`}
                          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/10"
                        >
                          Ver
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Entrega */}
                  {order.status === "APPROVED" && order.delivery.items.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3 text-xs text-[#A0A0A0]">
                      <span>Entrega no servidor:</span>
                      {order.delivery.items.map((d, j) => (
                        <span key={`${d.name}-${j}`} className="inline-flex items-center gap-1.5">
                          {order.delivery.items.length > 1 && <span className="text-[#E0E0E0]">{d.name}</span>}
                          <DeliveryBadge status={d.status} requiresOnline={d.requiresOnline} />
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}

            {orders.length === 0 && (
              <div className="py-12 text-center text-[#A0A0A0]">
                <ShoppingBag size={40} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Nenhuma compra encontrada</p>
                <p className="text-sm">
                  {filterStatus !== "todos" ? "Ajuste o filtro ou visite a loja." : "Visite a loja para apoiar o projeto."}
                </p>
                <Link
                  href="/loja"
                  className="mt-4 inline-block rounded-lg bg-green-cs px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-green-dark"
                >
                  Ir para a Loja
                </Link>
              </div>
            )}
          </div>
        )}

        {!loading && pagination && pagination.totalPages > 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <span className="text-sm text-[#A0A0A0]">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="flex items-center gap-1 rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/10 disabled:opacity-30"
            >
              Próxima <ChevronRight size={16} />
            </button>
          </motion.div>
        )}
      </div>
    </>
  );
}
