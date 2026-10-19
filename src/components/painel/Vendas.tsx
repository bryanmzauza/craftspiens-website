"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Receipt,
  RotateCcw,
  Search,
  User,
  X,
} from "lucide-react";
import {
  Badge,
  Btn,
  Card,
  DELIVERY_STATUS,
  DELIVERY_SUMMARY,
  Drawer,
  Empty,
  ErrorBox,
  Loading,
  ORDER_STATUS,
  PageHeader,
  Segmented,
  brl,
  dateTime,
  inputClass,
  panelApi,
  usePanelData,
  useToast,
} from "@/components/painel/ui";
import type { PanelDelivery, PanelSaleView } from "@/components/painel/types";

interface ListResponse {
  sales: PanelSaleView[];
  pagination: { page: number; total: number; totalPages: number };
  summary: { approvedCount: number; approvedTotal: number };
}

interface DetailResponse {
  sale: PanelSaleView;
  paymentId: string | null;
  pixExpiresAt: string | null;
  updatedAt: string;
  deliveries: PanelDelivery[];
  buyerHistory: { orders: number; total: number };
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "APPROVED", label: "Aprovados" },
  { value: "PENDING", label: "Aguardando" },
  { value: "REJECTED", label: "Recusados" },
  { value: "REFUNDED", label: "Reembolsados" },
];

function paymentLabel(sale: PanelSaleView): string {
  if (sale.paymentKind === "pix" || sale.paymentMethod === "pix") return "Pix";
  if (sale.installments && sale.installments > 1) return `Cartão ${sale.installments}x`;
  return sale.paymentKind === "cartao" ? "Cartão" : "-";
}

function Avatar({ nick, size = 28 }: { nick: string | null; size?: number }) {
  if (!nick) return <span className="inline-block shrink-0 rounded bg-white/10" style={{ width: size, height: size }} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`https://mc-heads.net/avatar/${nick}/${size}`} alt="" width={size} height={size} className="shrink-0 rounded" />;
}

export function Vendas() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [from, setFrom] = useState(params.get("de") ?? "");
  const [until, setUntil] = useState(params.get("ate") ?? "");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(params.get("pedido"));

  const filters = useCallback(() => {
    const qs = new URLSearchParams();
    if (status) qs.set("status", status);
    if (search) qs.set("q", search);
    if (from) qs.set("de", from);
    if (until) qs.set("ate", until);
    return qs;
  }, [status, search, from, until]);

  const listQuery = filters();
  listQuery.set("pagina", String(page));
  const { data, error, reload: load } = usePanelData<ListResponse>(`/api/painel/vendas?${listQuery}`);

  // Filtros na URL, para voltar ou compartilhar a mesma busca
  useEffect(() => {
    const qs = filters();
    if (openId) qs.set("pedido", openId);
    router.replace(`/painel/vendas${qs.size ? `?${qs}` : ""}`, { scroll: false });
  }, [filters, openId, router]);

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(query.trim());
  }

  const hasFilters = !!(status || search || from || until);

  return (
    <>
      <PageHeader
        title="VENDAS"
        description="Todos os pedidos da loja. Busque por nick, e-mail, número do pedido ou cupom."
        actions={
          <a
            href={`/api/painel/vendas/exportar?${filters()}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            <Download size={16} /> Exportar CSV
          </a>
        }
      />

      <Card className="mb-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={applySearch} className="relative min-w-[220px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7a90]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nick, e-mail, pedido ou cupom"
              className={`${inputClass} pl-9`}
              aria-label="Buscar vendas"
            />
          </form>
          <div className="flex items-center gap-1.5 text-xs text-[#A0A0A0]">
            <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className={`${inputClass} w-auto py-1.5`} aria-label="De" />
            até
            <input type="date" value={until} onChange={(e) => { setUntil(e.target.value); setPage(1); }} className={`${inputClass} w-auto py-1.5`} aria-label="Até" />
          </div>
          {hasFilters && (
            <Btn
              variant="ghost"
              icon={X}
              onClick={() => {
                setStatus("");
                setQuery("");
                setSearch("");
                setFrom("");
                setUntil("");
                setPage(1);
              }}
            >
              Limpar
            </Btn>
          )}
        </div>
        <div className="mt-3">
          <Segmented value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={STATUS_OPTIONS} />
        </div>
      </Card>

      {error && <ErrorBox message={error} onRetry={load} />}
      {!data && !error && <Loading />}

      {data && (
        <>
          <p className="mb-3 text-sm text-[#A0A0A0]">
            {data.pagination.total} {data.pagination.total === 1 ? "pedido" : "pedidos"}
            {data.summary.approvedCount > 0 && (
              <>
                {" "}
                · <span className="text-white">{data.summary.approvedCount} aprovados</span> somando{" "}
                <span className="font-semibold text-green-light">{brl(data.summary.approvedTotal)}</span>
              </>
            )}
          </p>

          {data.sales.length === 0 ? (
            <Empty icon={Receipt} title="Nenhum pedido encontrado">
              {hasFilters ? "Tente outros filtros." : "As vendas aparecem aqui assim que alguém comprar."}
            </Empty>
          ) : (
            <Card className="overflow-hidden">
              <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1.4fr)_110px_110px_130px_120px] gap-3 border-b border-white/10 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#7a7a90] lg:grid">
                <span>Comprador</span>
                <span>Produto</span>
                <span className="text-right">Total</span>
                <span>Pagamento</span>
                <span>Status</span>
                <span className="text-right">Data</span>
              </div>
              <ul className="divide-y divide-white/5">
                {data.sales.map((sale) => (
                  <li key={sale.id}>
                    <button
                      onClick={() => setOpenId(sale.id)}
                      className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 text-left transition-colors hover:bg-white/[0.03] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.4fr)_110px_110px_130px_120px]"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Avatar nick={sale.buyer.nick} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-white">{sale.buyer.nick ?? "Sem nick"}</span>
                          <span className="block truncate text-[11px] text-[#7a7a90]">{sale.buyer.email}</span>
                        </span>
                      </span>
                      <span className="text-right text-sm font-semibold text-white lg:hidden">{brl(sale.total)}</span>
                      <span className="min-w-0 truncate text-sm text-[#C0C0C8]">
                        {sale.items.map((i) => (i.quantity > 1 ? `${i.quantity}x ${i.name}` : i.name)).join(", ")}
                        {sale.coupon && <span className="ml-1.5 text-[11px] text-[#d68ae4]">{sale.coupon.code}</span>}
                      </span>
                      <span className="flex justify-end gap-1.5 lg:hidden">
                        <Badge tone={ORDER_STATUS[sale.status].tone}>{ORDER_STATUS[sale.status].label}</Badge>
                      </span>
                      <span className="hidden text-right text-sm font-semibold text-white lg:block">{brl(sale.total)}</span>
                      <span className="hidden text-sm text-[#A0A0A0] lg:block">{paymentLabel(sale)}</span>
                      <span className="hidden flex-wrap gap-1 lg:flex">
                        <Badge tone={ORDER_STATUS[sale.status].tone}>{ORDER_STATUS[sale.status].label}</Badge>
                        {sale.status === "APPROVED" && sale.delivery !== "delivered" && (
                          <Badge tone={DELIVERY_SUMMARY[sale.delivery].tone}>{DELIVERY_SUMMARY[sale.delivery].label}</Badge>
                        )}
                      </span>
                      <span className="hidden text-right text-xs text-[#A0A0A0] lg:block">{dateTime(sale.createdAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {data.pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm text-[#A0A0A0]">
              <Btn variant="ghost" icon={ChevronLeft} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Btn>
              Página {data.pagination.page} de {data.pagination.totalPages}
              <Btn variant="ghost" disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
                Próxima <ChevronRight size={16} />
              </Btn>
            </div>
          )}
        </>
      )}

      <SaleDrawer id={openId} onClose={() => setOpenId(null)} onChanged={load} />
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="text-[#A0A0A0]">{label}</span>
      <span className="text-right text-white">{children}</span>
    </div>
  );
}

function SaleDrawer({ id, onClose, onChanged }: { id: string | null; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const { data: detail, error, reload: load } = usePanelData<DetailResponse>(id ? `/api/painel/vendas/${id}` : null);
  const [busy, setBusy] = useState<string | null>(null);

  async function retry(deliveryId: string) {
    setBusy(deliveryId);
    const res = await panelApi(`/api/painel/entregas/${deliveryId}`, { method: "POST", json: { acao: "reenviar" } });
    setBusy(null);
    if (!res.ok) return toast("erro", res.error);
    toast("ok", "Entrega devolvida à fila do plugin.");
    load();
    onChanged();
  }

  const sale = detail?.sale;
  const gross = sale ? sale.items.reduce((sum, i) => sum + i.price * i.quantity, 0) : 0;

  return (
    <Drawer open={!!id} onClose={onClose} title={sale ? `Pedido ${sale.id.slice(-8).toUpperCase()}` : "Pedido"}>
      {error && <ErrorBox message={error} onRetry={load} />}
      {!sale && !error && <Loading />}
      {sale && detail && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={ORDER_STATUS[sale.status].tone}>{ORDER_STATUS[sale.status].label}</Badge>
            {sale.status === "APPROVED" && <Badge tone={DELIVERY_SUMMARY[sale.delivery].tone}>{DELIVERY_SUMMARY[sale.delivery].label}</Badge>}
            <span className="ml-auto text-2xl font-bold text-white">{brl(sale.total)}</span>
          </div>

          <Card className="flex items-center gap-3 p-4">
            <Avatar nick={sale.buyer.nick} size={44} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">{sale.buyer.nick ?? "Sem nick vinculado"}</p>
              <p className="truncate text-xs text-[#A0A0A0]">{sale.buyer.email}</p>
              <p className="mt-1 text-[11px] text-[#7a7a90]">
                {detail.buyerHistory.orders} {detail.buyerHistory.orders === 1 ? "compra aprovada" : "compras aprovadas"} ·{" "}
                {brl(detail.buyerHistory.total)} no total
              </p>
            </div>
            {sale.buyer.nick && (
              <a
                href={`/comunidade/membro/${sale.buyer.nick}`}
                target="_blank"
                className="text-[#A0A0A0] hover:text-white"
                title="Perfil na comunidade"
                aria-label="Perfil na comunidade"
              >
                <User size={18} />
              </a>
            )}
          </Card>

          <section>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#7a7a90]">Itens</h3>
            {sale.items.map((item) => (
              <Row key={item.slug} label={item.quantity > 1 ? `${item.quantity}x ${item.name}` : item.name}>
                {brl(item.price * item.quantity)}
              </Row>
            ))}
            {sale.coupon && (
              <Row label={`Cupom ${sale.coupon.code} (${sale.coupon.discount}%)`}>
                <span className="text-[#d68ae4]">- {brl(Math.max(gross - sale.total, 0))}</span>
              </Row>
            )}
            <div className="mt-1 border-t border-white/10 pt-1">
              <Row label="Total do pedido">{brl(sale.total)}</Row>
            </div>
          </section>

          <section>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#7a7a90]">Pagamento</h3>
            <Row label="Forma">{paymentLabel(sale)}{sale.paymentMethod && sale.paymentMethod !== "pix" ? ` (${sale.paymentMethod})` : ""}</Row>
            {sale.paidAmount != null && sale.paidAmount > sale.total && (
              <Row label="Pago com juros">
                {brl(sale.paidAmount)} <span className="text-[#7a7a90]">(+{brl(sale.paidAmount - sale.total)})</span>
              </Row>
            )}
            {detail.paymentId && (
              <Row label="ID no Mercado Pago">
                <span className="font-[family-name:var(--font-jetbrains-mono)] text-xs">{detail.paymentId}</span>
              </Row>
            )}
            <Row label="Criado em">{dateTime(sale.createdAt)}</Row>
            {sale.paidAt && <Row label="Pago em">{dateTime(sale.paidAt)}</Row>}
            {sale.status === "PENDING" && detail.pixExpiresAt && <Row label="Pix vence em">{dateTime(detail.pixExpiresAt)}</Row>}
            <Row label="Número do pedido">
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-xs">{sale.id}</span>
            </Row>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7a7a90]">Entregas no servidor</h3>
            {detail.deliveries.length === 0 ? (
              <p className="text-sm text-[#A0A0A0]">
                {sale.status === "APPROVED"
                  ? "Nenhuma entrega criada. Isso acontece quando a conta não tinha nick vinculado na hora da aprovação."
                  : "As entregas são criadas quando o pagamento é aprovado."}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {detail.deliveries.map((d) => (
                  <li key={d.id} className="rounded-xl border border-white/10 bg-black/10 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-white">{d.productName}</span>
                      {d.kind === "REVOKE" && <Badge tone="red">Estorno</Badge>}
                      <Badge tone={DELIVERY_STATUS[d.status].tone}>{DELIVERY_STATUS[d.status].label}</Badge>
                      {d.requiresOnline && d.status === "PENDING" && <Badge tone="blue">Ao entrar no servidor</Badge>}
                    </div>
                    <p className="mt-1 text-[11px] text-[#7a7a90]">
                      {d.username} · {d.platform === "BEDROCK" ? "Bedrock" : "Java"} · {d.attempts}{" "}
                      {d.attempts === 1 ? "tentativa" : "tentativas"}
                      {d.deliveredAt && ` · entregue ${dateTime(d.deliveredAt)} em ${d.deliveredBy}`}
                    </p>
                    {d.lastError && d.status !== "DELIVERED" && (
                      <p className="mt-2 rounded-lg bg-error/10 px-2.5 py-1.5 font-[family-name:var(--font-jetbrains-mono)] text-[11px] text-[#ffb4b1]">
                        {d.lastError}
                      </p>
                    )}
                    {(d.status === "FAILED" || d.status === "PROCESSING") && (
                      <Btn className="mt-2" icon={RotateCcw} loading={busy === d.id} onClick={() => retry(d.id)}>
                        Reenviar para o plugin
                      </Btn>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}
