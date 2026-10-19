"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Clock,
  CreditCard,
  History,
  Package,
  Receipt,
  RotateCcw,
  ShoppingBag,
  Trophy,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { CATEGORY_LABELS } from "@/components/loja/catalog-ui";
import {
  Badge,
  Card,
  CardTitle,
  Delta,
  ErrorBox,
  Loading,
  ORDER_STATUS,
  PageHeader,
  Segmented,
  brl,
  usePanelData,
  timeAgo,
} from "@/components/painel/ui";
import { MeterRow, RevenueChart } from "@/components/painel/RevenueChart";
import { describeLog } from "@/components/painel/log-labels";
import type { PanelSaleView } from "@/components/painel/types";

interface Summary {
  days: number;
  kpis: {
    revenue: number;
    revenueChange: number | null;
    orders: number;
    ordersChange: number | null;
    avgTicket: number;
    avgTicketChange: number | null;
    buyers: number;
    buyersChange: number | null;
    conversion: number | null;
    createdOrders: number;
  };
  daily: { date: string; revenue: number; orders: number }[];
  categories: { category: string; revenue: number }[];
  topProducts: { name: string; color: string | null; category: string; revenue: number; sold: number }[];
  methods: { pix: { orders: number; revenue: number }; cartao: { orders: number; revenue: number } };
  pending: { orders: number; total: number };
  refunds: { orders: number; total: number };
  attention: number;
  activeCoupons: number;
  activeProducts: number;
  recentSales: PanelSaleView[];
  nextClasses: { id: string; title: string; topic: string | null; teacher: string; color: string; startsAt: string; endsAt: string }[];
  activity: { id: string; actor: string; action: string; target: string | null; createdAt: string }[];
}

function Kpi({ icon: Icon, label, value, change }: { icon: LucideIcon; label: string; value: string; change: number | null }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#A0A0A0]">
        <Icon size={15} className="text-green-cs" /> {label}
      </div>
      <p className="mt-3 text-2xl font-bold text-white sm:text-[28px]">{value}</p>
      <div className="mt-1">
        <Delta value={change} />
      </div>
    </Card>
  );
}

function classWhen(startsAt: string): string {
  const d = new Date(startsAt);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === today.toDateString()) return `Hoje, ${time}`;
  if (d.toDateString() === tomorrow.toDateString()) return `Amanhã, ${time}`;
  return `${d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}, ${time}`;
}

export function VisaoGeral() {
  const [days, setDays] = useState(30);
  const { data, error, reload: load } = usePanelData<Summary>(`/api/painel/resumo?dias=${days}`);

  const header = (
    <PageHeader
      title="VISÃO GERAL"
      description="Como a loja está indo, o que precisa de atenção e as próximas aulas."
      actions={
        <Segmented
          value={days}
          onChange={setDays}
          options={[
            { value: 7, label: "7 dias" },
            { value: 30, label: "30 dias" },
            { value: 90, label: "90 dias" },
          ]}
        />
      }
    />
  );

  if (error) {
    return (
      <>
        {header}
        <ErrorBox message={error} onRetry={load} />
      </>
    );
  }
  if (!data) {
    return (
      <>
        {header}
        <Loading />
      </>
    );
  }

  const { kpis } = data;
  const maxProduct = Math.max(...data.topProducts.map((p) => p.revenue), 0);
  const maxCategory = Math.max(...data.categories.map((c) => c.revenue), 0);
  const methodsTotal = data.methods.pix.revenue + data.methods.cartao.revenue;

  const alerts: { icon: LucideIcon; text: string; href: string; tone: "red" | "yellow" | "gray" }[] = [];
  if (data.attention > 0) {
    alerts.push({
      icon: AlertTriangle,
      text: `${data.attention} ${data.attention === 1 ? "entrega precisa" : "entregas precisam"} de atenção`,
      href: "/painel/entregas",
      tone: "red",
    });
  }
  if (data.pending.orders > 0) {
    alerts.push({
      icon: Clock,
      text: `${data.pending.orders} ${data.pending.orders === 1 ? "pagamento aguardando" : "pagamentos aguardando"} (${brl(data.pending.total)})`,
      href: "/painel/vendas?status=PENDING",
      tone: "yellow",
    });
  }
  if (data.refunds.orders > 0) {
    alerts.push({
      icon: RotateCcw,
      text: `${data.refunds.orders} ${data.refunds.orders === 1 ? "reembolso" : "reembolsos"} no período (${brl(data.refunds.total)})`,
      href: "/painel/vendas?status=REFUNDED",
      tone: "gray",
    });
  }

  return (
    <>
      {header}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi icon={Wallet} label="Receita" value={brl(kpis.revenue)} change={kpis.revenueChange} />
        <Kpi icon={ShoppingBag} label="Vendas" value={String(kpis.orders)} change={kpis.ordersChange} />
        <Kpi icon={Receipt} label="Ticket médio" value={brl(kpis.avgTicket)} change={kpis.avgTicketChange} />
        <Kpi icon={Users} label="Compradores" value={String(kpis.buyers)} change={kpis.buyersChange} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="p-5">
          <CardTitle icon={BarChart3}>Receita por dia</CardTitle>
          <RevenueChart data={data.daily} />
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <CardTitle icon={AlertTriangle}>Precisa de atenção</CardTitle>
            {alerts.length === 0 ? (
              <p className="text-sm text-[#A0A0A0]">Nada pendente. Entregas em dia e nenhum pagamento parado.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {alerts.map((alert) => (
                  <Link
                    key={alert.text}
                    href={alert.href}
                    className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                      alert.tone === "red"
                        ? "border-error/30 bg-error/10 text-[#ffb4b1] hover:bg-error/15"
                        : alert.tone === "yellow"
                          ? "border-warning/25 bg-warning/10 text-[#ffe08a] hover:bg-warning/15"
                          : "border-white/10 bg-white/5 text-[#C0C0C8] hover:bg-white/10"
                    }`}
                  >
                    <alert.icon size={16} className="shrink-0" />
                    <span className="flex-1">{alert.text}</span>
                    <ArrowRight size={14} className="opacity-50 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <CardTitle icon={CreditCard}>Formas de pagamento</CardTitle>
            <div className="flex flex-col gap-3">
              <MeterRow
                label="Pix"
                value={data.methods.pix.revenue}
                max={methodsTotal}
                detail={`${data.methods.pix.orders} · ${brl(data.methods.pix.revenue)}`}
              />
              <MeterRow
                label="Cartão"
                value={data.methods.cartao.revenue}
                max={methodsTotal}
                detail={`${data.methods.cartao.orders} · ${brl(data.methods.cartao.revenue)}`}
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/5 pt-4 text-center">
              <div>
                <p className="text-lg font-bold text-white">{kpis.conversion != null ? `${kpis.conversion.toLocaleString("pt-BR")}%` : "-"}</p>
                <p className="text-[11px] text-[#7a7a90]">pedidos pagos</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{data.activeProducts}</p>
                <p className="text-[11px] text-[#7a7a90]">produtos ativos</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{data.activeCoupons}</p>
                <p className="text-[11px] text-[#7a7a90]">cupons ativos</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <Card className="p-5">
          <CardTitle icon={Trophy} right={<Link href="/painel/produtos" className="text-xs text-green-cs hover:underline">Produtos</Link>}>
            Mais vendidos
          </CardTitle>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-[#A0A0A0]">Nenhuma venda no período.</p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {data.topProducts.map((p) => (
                <MeterRow
                  key={p.name}
                  label={p.name}
                  value={p.revenue}
                  max={maxProduct}
                  detail={`${p.sold}x · ${brl(p.revenue)}`}
                />
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <CardTitle icon={Package}>Receita por categoria</CardTitle>
          {data.categories.length === 0 ? (
            <p className="text-sm text-[#A0A0A0]">Nenhuma venda no período.</p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {data.categories.map((c) => (
                <MeterRow
                  key={c.category}
                  label={CATEGORY_LABELS[c.category] ?? c.category}
                  value={c.revenue}
                  max={maxCategory}
                  detail={`${kpis.revenue > 0 ? Math.round((c.revenue / kpis.revenue) * 100) : 0}% · ${brl(c.revenue)}`}
                />
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 lg:col-span-2 2xl:col-span-1">
          <CardTitle icon={ShoppingBag} right={<Link href="/painel/vendas" className="text-xs text-green-cs hover:underline">Todas</Link>}>
            Últimas vendas
          </CardTitle>
          {data.recentSales.length === 0 ? (
            <p className="text-sm text-[#A0A0A0]">Nenhuma venda ainda.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-white/5">
              {data.recentSales.map((sale) => (
                <li key={sale.id}>
                  <Link href={`/painel/vendas?pedido=${sale.id}`} className="flex items-center gap-3 py-2.5 hover:opacity-90">
                    {sale.buyer.nick ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`https://mc-heads.net/avatar/${sale.buyer.nick}/28`} alt="" width={28} height={28} className="rounded" />
                    ) : (
                      <span className="h-7 w-7 rounded bg-white/10" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white">
                        <span className="font-semibold">{sale.buyer.nick ?? "Sem nick"}</span>{" "}
                        <span className="text-[#A0A0A0]">· {sale.items.map((i) => i.name).join(", ")}</span>
                      </p>
                      <p className="text-[11px] text-[#7a7a90]">{timeAgo(sale.paidAt ?? sale.createdAt)}</p>
                    </div>
                    <span className="text-sm font-semibold text-white">{brl(sale.total)}</span>
                    <span className="hidden sm:inline">
                      <Badge tone={ORDER_STATUS[sale.status]?.tone}>{ORDER_STATUS[sale.status]?.label}</Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <CardTitle icon={CalendarDays} right={<Link href="/painel/cronograma" className="text-xs text-green-cs hover:underline">Cronograma</Link>}>
            Próximas aulas
          </CardTitle>
          {data.nextClasses.length === 0 ? (
            <p className="text-sm text-[#A0A0A0]">
              Nenhuma aula marcada.{" "}
              <Link href="/painel/cronograma" className="text-green-cs hover:underline">
                Montar o cronograma
              </Link>
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.nextClasses.map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/10 px-3 py-2.5">
                  <span className="h-9 w-1 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {c.title}
                      {c.topic && <span className="font-normal text-[#A0A0A0]"> · {c.topic}</span>}
                    </p>
                    <p className="text-[11px] text-[#A0A0A0]">{c.teacher}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-green-light">{classWhen(c.startsAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <CardTitle icon={History} right={<Link href="/painel/atividade" className="text-xs text-green-cs hover:underline">Registro</Link>}>
            Atividade recente
          </CardTitle>
          {data.activity.length === 0 ? (
            <p className="text-sm text-[#A0A0A0]">Nada registrado ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {data.activity.map((log) => {
                const info = describeLog(log.action);
                return (
                  <li key={log.id} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/5">
                      <info.icon size={13} className="text-[#A0A0A0]" />
                    </span>
                    <p className="min-w-0 flex-1 text-[#C0C0C8]">
                      <span className="font-semibold text-white">{log.actor}</span> {info.label}
                      {log.target && <span className="text-white"> {log.target}</span>}
                    </p>
                    <span className="shrink-0 text-[11px] text-[#7a7a90]">{timeAgo(log.createdAt)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <p className="mt-6 text-[11px] text-[#7a7a90]">
        Receita é o valor dos pedidos aprovados, já com o desconto dos cupons, sem os juros do cartão e antes das taxas do
        Mercado Pago. A comparação é com o período anterior de mesmo tamanho.
      </p>
    </>
  );
}
