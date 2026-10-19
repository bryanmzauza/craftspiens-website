"use client";

import { useState } from "react";
import { AlertTriangle, Check, ChevronDown, ChevronUp, Lock, Plus, Trash2, X } from "lucide-react";
import { CATEGORY_LABELS } from "@/components/loja/catalog-ui";
import { Btn, Drawer, Field, IconBtn, ProductGlyph, Toggle, brl, inputClass, panelApi, useToast } from "@/components/painel/ui";
import type { Benefit, PanelProduct } from "@/components/painel/types";

const DEFAULT_COLOR = "#4CAF50";
const SWATCHES = ["#4CAF50", "#FFD700", "#2196F3", "#9C27B0", "#FF9800", "#E91E63", "#00BCD4", "#FF5722"];

type Form = {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: string;
  originalPrice: string;
  category: PanelProduct["category"];
  imageUrl: string;
  durationDays: string;
  benefits: Benefit[];
  unlimited: boolean;
  stock: string;
  featured: boolean;
  badge: string;
  color: string;
  active: boolean;
};

const EMPTY: Form = {
  name: "",
  slug: "",
  description: "",
  shortDescription: "",
  price: "",
  originalPrice: "",
  category: "COSMETICO",
  imageUrl: "",
  durationDays: "",
  benefits: [],
  unlimited: true,
  stock: "0",
  featured: false,
  badge: "",
  color: DEFAULT_COLOR,
  active: false,
};

function toForm(p: PanelProduct): Form {
  return {
    name: p.name,
    slug: p.slug,
    description: p.description,
    shortDescription: p.shortDescription ?? "",
    price: p.price.toFixed(2).replace(".", ","),
    originalPrice: p.originalPrice != null ? p.originalPrice.toFixed(2).replace(".", ",") : "",
    category: p.category,
    imageUrl: p.imageUrl ?? "",
    durationDays: p.durationDays != null ? String(p.durationDays) : "",
    benefits: p.benefits,
    unlimited: p.stock === -1,
    stock: p.stock === -1 ? "0" : String(p.stock),
    featured: p.featured,
    badge: p.badge ?? "",
    color: p.color ?? DEFAULT_COLOR,
    active: p.active,
  };
}

/** "35,90" ou "35.90" -> 35.9; vazio -> null */
export function parseMoney(text: string): number | null {
  const clean = text.trim().replace(/\s|R\$/g, "");
  if (!clean) return null;
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : NaN;
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

/** O pai troca a key a cada abertura: o formulário começa do produto escolhido */
export function ProdutoEditor({
  product,
  open,
  onClose,
  onSaved,
}: {
  product: PanelProduct | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<Form>(() => (product ? toForm(product) : EMPTY));
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<{ field: string | null; message: string } | null>(null);
  const [newBenefit, setNewBenefit] = useState("");

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const price = parseMoney(form.price);
  const original = parseMoney(form.originalPrice);
  const discount = price && original && original > price ? Math.round((1 - price / original) * 100) : null;
  const slugLocked = !!product?.locked;
  const slugChanged = !!product && form.slug !== product.slug;

  async function save() {
    setError(null);
    if (price == null || Number.isNaN(price)) {
      setError({ field: "price", message: "Informe o preço." });
      return;
    }
    if (original != null && Number.isNaN(original)) {
      setError({ field: "originalPrice", message: "Preço antigo inválido." });
      return;
    }
    setSaving(true);
    const body = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      shortDescription: form.shortDescription,
      price,
      originalPrice: original,
      category: form.category,
      imageUrl: form.imageUrl,
      durationDays: form.durationDays ? Number(form.durationDays) : null,
      benefits: form.benefits,
      stock: form.unlimited ? -1 : Number(form.stock || 0),
      featured: form.featured,
      badge: form.badge,
      color: form.color,
      active: form.active,
    };
    const res = product
      ? await panelApi(`/api/painel/produtos/${product.id}`, { method: "PUT", json: body })
      : await panelApi(`/api/painel/produtos`, { method: "POST", json: body });
    setSaving(false);
    if (!res.ok) {
      setError({ field: res.field ?? null, message: res.error });
      return;
    }
    toast("ok", product ? "Produto salvo." : "Produto criado.");
    onSaved();
    onClose();
  }

  function addBenefit() {
    const label = newBenefit.trim();
    if (!label) return;
    set("benefits", [...form.benefits, { label, included: true }]);
    setNewBenefit("");
  }

  function moveBenefit(index: number, delta: number) {
    const list = [...form.benefits];
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    set("benefits", list);
  }

  const fieldError = (name: string) => (error?.field === name ? error.message : null);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      wide
      title={product ? `Editar ${product.name}` : "Novo produto"}
      footer={
        <>
          {error && !error.field && <span className="mr-auto text-sm text-[#ff8a87]">{error.message}</span>}
          {error?.field && <span className="mr-auto text-sm text-[#ff8a87]">Confira o campo marcado.</span>}
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn variant="primary" icon={Check} loading={saving} onClick={save}>
            {product ? "Salvar" : "Criar produto"}
          </Btn>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome" error={fieldError("name")}>
              <input
                value={form.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  if (!slugTouched) set("slug", slugify(e.target.value));
                }}
                className={inputClass}
                maxLength={255}
              />
            </Field>
            <Field
              label="Slug"
              error={fieldError("slug")}
              hint={slugLocked ? "Travado: o produto já tem pedidos." : "Identifica o produto no plugin de entregas."}
            >
              <div className="relative">
                <input
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value.toLowerCase());
                  }}
                  disabled={slugLocked}
                  className={`${inputClass} font-[family-name:var(--font-jetbrains-mono)] ${slugLocked ? "pr-9" : ""}`}
                  maxLength={100}
                />
                {slugLocked && <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a7a90]" />}
              </div>
            </Field>
          </div>

          {(!product || slugChanged) && (
            <p className="flex items-start gap-2 rounded-lg border border-warning/25 bg-warning/10 px-3 py-2 text-xs text-[#ffe08a]">
              <AlertTriangle size={15} className="mt-px shrink-0" />
              O plugin da loja só entrega slugs que ele conhece. Antes de ativar, cadastre o slug no products.yml do
              plugin (docs/plugin-entregas.md).
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Categoria">
              <select value={form.category} onChange={(e) => set("category", e.target.value as Form["category"])} className={inputClass}>
                {(["VIP", "MOEDA", "COSMETICO", "KIT", "RANK"] as const).map((c) => (
                  <option key={c} value={c} className="bg-bg-primary">
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Preço (R$)" error={fieldError("price")}>
              <input value={form.price} onChange={(e) => set("price", e.target.value)} inputMode="decimal" placeholder="0,00" className={inputClass} />
            </Field>
            <Field
              label="Preço antigo (R$)"
              error={fieldError("originalPrice")}
              hint={discount ? `Aparece riscado: ${discount}% de desconto.` : "Opcional, aparece riscado."}
            >
              <input value={form.originalPrice} onChange={(e) => set("originalPrice", e.target.value)} inputMode="decimal" placeholder="-" className={inputClass} />
            </Field>
          </div>

          <Field label="Resumo" hint="Uma linha, mostrada nos cards e no checkout." error={fieldError("shortDescription")}>
            <input value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} className={inputClass} maxLength={255} />
          </Field>

          <Field label="Descrição" error={fieldError("description")}>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} className={inputClass} maxLength={5000} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Duração (dias)" hint="Planos e combos. Vazio = permanente." error={fieldError("durationDays")}>
              <input value={form.durationDays} onChange={(e) => set("durationDays", e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={inputClass} />
            </Field>
            <Field label="Selo" hint='Ex.: "Mais vendido".' error={fieldError("badge")}>
              <input value={form.badge} onChange={(e) => set("badge", e.target.value)} className={inputClass} maxLength={50} />
            </Field>
            <Field label="Estoque" error={fieldError("stock")}>
              <div className="flex items-center gap-2">
                <input
                  value={form.unlimited ? "" : form.stock}
                  onChange={(e) => set("stock", e.target.value.replace(/\D/g, ""))}
                  disabled={form.unlimited}
                  placeholder={form.unlimited ? "Ilimitado" : "0"}
                  inputMode="numeric"
                  className={inputClass}
                />
                <label className="flex shrink-0 items-center gap-1.5 text-xs text-[#A0A0A0]">
                  <Toggle checked={form.unlimited} onChange={(v) => set("unlimited", v)} label="Estoque ilimitado" />
                  Sem limite
                </label>
              </div>
            </Field>
          </div>

          <Field label="Cor" error={fieldError("color")}>
            <div className="flex flex-wrap items-center gap-2">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("color", c)}
                  className={`h-7 w-7 rounded-lg border-2 transition-transform ${form.color.toUpperCase() === c ? "scale-110 border-white" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                  aria-label={`Cor ${c}`}
                />
              ))}
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(form.color) ? form.color : DEFAULT_COLOR}
                onChange={(e) => set("color", e.target.value.toUpperCase())}
                className="h-7 w-10 cursor-pointer rounded border border-white/15 bg-transparent"
                aria-label="Outra cor"
              />
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-[#A0A0A0]">{form.color}</span>
            </div>
          </Field>

          <Field label="Imagem (opcional)" hint="Endereço https de uma imagem. Sem ela, a loja usa o ícone da categoria." error={fieldError("imageUrl")}>
            <input value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://" className={inputClass} maxLength={500} />
          </Field>

          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#A0A0A0]">Benefícios</span>
            <ul className="flex flex-col gap-1.5">
              {form.benefits.map((b, i) => (
                <li key={i} className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/10 px-2 py-1.5">
                  <div className="flex flex-col">
                    <button type="button" onClick={() => moveBenefit(i, -1)} disabled={i === 0} className="text-[#7a7a90] hover:text-white disabled:opacity-30" aria-label="Subir">
                      <ChevronUp size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBenefit(i, 1)}
                      disabled={i === form.benefits.length - 1}
                      className="text-[#7a7a90] hover:text-white disabled:opacity-30"
                      aria-label="Descer"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => set("benefits", form.benefits.map((x, j) => (j === i ? { ...x, included: !x.included } : x)))}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${b.included ? "bg-green-cs/20 text-green-cs" : "bg-white/5 text-[#7a7a90]"}`}
                    title={b.included ? "Incluso (clique para marcar como não incluso)" : "Não incluso (clique para incluir)"}
                  >
                    {b.included ? <Check size={13} /> : <X size={13} />}
                  </button>
                  <input
                    value={b.label}
                    onChange={(e) => set("benefits", form.benefits.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                    className="min-w-0 flex-1 bg-transparent text-sm text-white focus:outline-none"
                    maxLength={120}
                  />
                  <IconBtn icon={Trash2} label="Remover" onClick={() => set("benefits", form.benefits.filter((_, j) => j !== i))} />
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <input
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addBenefit();
                  }
                }}
                placeholder="Novo benefício e Enter"
                className={inputClass}
                maxLength={120}
              />
              <Btn icon={Plus} onClick={addBenefit}>
                Adicionar
              </Btn>
            </div>
            {fieldError("benefits") && <p className="mt-1 text-xs text-[#ff8a87]">{fieldError("benefits")}</p>}
          </div>

          <div className="flex flex-wrap gap-6 rounded-xl border border-white/10 bg-black/10 p-4">
            <label className="flex items-center gap-2.5 text-sm text-white">
              <Toggle checked={form.active} onChange={(v) => set("active", v)} label="Visível na loja" />
              Visível na loja
            </label>
            <label className="flex items-center gap-2.5 text-sm text-white">
              <Toggle checked={form.featured} onChange={(v) => set("featured", v)} label="Destaque" />
              Destaque (borda na cor e selo)
            </label>
          </div>
        </div>

        <div className="lg:sticky lg:top-0 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7a7a90]">Pré-visualização</p>
          <Preview form={form} price={price} original={original} />
          <p className="mt-2 text-[11px] text-[#7a7a90]">Aproximação do card da loja. A posição na vitrine depende da categoria e da ordem.</p>
        </div>
      </div>
    </Drawer>
  );
}

function Preview({ form, price, original }: { form: Form; price: number | null; original: number | null }) {
  const color = /^#[0-9a-f]{6}$/i.test(form.color) ? form.color : DEFAULT_COLOR;
  const validPrice = price != null && !Number.isNaN(price);
  const validOriginal = original != null && !Number.isNaN(original) && validPrice && original > price!;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 ${form.featured ? "border-2 bg-bg-card/80" : "border border-white/10 bg-bg-card/50"} ${!form.active ? "opacity-60" : ""}`}
      style={form.featured ? { borderColor: color } : undefined}
    >
      {form.badge && (
        <span className="absolute right-3 top-3 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase text-black" style={{ backgroundColor: color }}>
          {form.badge}
        </span>
      )}
      <div className="flex h-24 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}14` }}>
        {form.imageUrl.startsWith("https://") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.imageUrl} alt="" className="max-h-20 max-w-full object-contain" />
        ) : (
          <ProductGlyph category={form.category} slug={form.slug} size={40} color={color} />
        )}
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-[#7a7a90]">{CATEGORY_LABELS[form.category]}</p>
      <h3 className="mt-0.5 text-lg font-bold text-white">{form.name || "Nome do produto"}</h3>
      {form.shortDescription && <p className="mt-1 text-xs text-[#A0A0A0]">{form.shortDescription}</p>}
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold" style={{ color }}>
          {validPrice ? brl(price!) : "R$ -"}
        </span>
        {form.durationDays && <span className="text-xs text-[#A0A0A0]">/ {form.durationDays} dias</span>}
      </div>
      {validOriginal && <span className="text-xs text-[#A0A0A0] line-through">{brl(original!)}</span>}
      {form.benefits.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5 border-t border-white/5 pt-3">
          {form.benefits.slice(0, 6).map((b, i) => (
            <li key={i} className={`flex items-start gap-2 text-xs ${b.included ? "text-[#E0E0E0]" : "text-[#6b6b80] line-through"}`}>
              {b.included ? <Check size={13} className="mt-px shrink-0" style={{ color }} /> : <X size={13} className="mt-px shrink-0" />}
              {b.label}
            </li>
          ))}
          {form.benefits.length > 6 && <li className="text-[11px] text-[#7a7a90]">+ {form.benefits.length - 6} benefícios</li>}
        </ul>
      )}
      <div className="mt-4 rounded-lg py-2 text-center text-xs font-bold uppercase text-white" style={{ backgroundColor: color }}>
        {form.active ? "Comprar" : "Fora da loja"}
      </div>
    </div>
  );
}
