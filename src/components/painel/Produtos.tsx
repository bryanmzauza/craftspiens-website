"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Package,
  Pencil,
  Percent,
  Plus,
  Search,
  Star,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { CATEGORY_LABELS } from "@/components/loja/catalog-ui";
import {
  Badge,
  Btn,
  Card,
  Empty,
  ErrorBox,
  IconBtn,
  Loading,
  PageHeader,
  ProductGlyph,
  Segmented,
  Toggle,
  brl,
  inputClass,
  panelApi,
  usePanelData,
  timeAgo,
  useConfirm,
  useToast,
} from "@/components/painel/ui";
import { ProdutoEditor, parseMoney } from "@/components/painel/ProdutoEditor";
import type { PanelProduct } from "@/components/painel/types";

// Ordem das seções, a mesma da vitrine
const GROUPS: { key: string; label: string; categories: string[] }[] = [
  { key: "planos", label: "Planos", categories: ["VIP"] },
  { key: "sapiens", label: "Sapiens", categories: ["MOEDA"] },
  { key: "cosmeticos", label: "Cosméticos", categories: ["COSMETICO"] },
  { key: "outros", label: "Outros", categories: ["KIT", "RANK"] },
];

export function Produtos() {
  const toast = useToast();
  const { ask, dialog } = useConfirm();
  const { data, error, reload: load, setData } = usePanelData<{ products: PanelProduct[] }>("/api/painel/produtos");
  const products = data?.products ?? null;
  const setProducts = (update: (list: PanelProduct[]) => PanelProduct[]) => setData((d) => ({ products: update(d.products) }));
  const [filter, setFilter] = useState<"todos" | "ativos" | "inativos">("todos");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<PanelProduct | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [promo, setPromo] = useState<PanelProduct | null>(null);

  const [editorKey, setEditorKey] = useState(0);

  const visible = useMemo(() => {
    if (!products) return [];
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      if (filter === "ativos" && !p.active) return false;
      if (filter === "inativos" && p.active) return false;
      if (term && !p.name.toLowerCase().includes(term) && !p.slug.includes(term)) return false;
      return true;
    });
  }, [products, filter, search]);

  async function quick(product: PanelProduct, body: Record<string, unknown>, message: string) {
    const res = await panelApi<{ product: PanelProduct }>(`/api/painel/produtos/${product.id}`, { method: "PATCH", json: body });
    if (!res.ok) {
      toast("erro", res.error);
      return false;
    }
    setProducts((list) => list.map((p) => (p.id === product.id ? { ...p, ...res.data.product, stats: p.stats, locked: p.locked } : p)));
    toast("ok", message);
    return true;
  }

  async function remove(product: PanelProduct) {
    const ok = await ask({
      title: "Excluir produto",
      message: (
        <>
          Excluir <strong className="text-white">{product.name}</strong> de vez? Esta ação não pode ser desfeita.
        </>
      ),
      confirm: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const res = await panelApi(`/api/painel/produtos/${product.id}`, { method: "DELETE" });
    if (!res.ok) return toast("erro", res.error);
    toast("ok", "Produto excluído.");
    setProducts((list) => list.filter((p) => p.id !== product.id));
  }

  async function move(product: PanelProduct, delta: number) {
    if (!products) return;
    const group = GROUPS.find((g) => g.categories.includes(product.category))!;
    const siblings = products.filter((p) => group.categories.includes(p.category));
    const index = siblings.findIndex((p) => p.id === product.id);
    const target = index + delta;
    if (target < 0 || target >= siblings.length) return;
    const reordered = [...siblings];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    // Lista completa na nova ordem: as demais seções ficam como estão
    const full = GROUPS.flatMap((g) => (g.key === group.key ? reordered : products.filter((p) => g.categories.includes(p.category))));
    setProducts(() => full);
    const res = await panelApi("/api/painel/produtos/ordem", { method: "POST", json: { ids: full.map((p) => p.id) } });
    if (!res.ok) {
      toast("erro", res.error);
      load();
    }
  }

  const openEditor = (product: PanelProduct | null) => {
    setEditing(product);
    setEditorKey((k) => k + 1);
    setEditorOpen(true);
  };

  const counts = {
    todos: products?.length ?? 0,
    ativos: products?.filter((p) => p.active).length ?? 0,
    inativos: products?.filter((p) => !p.active).length ?? 0,
  };

  return (
    <>
      <PageHeader
        title="PRODUTOS"
        description="Preços, promoções, estoque e o que aparece na loja. Clique no preço para trocar na hora."
        actions={
          <Btn variant="primary" icon={Plus} onClick={() => openEditor(null)}>
            Novo produto
          </Btn>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7a90]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto" className={`${inputClass} pl-9`} />
        </div>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: "todos", label: "Todos", count: counts.todos },
            { value: "ativos", label: "Na loja", count: counts.ativos },
            { value: "inativos", label: "Fora da loja", count: counts.inativos },
          ]}
        />
      </div>

      {error && <ErrorBox message={error} onRetry={load} />}
      {!products && !error && <Loading />}

      {products && visible.length === 0 && (
        <Empty icon={Package} title="Nenhum produto aqui">
          {products.length === 0 ? "Crie o primeiro produto da loja." : "Nenhum produto corresponde ao filtro."}
        </Empty>
      )}

      {products &&
        GROUPS.map((group) => {
          const items = visible.filter((p) => group.categories.includes(p.category));
          if (items.length === 0) return null;
          const canReorder = filter === "todos" && !search;
          return (
            <section key={group.key} className="mb-6">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7a7a90]">
                {group.label} <span className="text-[#5a5a70]">· {items.length}</span>
              </h2>
              <Card className="divide-y divide-white/5">
                {items.map((product, index) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    first={index === 0}
                    last={index === items.length - 1}
                    canReorder={canReorder}
                    onMove={(d) => move(product, d)}
                    onEdit={() => openEditor(product)}
                    onDelete={() => remove(product)}
                    onPromo={() => setPromo(product)}
                    onQuick={(body, message) => quick(product, body, message)}
                  />
                ))}
              </Card>
            </section>
          );
        })}

      <ProdutoEditor key={editorKey} product={editing} open={editorOpen} onClose={() => setEditorOpen(false)} onSaved={load} />
      <PromoDialog
        product={promo}
        onClose={() => setPromo(null)}
        onApply={async (percent) => {
          if (!promo) return;
          if (await quick(promo, { acao: "promocao", percentual: percent }, `Promoção de ${percent}% aplicada.`)) setPromo(null);
        }}
      />
      {dialog}
    </>
  );
}

function ProductRow({
  product,
  first,
  last,
  canReorder,
  onMove,
  onEdit,
  onDelete,
  onPromo,
  onQuick,
}: {
  product: PanelProduct;
  first: boolean;
  last: boolean;
  canReorder: boolean;
  onMove: (delta: number) => void;
  onEdit: () => void;
  onDelete: () => void;
  onPromo: () => void;
  onQuick: (body: Record<string, unknown>, message: string) => Promise<boolean>;
}) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceText, setPriceText] = useState("");
  const [saving, setSaving] = useState(false);
  const color = product.color ?? "#4CAF50";
  const onSale = product.originalPrice != null && product.originalPrice > product.price;
  const soldOut = product.stock === 0;

  async function savePrice() {
    const value = parseMoney(priceText);
    if (value == null || Number.isNaN(value)) {
      setEditingPrice(false);
      return;
    }
    if (Math.round(value * 100) === Math.round(product.price * 100)) {
      setEditingPrice(false);
      return;
    }
    setSaving(true);
    const ok = await onQuick({ acao: "preco", preco: value }, `Preço de ${product.name} agora é ${brl(value)}.`);
    setSaving(false);
    if (ok) setEditingPrice(false);
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 px-3 py-3 sm:flex-nowrap sm:px-4 ${!product.active ? "opacity-60" : ""}`}>
      {canReorder && (
        <div className="hidden flex-col sm:flex">
          <button onClick={() => onMove(-1)} disabled={first} className="text-[#6b6b80] hover:text-white disabled:opacity-20" aria-label="Subir">
            <ArrowUp size={13} />
          </button>
          <button onClick={() => onMove(1)} disabled={last} className="text-[#6b6b80] hover:text-white disabled:opacity-20" aria-label="Descer">
            <ArrowDown size={13} />
          </button>
        </div>
      )}

      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}1f` }}>
        <ProductGlyph category={product.category} slug={product.slug} size={20} color={color} />
      </span>

      <button onClick={onEdit} className="min-w-0 flex-1 text-left">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-white hover:underline">{product.name}</span>
          {product.featured && <Badge tone="yellow" icon={Star}>Destaque</Badge>}
          {onSale && <Badge tone="purple">-{Math.round((1 - product.price / product.originalPrice!) * 100)}%</Badge>}
          {!product.active && <Badge>Fora da loja</Badge>}
          {soldOut && <Badge tone="red">Esgotado</Badge>}
          {product.stock > 0 && <Badge tone="blue">{product.stock} em estoque</Badge>}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-[#7a7a90]">
          <span className="font-[family-name:var(--font-jetbrains-mono)]">{product.slug}</span>
          {product.durationDays ? ` · ${product.durationDays} dias` : ""} · {CATEGORY_LABELS[product.category]}
        </span>
      </button>

      <div className="hidden w-32 text-right text-xs md:block">
        <p className="text-white">
          {product.stats.sold30} <span className="text-[#7a7a90]">em 30 dias</span>
        </p>
        <p className="text-[#7a7a90]">
          {product.stats.sold} no total · {brl(product.stats.revenue)}
        </p>
        {product.stats.lastSaleAt && <p className="text-[10px] text-[#5a5a70]">última {timeAgo(product.stats.lastSaleAt)}</p>}
      </div>

      <div className="w-28 text-right">
        {editingPrice ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={priceText}
              onChange={(e) => setPriceText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") savePrice();
                if (e.key === "Escape") setEditingPrice(false);
              }}
              inputMode="decimal"
              className={`${inputClass} px-2 py-1 text-right`}
              disabled={saving}
              aria-label="Novo preço"
            />
            <IconBtn icon={Check} label="Salvar preço" onClick={savePrice} disabled={saving} className="h-7 w-7 text-green-cs" />
          </div>
        ) : (
          <button
            onClick={() => {
              setPriceText(product.price.toFixed(2).replace(".", ","));
              setEditingPrice(true);
            }}
            className="group rounded-lg px-2 py-1 text-right hover:bg-white/5"
            title="Trocar o preço"
          >
            <span className="block text-sm font-bold text-white group-hover:text-green-light">{brl(product.price)}</span>
            {onSale && <span className="block text-[11px] text-[#7a7a90] line-through">{brl(product.originalPrice!)}</span>}
          </button>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Toggle
          checked={product.active}
          onChange={(v) => onQuick({ acao: "ativo", valor: v }, v ? `${product.name} está na loja.` : `${product.name} saiu da loja.`)}
          label={product.active ? "Tirar da loja" : "Colocar na loja"}
        />
        <IconBtn
          icon={Star}
          label={product.featured ? "Tirar destaque" : "Destacar"}
          className={product.featured ? "text-warning" : ""}
          onClick={() => onQuick({ acao: "destaque", valor: !product.featured }, product.featured ? "Destaque removido." : "Produto em destaque.")}
        />
        {onSale ? (
          <IconBtn icon={Undo2} label="Encerrar promoção" onClick={() => onQuick({ acao: "encerrarPromocao" }, "Promoção encerrada.")} />
        ) : (
          <IconBtn icon={Percent} label="Promoção" onClick={onPromo} />
        )}
        <IconBtn icon={Pencil} label="Editar" onClick={onEdit} />
        {!product.locked && <IconBtn icon={Trash2} label="Excluir" onClick={onDelete} className="hover:text-[#ff8a87]" />}
      </div>
    </div>
  );
}

const PROMO_PRESETS = [10, 15, 20, 25, 30, 50];

function PromoDialog({ product, onClose, onApply }: { product: PanelProduct | null; onClose: () => void; onApply: (percent: number) => Promise<void> }) {
  const [percent, setPercent] = useState(20);
  const [busy, setBusy] = useState(false);
  const base = product ? product.originalPrice ?? product.price : 0;
  const newPrice = Math.max(Math.round(base * (1 - percent / 100) * 100) / 100, 1);

  return (
    <AnimatePresence>
      {product && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-bg-primary p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Promoção</h2>
                <p className="text-sm text-[#A0A0A0]">{product.name}</p>
              </div>
              <IconBtn icon={X} label="Fechar" onClick={onClose} />
            </div>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {PROMO_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPercent(p)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${percent === p ? "bg-xp/30 text-white" : "bg-white/5 text-[#A0A0A0] hover:text-white"}`}
                >
                  {p}%
                </button>
              ))}
            </div>
            <input
              type="range"
              min={1}
              max={90}
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
              className="mt-4 w-full accent-[#9C27B0]"
              aria-label="Desconto"
            />

            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-center">
              <p className="text-xs text-[#A0A0A0]">
                {percent}% de desconto sobre {brl(base)}
              </p>
              <p className="mt-1 text-3xl font-bold text-white">{brl(newPrice)}</p>
              <p className="text-xs text-[#7a7a90] line-through">{brl(base)}</p>
            </div>
            <p className="mt-3 text-[11px] text-[#7a7a90]">O preço cheio aparece riscado na loja até você encerrar a promoção.</p>

            <div className="mt-5 flex justify-end gap-2">
              <Btn variant="ghost" onClick={onClose}>
                Cancelar
              </Btn>
              <Btn
                variant="primary"
                icon={Percent}
                loading={busy}
                onClick={async () => {
                  setBusy(true);
                  await onApply(percent);
                  setBusy(false);
                }}
              >
                Aplicar
              </Btn>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
