"use client";

import { useState, useMemo, useEffect } from "react";
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
  ChevronDown,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

type OrderStatus = "aprovado" | "pendente" | "cancelado" | "reembolsado";

interface Order {
  id: string;
  produto: string;
  categoria: string;
  valor: number;
  metodo: "pix" | "cartao" | "boleto";
  status: OrderStatus;
  data: string;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; cor: string; icon: typeof Check }> = {
  aprovado: { label: "Aprovado", cor: "#4CAF50", icon: Check },
  pendente: { label: "Pendente", cor: "#FFC107", icon: Clock },
  cancelado: { label: "Cancelado", cor: "#E53935", icon: XCircle },
  reembolsado: { label: "Reembolsado", cor: "#2196F3", icon: RefreshCw },
};

const METODO_CONFIG: Record<string, { label: string; icon: typeof CreditCard }> = {
  pix: { label: "PIX", icon: QrCode },
  cartao: { label: "Cartão", icon: CreditCard },
  boleto: { label: "Boleto", icon: FileText },
};

const MOCK_ORDERS: Order[] = [
  { id: "CS-20260318-001", produto: "VIP+ Mensal", categoria: "vip", valor: 29.9, metodo: "pix", status: "aprovado", data: "2026-03-18" },
  { id: "CS-20260315-002", produto: "Trail Fire", categoria: "cosmetico", valor: 9.9, metodo: "cartao", status: "aprovado", data: "2026-03-15" },
  { id: "CS-20260312-003", produto: "500 Moedas SAPIENS", categoria: "moeda", valor: 14.9, metodo: "pix", status: "aprovado", data: "2026-03-12" },
  { id: "CS-20260305-004", produto: "Kit Aventureiro", categoria: "kit", valor: 24.9, metodo: "boleto", status: "cancelado", data: "2026-03-05" },
  { id: "CS-20260218-005", produto: "VIP+ Mensal", categoria: "vip", valor: 29.9, metodo: "pix", status: "aprovado", data: "2026-02-18" },
  { id: "CS-20260118-006", produto: "Rank Diamond", categoria: "rank", valor: 34.9, metodo: "cartao", status: "reembolsado", data: "2026-01-18" },
];

export function ComprasContent() {
  const { data: session } = useSession();
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "todos">("todos");
  const [orders] = useState<Order[]>(MOCK_ORDERS); // Será substituído por query real com MercadoPago

  const filtered = useMemo(() => {
    if (filterStatus === "todos") return orders;
    return orders.filter((o) => o.status === filterStatus);
  }, [filterStatus, orders]);

  const totalGasto = useMemo(() => {
    return orders.filter((o) => o.status === "aprovado").reduce((a, o) => a + o.valor, 0);
  }, [orders]);

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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4"
        >
          <div className="flex items-center gap-3">
            <Crown size={24} className="text-yellow-500" />
            <div>
              <p className="font-bold text-white">Plano VIP+ Ativo</p>
              <p className="text-sm text-[#A0A0A0]">Expira em 15/04/2026</p>
            </div>
          </div>
          <Link
            href="/loja"
            className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-bold text-black transition-all hover:bg-yellow-400"
          >
            Renovar
          </Link>
        </motion.div>

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
              R$ {totalGasto.toFixed(2).replace(".", ",")}
            </span>{" "}
            · {orders.length} pedidos
          </p>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[#A0A0A0]" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as OrderStatus | "todos")}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white focus:border-green-cs focus:outline-none"
            >
              <option value="todos" className="bg-bg-primary">Todos</option>
              <option value="aprovado" className="bg-bg-primary">Aprovados</option>
              <option value="pendente" className="bg-bg-primary">Pendentes</option>
              <option value="cancelado" className="bg-bg-primary">Cancelados</option>
              <option value="reembolsado" className="bg-bg-primary">Reembolsados</option>
            </select>
          </div>
        </motion.div>

        {/* Lista de pedidos */}
        <div className="space-y-3">
          {filtered.map((order, i) => {
            const statusConf = STATUS_CONFIG[order.status];
            const metodoConf = METODO_CONFIG[order.metodo];
            const StatusIcon = statusConf.icon;
            const MetodoIcon = metodoConf.icon;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-bg-card/50 p-4 transition-all hover:border-white/20"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-white">{order.produto}</h3>
                    <span
                      className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: `${statusConf.cor}20`, color: statusConf.cor }}
                    >
                      <StatusIcon size={12} />
                      {statusConf.label}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#A0A0A0]">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(order.data).toLocaleDateString("pt-BR")}
                    </span>
                    <span className="flex items-center gap-1">
                      <MetodoIcon size={12} />
                      {metodoConf.label}
                    </span>
                    <span className="font-mono text-[10px]">{order.id}</span>
                  </div>
                </div>

                <span className="text-lg font-bold text-white">
                  R$ {order.valor.toFixed(2).replace(".", ",")}
                </span>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-[#A0A0A0]">
              <ShoppingBag size={40} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Nenhuma compra encontrada</p>
              <p className="text-sm">Ajuste os filtros ou visite a loja.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
