"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, KeyRound, Loader2, Lock } from "lucide-react";
import { inputClass } from "@/components/painel/ui";

// Nome lembrado neste navegador, só por conveniência
const NAME_KEY = "painel:nome";

export function PainelLogin() {
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(NAME_KEY);
      if (saved && nameRef.current && !nameRef.current.value) nameRef.current.value = saved;
    } catch {}
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const name = nameRef.current?.value.trim() ?? "";
    try {
      const res = await fetch("/api/painel/acesso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: name, codigo: code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Não foi possível abrir o painel.");
        setLoading(false);
        return;
      }
      try {
        localStorage.setItem(NAME_KEY, name);
      } catch {}
      setCode("");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 pb-16 pt-28">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-bg-card/80 p-7 backdrop-blur"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-green-cs/30 bg-green-cs/10">
          <Lock size={26} className="text-green-cs" />
        </div>
        <h1 className="mt-5 text-center font-[family-name:var(--font-press-start)] text-base text-white">PAINEL</h1>
        <p className="mt-2 text-center text-sm text-[#A0A0A0]">Área restrita da equipe. Informe o código de acesso.</p>

        <label className="mt-6 block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#A0A0A0]">Seu nome</span>
          <input
            ref={nameRef}
            className={inputClass}
            placeholder="Como aparece no registro"
            autoComplete="nickname"
            maxLength={30}
            required
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#A0A0A0]">Código de acesso</span>
          <div className="relative">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              type={show ? "text" : "password"}
              className={`${inputClass} pr-10 font-[family-name:var(--font-jetbrains-mono)]`}
              autoComplete="current-password"
              autoFocus
              required
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[#A0A0A0] hover:text-white"
              aria-label={show ? "Esconder código" : "Mostrar código"}
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        {error && <p className="mt-4 rounded-lg bg-error/10 px-3 py-2 text-sm text-[#ff8a87]">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-green-cs px-4 py-2.5 text-sm font-bold uppercase text-white transition-colors hover:bg-green-dark disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
          Entrar
        </button>
        <p className="mt-4 text-center text-[11px] text-[#7a7a90]">A sessão vale por 12 horas neste navegador.</p>
      </motion.form>
    </div>
  );
}

export function PainelIndisponivel() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 pb-16 pt-28">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-bg-card/80 p-7 text-center">
        <Lock size={28} className="mx-auto text-[#6b6b80]" />
        <h1 className="mt-4 font-[family-name:var(--font-press-start)] text-base text-white">PAINEL</h1>
        <p className="mt-3 text-sm text-[#A0A0A0]">O painel está indisponível no momento.</p>
      </div>
    </div>
  );
}
