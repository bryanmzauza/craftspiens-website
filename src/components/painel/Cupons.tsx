"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Pencil, Plus, Shuffle, TicketPercent, Trash2 } from "lucide-react";
import {
  Badge,
  Btn,
  Card,
  Drawer,
  Empty,
  ErrorBox,
  Field,
  IconBtn,
  Loading,
  PageHeader,
  Segmented,
  Toggle,
  brl,
  inputClass,
  panelApi,
  usePanelData,
  useConfirm,
  useToast,
  type Tone,
} from "@/components/painel/ui";
import type { PanelCoupon } from "@/components/painel/types";

const STATES: Record<PanelCoupon["state"], { label: string; tone: Tone }> = {
  ativo: { label: "Ativo", tone: "green" },
  desligado: { label: "Desligado", tone: "gray" },
  vencido: { label: "Vencido", tone: "yellow" },
  esgotado: { label: "Esgotado", tone: "red" },
};

/** Data (AAAA-MM-DD) do vencimento no fuso de São Paulo */
function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(iso));
}

export function Cupons() {
  const toast = useToast();
  const { ask, dialog } = useConfirm();
  const { data, error, reload: load } = usePanelData<{ coupons: PanelCoupon[] }>("/api/painel/cupons");
  const coupons = data?.coupons ?? null;
  const [filter, setFilter] = useState<"todos" | "ativos" | "outros">("todos");
  const [editing, setEditing] = useState<PanelCoupon | null>(null);
  const [open, setOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const visible = useMemo(
    () =>
      (coupons ?? []).filter((c) => (filter === "ativos" ? c.state === "ativo" : filter === "outros" ? c.state !== "ativo" : true)),
    [coupons, filter]
  );

  const totals = useMemo(() => {
    const list = coupons ?? [];
    return {
      revenue: list.reduce((s, c) => s + c.stats.revenue, 0),
      discount: list.reduce((s, c) => s + c.stats.discount, 0),
      orders: list.reduce((s, c) => s + c.stats.orders, 0),
    };
  }, [coupons]);

  async function toggle(coupon: PanelCoupon, value: boolean) {
    const res = await panelApi(`/api/painel/cupons/${coupon.id}`, { method: "PATCH", json: { acao: "ativo", valor: value } });
    if (!res.ok) return toast("erro", res.error);
    toast("ok", value ? `Cupom ${coupon.code} ativado.` : `Cupom ${coupon.code} desligado.`);
    load();
  }

  async function remove(coupon: PanelCoupon) {
    const ok = await ask({
      title: "Excluir cupom",
      message: (
        <>
          Excluir o cupom <strong className="font-[family-name:var(--font-jetbrains-mono)] text-white">{coupon.code}</strong>?
        </>
      ),
      confirm: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const res = await panelApi(`/api/painel/cupons/${coupon.id}`, { method: "DELETE" });
    if (!res.ok) return toast("erro", res.error);
    toast("ok", "Cupom excluído.");
    load();
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast("ok", `${code} copiado.`);
    } catch {
      toast("erro", "Não foi possível copiar.");
    }
  }

  return (
    <>
      <PageHeader
        title="CUPONS"
        description="Descontos percentuais aplicados na compra. Um cupom já usado não pode ser excluído nem trocar de código, só desligado."
        actions={
          <Btn
            variant="primary"
            icon={Plus}
            onClick={() => {
              setEditing(null);
              setEditorKey((k) => k + 1);
              setOpen(true);
            }}
          >
            Novo cupom
          </Btn>
        }
      />

      {coupons && coupons.length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          <Card className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#A0A0A0]">Vendas com cupom</p>
            <p className="mt-1 text-xl font-bold text-white">{totals.orders}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#A0A0A0]">Receita com cupom</p>
            <p className="mt-1 text-xl font-bold text-white">{brl(totals.revenue)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#A0A0A0]">Desconto concedido</p>
            <p className="mt-1 text-xl font-bold text-white">{brl(totals.discount)}</p>
          </Card>
        </div>
      )}

      <div className="mb-4">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: "todos", label: "Todos", count: coupons?.length },
            { value: "ativos", label: "Ativos", count: coupons?.filter((c) => c.state === "ativo").length },
            { value: "outros", label: "Desligados, vencidos e esgotados", count: coupons?.filter((c) => c.state !== "ativo").length },
          ]}
        />
      </div>

      {error && <ErrorBox message={error} onRetry={load} />}
      {!coupons && !error && <Loading />}
      {coupons && visible.length === 0 && (
        <Empty icon={TicketPercent} title="Nenhum cupom aqui">
          Crie um cupom para campanhas, parcerias ou eventos.
        </Empty>
      )}

      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {visible.map((coupon) => {
          const state = STATES[coupon.state];
          const usage = coupon.maxUses ? Math.min(coupon.uses / coupon.maxUses, 1) : null;
          return (
            <Card key={coupon.id} className={`relative overflow-hidden p-5 ${coupon.state !== "ativo" ? "opacity-70" : ""}`}>
              {/* Recorte de "ticket" nas laterais */}
              <span className="absolute -left-2.5 top-[52px] h-5 w-5 rounded-full border border-white/10 bg-bg-primary" />
              <span className="absolute -right-2.5 top-[52px] h-5 w-5 rounded-full border border-white/10 bg-bg-primary" />

              <div className="flex items-start justify-between gap-3">
                <button onClick={() => copy(coupon.code)} className="group flex min-w-0 items-center gap-2 text-left" title="Copiar código">
                  <span className="truncate font-[family-name:var(--font-jetbrains-mono)] text-lg font-bold tracking-wider text-white">{coupon.code}</span>
                  <Copy size={14} className="shrink-0 text-[#6b6b80] group-hover:text-white" />
                </button>
                <span className="shrink-0 text-2xl font-bold text-[#d68ae4]">{coupon.discount.toLocaleString("pt-BR")}%</span>
              </div>

              <div className="mt-6 border-t border-dashed border-white/10 pt-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone={state.tone}>{state.label}</Badge>
                  {coupon.expiresAt && (
                    <Badge>
                      {coupon.state === "vencido" ? "venceu" : "até"}{" "}
                      {new Date(coupon.expiresAt).toLocaleDateString("pt-BR")}
                    </Badge>
                  )}
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs text-[#A0A0A0]">
                    <span>
                      {coupon.uses} {coupon.uses === 1 ? "uso" : "usos"}
                      {coupon.maxUses ? ` de ${coupon.maxUses}` : " (sem limite)"}
                    </span>
                    <span>
                      {coupon.stats.orders} {coupon.stats.orders === 1 ? "pago" : "pagos"} · {brl(coupon.stats.revenue)}
                    </span>
                  </div>
                  {usage != null && (
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-xp" style={{ width: `${usage * 100}%` }} />
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-1">
                  <Toggle checked={coupon.active} onChange={(v) => toggle(coupon, v)} label={coupon.active ? "Desligar" : "Ativar"} />
                  <span className="ml-1.5 text-xs text-[#A0A0A0]">{coupon.active ? "Ligado" : "Desligado"}</span>
                  <span className="flex-1" />
                  <IconBtn
                    icon={Pencil}
                    label="Editar"
                    onClick={() => {
                      setEditing(coupon);
                      setEditorKey((k) => k + 1);
                      setOpen(true);
                    }}
                  />
                  {!coupon.locked && <IconBtn icon={Trash2} label="Excluir" onClick={() => remove(coupon)} className="hover:text-[#ff8a87]" />}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-[11px] text-[#7a7a90]">
        &quot;Usos&quot; conta todo pedido criado com o cupom, inclusive os que não foram pagos; &quot;pagos&quot; conta só as vendas aprovadas.
      </p>

      <CouponEditor key={editorKey} coupon={editing} open={open} onClose={() => setOpen(false)} onSaved={load} />
      {dialog}
    </>
  );
}

const DISCOUNT_PRESETS = [5, 10, 15, 20, 25, 30, 50];

function randomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `SAPIENS-${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")}`;
}

function CouponEditor({ coupon, open, onClose, onSaved }: { coupon: PanelCoupon | null; open: boolean; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  // O pai troca a key a cada abertura: os campos começam do cupom escolhido
  const [code, setCode] = useState(coupon?.code ?? "");
  const [discount, setDiscount] = useState(coupon ? String(coupon.discount) : "10");
  const [limited, setLimited] = useState(coupon?.maxUses != null);
  const [maxUses, setMaxUses] = useState(coupon?.maxUses != null ? String(coupon.maxUses) : "100");
  const [expires, setExpires] = useState(() => toDateInput(coupon?.expiresAt ?? null));
  const [active, setActive] = useState(coupon?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<{ field: string | null; message: string } | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const body = {
      code,
      discount: Number(discount.replace(",", ".")),
      maxUses: limited ? Number(maxUses) : null,
      // Vale até o fim do dia escolhido, no horário de Brasília
      expiresAt: expires ? `${expires}T23:59:59-03:00` : null,
      active,
    };
    const res = coupon
      ? await panelApi(`/api/painel/cupons/${coupon.id}`, { method: "PUT", json: body })
      : await panelApi("/api/painel/cupons", { method: "POST", json: body });
    setSaving(false);
    if (!res.ok) return setError({ field: res.field ?? null, message: res.error });
    toast("ok", coupon ? "Cupom salvo." : `Cupom ${body.code.toUpperCase()} criado.`);
    onSaved();
    onClose();
  }

  const fieldError = (name: string) => (error?.field === name ? error.message : null);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={coupon ? `Editar ${coupon.code}` : "Novo cupom"}
      footer={
        <>
          {error && <span className="mr-auto text-sm text-[#ff8a87]">{error.field ? "Confira o campo marcado." : error.message}</span>}
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn variant="primary" icon={Check} loading={saving} onClick={save}>
            {coupon ? "Salvar" : "Criar cupom"}
          </Btn>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field
          label="Código"
          error={fieldError("code")}
          hint={coupon?.locked ? "Travado: o cupom já foi usado em pedidos." : "Letras, números, hífen e sublinhado. O comprador digita este código."}
        >
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
              className={`${inputClass} font-[family-name:var(--font-jetbrains-mono)] tracking-wider`}
              disabled={coupon?.locked}
              maxLength={30}
              placeholder="EX.: VOLTAASAULAS"
            />
            {!coupon?.locked && (
              <Btn icon={Shuffle} onClick={() => setCode(randomCode())}>
                Gerar
              </Btn>
            )}
          </div>
        </Field>

        <Field label="Desconto (%)" error={fieldError("discount")}>
          <div className="flex flex-wrap items-center gap-1.5">
            {DISCOUNT_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setDiscount(String(p))}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${Number(discount) === p ? "bg-xp/30 text-white" : "bg-white/5 text-[#A0A0A0] hover:text-white"}`}
              >
                {p}%
              </button>
            ))}
            <input value={discount} onChange={(e) => setDiscount(e.target.value)} inputMode="decimal" className={`${inputClass} w-20`} aria-label="Outro valor" />
          </div>
        </Field>

        <Field label="Limite de usos" error={fieldError("maxUses")} hint="Cada pedido criado com o cupom conta um uso.">
          <div className="flex items-center gap-3">
            <Toggle checked={limited} onChange={setLimited} label="Limitar usos" />
            {limited ? (
              <input value={maxUses} onChange={(e) => setMaxUses(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={`${inputClass} w-32`} />
            ) : (
              <span className="text-sm text-[#A0A0A0]">Sem limite</span>
            )}
          </div>
        </Field>

        <Field label="Válido até" error={fieldError("expiresAt")} hint="Vale até 23h59 do dia escolhido. Vazio = sem prazo.">
          <div className="flex items-center gap-2">
            <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className={`${inputClass} w-auto`} />
            {expires && (
              <Btn variant="ghost" onClick={() => setExpires("")}>
                Sem prazo
              </Btn>
            )}
          </div>
        </Field>

        <label className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/10 p-4 text-sm text-white">
          <Toggle checked={active} onChange={setActive} label="Cupom ligado" />
          Cupom ligado (aceito na compra)
        </label>
      </div>
    </Drawer>
  );
}
