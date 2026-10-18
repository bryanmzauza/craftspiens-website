"use client";

// Depois do login, duas checagens em todas as páginas:
//
// 1. Aceite dos Termos e Condições e da Política de Privacidade (LGPD): sem o
//    aceite da versão vigente, um diálogo bloqueia o site até a pessoa aceitar
//    ou sair. O aceite fica registrado com data, IP e navegador.
// 2. Conta incompleta: aviso no topo com um link por pendência (e-mail, nick,
//    data de nascimento, CPF). Fechar vale até a próxima sessão do navegador.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { AlertTriangle, X, ChevronRight, FileCheck, Loader2, LogOut } from "lucide-react";
import { TERMS_STATEMENTS, type TermsStatement } from "@/lib/terms";

type Key = "emailConfirmado" | "nickVinculado" | "idadeRegistrada" | "cpfRegistrado";

interface Pendencias {
  pending: Key[];
  terms: { accepted: boolean; version: string };
}

const ITEMS: Record<Key, { label: string; href: string }> = {
  emailConfirmado: { label: "Confirmar e-mail", href: "/confirmar-email?redirect=/perfil/configuracoes" },
  nickVinculado: { label: "Vincular nick do Minecraft", href: "/perfil/configuracoes?aba=vinculos" },
  idadeRegistrada: { label: "Informar data de nascimento", href: "/perfil/configuracoes" },
  cpfRegistrado: { label: "Informar CPF (para compras)", href: "/perfil/configuracoes" },
};

// Páginas que já tratam do próprio assunto ou onde o aviso atrapalha
const BANNER_HIDDEN_ON = ["/login", "/registro", "/recuperar-senha", "/redefinir-senha", "/confirmar-email"];
// O diálogo de aceite deixa ler os termos
const TERMS_HIDDEN_ON = ["/termos", "/login", "/registro", "/recuperar-senha", "/redefinir-senha"];

const STATEMENT_KEYS = Object.keys(TERMS_STATEMENTS) as TermsStatement[];

export function AccountGate() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const userId = session?.user?.id;
  const [data, setData] = useState<{ userId: string; value: Pendencias } | null>(null);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);

  const storageKey = userId ? `conta-aviso:${userId}` : null;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetch("/api/perfil/pendencias", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((value: Pendencias | null) => {
        if (!cancelled && value) setData({ userId, value });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId, pathname]);

  if (!userId || !data || data.userId !== userId) return null;

  const { pending, terms } = data.value;
  const hiddenOn = (list: string[]) => list.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!terms.accepted && !hiddenOn(TERMS_HIDDEN_ON)) {
    return (
      <TermsDialog
        onAccepted={() => setData({ userId, value: { ...data.value, terms: { ...terms, accepted: true } } })}
      />
    );
  }

  if (pending.length === 0 || dismissedFor === userId || hiddenOn(BANNER_HIDDEN_ON)) return null;

  let dismissedInSession = false;
  try {
    dismissedInSession = !!storageKey && sessionStorage.getItem(storageKey) === "1";
  } catch {
    // sem sessionStorage (modo privado): mostra sempre
  }
  if (dismissedInSession) return null;

  function dismiss() {
    setDismissedFor(userId ?? null);
    try {
      if (storageKey) sessionStorage.setItem(storageKey, "1");
    } catch {
      // ignora
    }
  }

  return (
    <div role="status" className="fixed left-0 right-0 top-16 z-40 border-b border-warning/30 bg-[rgba(26,26,46,0.96)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-2.5 lg:px-6">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Complete sua conta para participar do fórum e comprar na loja</p>
          <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {pending.map((key) => (
              <li key={key}>
                <Link href={ITEMS[key].href} className="inline-flex items-center gap-0.5 text-xs text-warning hover:underline">
                  {ITEMS[key].label} <ChevronRight size={12} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fechar aviso"
          className="shrink-0 rounded p-1 text-[#A0A0A0] transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

function TermsDialog({ onAccepted }: { onAccepted: () => void }) {
  const [checked, setChecked] = useState<Record<TermsStatement, boolean>>({ termos: false, privacidade: false, idade: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const allChecked = STATEMENT_KEYS.every((key) => checked[key]);

  async function accept(e: React.FormEvent) {
    e.preventDefault();
    if (!allChecked || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/perfil/termos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checked),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Não foi possível registrar o aceite. Tente de novo.");
        return;
      }
      onAccepted();
    } catch {
      setError("Erro de conexão. Tente de novo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm sm:items-center">
      <form
        onSubmit={accept}
        role="dialog"
        aria-modal="true"
        aria-labelledby="aceite-titulo"
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-bg-primary p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-cs/15 text-green-cs">
            <FileCheck size={22} aria-hidden="true" />
          </div>
          <div>
            <h2 id="aceite-titulo" className="text-lg font-bold text-white">
              Termos e privacidade
            </h2>
            <p className="text-xs text-[#A0A0A0]">Para continuar usando a plataforma, precisamos do seu aceite.</p>
          </div>
        </div>

        <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-[#E0E0E0]">
          <p>
            A CraftSapiens guarda o e-mail, o nick do Minecraft, a data de nascimento e, para compras, o CPF de quem
            paga. Esses dados servem para a conta funcionar, entregar as compras no jogo, enviar avisos e cumprir
            obrigações legais. Eles não são vendidos nem compartilhados além do necessário (Mercado Pago, nos
            pagamentos).
          </p>
          <p>
            Você pode pedir acesso, correção ou exclusão dos seus dados a qualquer momento. Os detalhes estão nos{" "}
            <Link href="/termos" target="_blank" className="font-semibold text-green-cs hover:underline">
              Termos e Condições
            </Link>{" "}
            e na{" "}
            <Link href="/termos#dados-coletados" target="_blank" className="font-semibold text-green-cs hover:underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>

        <div className="mt-4 space-y-3">
          {STATEMENT_KEYS.map((key) => (
            <label key={key} className="flex cursor-pointer items-start gap-3 text-sm text-[#E0E0E0]">
              <input
                type="checkbox"
                checked={checked[key]}
                onChange={(e) => setChecked((c) => ({ ...c, [key]: e.target.checked }))}
                className="mt-0.5 h-4 w-4 shrink-0 accent-green-cs"
              />
              <span>{TERMS_STATEMENTS[key]}</span>
            </label>
          ))}
        </div>

        {error && <p className="mt-3 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm text-[#E0E0E0] transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut size={14} /> Sair sem aceitar
          </button>
          <button
            type="submit"
            disabled={!allChecked || submitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-cs px-6 py-2 text-sm font-bold text-white transition-all hover:bg-green-dark disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <FileCheck size={16} />}
            Aceitar e continuar
          </button>
        </div>
      </form>
    </div>
  );
}
