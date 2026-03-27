"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Calendar,
  CreditCard,
  QrCode,
  FileText,
  Check,
  Clock,
  XCircle,
  RefreshCw,
  Filter,
  Crown,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

type ApiOrderStatus = "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";

interface OrderItem {
  id: string;
  product: {
    name: string;
    slug: string;
    category: string;
    imageUrl: string | null;
    durationDays: number | null;
  };
  quantity: number;
  price: number;
}

interface ApiOrder {
  id: string;
  status: ApiOrderStatus;
  total: number;
  paymentMethod: string | null;
  coupon: { code: string; discount: number } | null;
  items: OrderItem[];
  createdAt: string;
}

interface ComprasResponse {
  orders: ApiOrder[];
  vip: { name: string; expiresAt: string } | null;
  summary: { totalSpent: number; totalOrders: number; approvedOrders: number };
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

const STATUS_CONFIG: Record<ApiOrderStatus, { label: string; cor: string; icon: typeof Check }> = {
  APPROVED: { label: "Aprovado", cor: "#4CAF50", icon: Check },
  PENDING: { label: "Pendente", cor: "#FFC107", icon: Clock },
  REJECTED: { label: "Cancelado", cor: "#E53935", icon: XCircle },
  REFUNDED: { label: "Reembolsado", cor: "#2196F3", icon: RefreshCw },
};

const PAYMENT_CONFIG: Record<string, { label: string; icon: typeof CreditCard }> = {
  pix: { label: "PIX", icon: QrCode },
  credit_card: { label: "Cartão", icon: CreditCard },
  debit_card: { label: "Débito", icon: CreditCard },
  bolbradesco: { label: "Boleto", icon: FileText },
};

function getPaymentInfo(method: string | null) {
  if (!method) return { label: "—", icon: CreditCard };
  const key = method.toLowerCase();
  return PAYMENT_CONFIG[key] || { label: method, icon: CreditCard };
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
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // Silently fail
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
  const vip = data?.vip;

  return (
    <>
      <PageHero
        title="MINHAS COMPRAS"
        subtitle="Histórico de pedidos e compras realizadas."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Perfil", href: "/perfil" },
          { label: "Compras" },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        {/* VIP ativo banner */}
        {vip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4"
          >
            <div className="flex items-center gap-3">
              <Crown size={24} className="text-yellow-500" />
              <div>
                <p className="font-bold text-white">{vip.name} Ativo</p>
                <p className="text-sm text-[#A0A0A0]">
                  Expira em{" "}
                  {new Date(vip.expiresAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
            <Link
              href="/loja"
              className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-bold text-black transition-all hover:bg-yellow-400"
            >
              Renovar
            </Link>
          </motion.div>
        )}

        {/* Resumo + Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-sm text-[#A0A0A0]">
            Total gasto:{" "}
            <span className="font-bold text-green-cs">
              R$ {(summary?.totalSpent ?? 0).toFixed(2).replace(".", ",")}
            </span>{" "}
            · {summary?.totalOrders ?? 0} pedidos
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
              <option value="PENDING" className="bg-bg-primary">Pendentes</option>
              <option value="REJECTED" className="bg-bg-primary">Cancelados</option>
              <option value="REFUNDED" className="bg-bg-primary">Reembolsados</option>
            </select>
          </div>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-green-cs" />
          </div>
        )}

        {/* Lista de pedidos */}
        {!loading && (
          <div className="space-y-3">
            {orders.map((order, i) => {
              const statusConf = STATUS_CONFIG[order.status];
              const paymentInfo = getPaymentInfo(order.paymentMethod);
              const StatusIcon = statusConf.icon;
              const PaymentIcon = paymentInfo.icon;
              const productNames = order.items.map((item) =>
                item.quantity > 1 ? `${item.product.name} ×${item.quantity}` : item.product.name
              ).join(", ");

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-bg-card/50 p-4 transition-all hover:border-white/20"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
                    <Package size={20} className="text-[#A0A0A0]" />
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
                        {paymentInfo.label}
                      </span>
                      <span className="font-mono text-[10px]">{order.id}</span>
                    </div>
                  </div>

                  <span className="text-lg font-bold text-white">
                    R$ {order.total.toFixed(2).replace(".", ",")}
                  </span>
                </motion.div>
              );
            })}

            {orders.length === 0 && (
              <div className="py-12 text-center text-[#A0A0A0]">
                <ShoppingBag size={40} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Nenhuma compra encontrada</p>
                <p className="text-sm">
                  {filterStatus !== "todos"
                    ? "Ajuste os filtros ou visite a loja."
                    : "Visite a loja para adquirir produtos."}
                </p>
                <Link
                  href="/loja"
                  className="mt-4 inline-block rounded-lg bg-green-cs px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-green-hover"
                >
                  Ir para a Loja
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Paginação */}
        {!loading && pagination && pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex items-center justify-center gap-2"
          >
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
