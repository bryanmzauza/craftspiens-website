"use client";

// Peças compartilhadas pelas telas do painel: chamadas à API, avisos, cartões,
// selos, diálogos e campos de formulário.

import { createContext, createElement, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2, X, type LucideIcon } from "lucide-react";
import { productIcon } from "@/components/loja/catalog-ui";

// --- API ---

export type PanelResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; field?: string | null };

/** fetch com JSON; sessão expirada recarrega a página, que volta a pedir o código */
export async function panelApi<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<PanelResult<T>> {
  try {
    const { json, ...rest } = init ?? {};
    const res = await fetch(url, {
      ...rest,
      headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...(rest.headers ?? {}) },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && data.code === "PainelBloqueado") {
      window.location.reload();
    }
    if (!res.ok) return { ok: false, status: res.status, error: data.error ?? "Erro inesperado", field: data.field };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, status: 0, error: "Erro de conexão. Tente novamente." };
  }
}

type Loaded<T> = { url: string; data: T | null; error: string | null };

/**
 * Dados de uma rota do painel. Troca de URL (filtro, página, semana) mostra o
 * carregamento em vez dos dados antigos; reload() busca de novo mantendo os
 * dados na tela; setData() ajusta a cópia local depois de uma ação.
 */
export function usePanelData<T>(url: string | null) {
  const [state, setState] = useState<Loaded<T> | null>(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    panelApi<T>(url).then((res) => {
      if (!cancelled) setState(res.ok ? { url, data: res.data, error: null } : { url, data: null, error: res.error });
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  const reload = useCallback(async () => {
    if (!url) return;
    const res = await panelApi<T>(url);
    setState((prev) =>
      res.ok ? { url, data: res.data, error: null } : { url, data: prev?.url === url ? prev.data : null, error: res.error }
    );
  }, [url]);

  const setData = useCallback(
    (update: (data: T) => T) => setState((prev) => (prev?.data != null ? { ...prev, data: update(prev.data) } : prev)),
    []
  );

  const current = state?.url === url ? state : null;
  return { data: current?.data ?? null, error: current?.error ?? null, reload, setData };
}

// --- Formatação ---

export function brl(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** R$ 1,2 mil para os eixos e os cartões pequenos */
export function brlShort(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `R$ ${(value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  }
  return brl(value);
}

export function dateTime(value: string | Date): string {
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function shortDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function timeAgo(value: string | Date): string {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `há ${days} ${days === 1 ? "dia" : "dias"}`;
  return new Date(value).toLocaleDateString("pt-BR");
}

// --- Avisos (toasts) ---

type Toast = { id: number; kind: "ok" | "erro"; text: string };
const ToastContext = createContext<(kind: Toast["kind"], text: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = ++counter.current;
    setToasts((list) => [...list.slice(-3), { id, kind, text }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), kind === "erro" ? 6000 : 3500);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className={`pointer-events-auto flex items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur ${
                toast.kind === "ok"
                  ? "border-green-cs/30 bg-[#12301f]/95 text-green-light"
                  : "border-error/40 bg-[#3a1418]/95 text-[#ffb4b1]"
              }`}
            >
              {toast.kind === "ok" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <AlertTriangle size={18} className="mt-0.5 shrink-0" />}
              <span>{toast.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

// --- Estrutura ---

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-[family-name:var(--font-press-start)] text-lg text-white sm:text-xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-[#A0A0A0]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/10 bg-bg-card/60 ${className}`}>{children}</div>;
}

export function CardTitle({ icon: Icon, children, right }: { icon?: LucideIcon; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#E0E0E0]">
        {Icon && <Icon size={16} className="text-green-cs" aria-hidden="true" />}
        {children}
      </h2>
      {right}
    </div>
  );
}

export function Loading({ label = "Carregando" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-20 text-sm text-[#A0A0A0]">
      <Loader2 size={22} className="animate-spin text-green-cs" /> {label}
    </div>
  );
}

export function Empty({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center">
      <Icon size={32} className="text-[#6b6b80]" aria-hidden="true" />
      <p className="mt-3 font-semibold text-white">{title}</p>
      {children && <div className="mt-1 max-w-md text-sm text-[#A0A0A0]">{children}</div>}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-[#ffb4b1]">
      <AlertTriangle size={18} className="shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="font-semibold underline hover:text-white">
          Tentar de novo
        </button>
      )}
    </div>
  );
}

/** Ícone do produto (o mesmo da loja), pela categoria e pelo slug */
export function ProductGlyph({ category, slug, size, color }: { category: string; slug: string; size: number; color: string }) {
  return createElement(productIcon(category, slug), { size, style: { color }, "aria-hidden": true });
}

// --- Selos ---

const TONES = {
  green: "bg-green-cs/15 text-green-light border-green-cs/25",
  yellow: "bg-warning/15 text-warning border-warning/25",
  red: "bg-error/15 text-[#ff8a87] border-error/30",
  blue: "bg-info/15 text-[#7cc2ff] border-info/25",
  purple: "bg-xp/20 text-[#d68ae4] border-xp/30",
  gray: "bg-white/5 text-[#A0A0A0] border-white/10",
} as const;

export type Tone = keyof typeof TONES;

export function Badge({ tone = "gray", children, icon: Icon }: { tone?: Tone; children: ReactNode; icon?: LucideIcon }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-semibold ${TONES[tone]}`}>
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  );
}

export const ORDER_STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: "Aguardando", tone: "yellow" },
  APPROVED: { label: "Aprovado", tone: "green" },
  REJECTED: { label: "Recusado", tone: "gray" },
  REFUNDED: { label: "Reembolsado", tone: "red" },
};

export const DELIVERY_STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: "Na fila", tone: "yellow" },
  PROCESSING: { label: "Entregando", tone: "blue" },
  DELIVERED: { label: "Entregue", tone: "green" },
  FAILED: { label: "Falhou", tone: "red" },
};

export const DELIVERY_SUMMARY: Record<string, { label: string; tone: Tone }> = {
  delivered: { label: "Entregue", tone: "green" },
  pending: { label: "Entregando", tone: "yellow" },
  failed: { label: "Precisa de atenção", tone: "red" },
  none: { label: "Sem entrega", tone: "gray" },
};

// --- Botões ---

const BUTTONS = {
  primary: "bg-green-cs text-white hover:bg-green-dark disabled:bg-green-cs/40",
  secondary: "border border-white/15 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50",
  ghost: "text-[#A0A0A0] hover:bg-white/5 hover:text-white disabled:opacity-50",
  danger: "border border-error/40 bg-error/10 text-[#ff8a87] hover:bg-error/20 disabled:opacity-50",
} as const;

export function Btn({
  variant = "secondary",
  icon: Icon,
  loading,
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BUTTONS;
  icon?: LucideIcon;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${BUTTONS[variant]} ${className}`}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function IconBtn({ icon: Icon, label, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      {...props}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#A0A0A0] transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40 ${className}`}
    >
      <Icon size={16} />
    </button>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${checked ? "bg-green-cs" : "bg-white/15"}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} />
    </button>
  );
}

/** Abas pequenas (filtros e períodos) */
export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; count?: number }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap rounded-xl border border-white/10 bg-black/20 p-1">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === opt.value ? "bg-white/10 text-white" : "text-[#A0A0A0] hover:text-white"
          }`}
        >
          {opt.label}
          {opt.count != null && <span className="ml-1.5 text-[10px] text-[#A0A0A0]">{opt.count}</span>}
        </button>
      ))}
    </div>
  );
}

// --- Formulário ---

export const inputClass =
  "w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-[#6b6b80] focus:border-green-cs focus:outline-none disabled:opacity-60";

export function Field({
  label,
  hint,
  error,
  children,
  className = "",
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#A0A0A0]">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-[#ff8a87]">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-[#7a7a90]">{hint}</span>
      ) : null}
    </label>
  );
}

// --- Diálogos ---

/** Gaveta lateral (editores) */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.22 }}
            className={`absolute inset-y-0 right-0 flex w-full flex-col border-l border-white/10 bg-bg-primary ${wide ? "max-w-5xl" : "max-w-xl"}`}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="text-base font-bold text-white">{title}</h2>
              <IconBtn icon={X} label="Fechar" onClick={onClose} />
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 px-5 py-4">{footer}</div>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

type ConfirmOptions = { title: string; message: ReactNode; confirm: string; danger?: boolean };

/** Confirmação com diálogo próprio (no lugar do window.confirm) */
export function useConfirm() {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);

  const ask = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => setState({ ...options, resolve })), []);

  const close = (value: boolean) => {
    state?.resolve(value);
    setState(null);
  };

  const dialog = (
    <AnimatePresence>
      {state && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70" onClick={() => close(false)} />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-bg-primary p-6"
          >
            <h2 className="text-lg font-bold text-white">{state.title}</h2>
            <div className="mt-2 text-sm text-[#C0C0C8]">{state.message}</div>
            <div className="mt-6 flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => close(false)}>
                Voltar
              </Btn>
              <Btn variant={state.danger ? "danger" : "primary"} onClick={() => close(true)} autoFocus>
                {state.confirm}
              </Btn>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return { ask, dialog };
}

/** Variação em relação ao período anterior */
export function Delta({ value }: { value: number | null }) {
  if (value == null) return <span className="text-[11px] text-[#7a7a90]">sem base anterior</span>;
  const up = value > 0;
  const flat = value === 0;
  return (
    <span className={`text-[11px] font-semibold ${flat ? "text-[#A0A0A0]" : up ? "text-green-light" : "text-[#ff8a87]"}`}>
      {flat ? "igual" : `${up ? "+" : ""}${value.toLocaleString("pt-BR")}%`}
      <span className="font-normal text-[#7a7a90]"> vs. anterior</span>
    </span>
  );
}
