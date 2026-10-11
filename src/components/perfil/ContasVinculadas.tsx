"use client";

import { useCallback, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { Check, Gamepad2, Loader2, ShieldCheck } from "lucide-react";

interface Vinculos {
  nick: { name: string; hasPassword: boolean; javaOriginal: boolean; bedrock: boolean } | null;
  google: { email: string | null } | null;
  /** Validação feita pela conta Microsoft no site */
  microsoft: { email: string | null } | null;
  providers: { google: boolean; microsoft: boolean };
}

/** Mensagens para os erros devolvidos no retorno de um vínculo (?erro=...) */
const LINK_ERRORS: Record<string, string> = {
  MicrosoftSemConta:
    "Não encontramos uma conta do servidor ligada a essa conta Microsoft. Entre no servidor uma vez com a conta original (Java) ou pelo Bedrock e tente de novo.",
  NickJaVinculado: "Esse nick já está vinculado a outra conta do site.",
  ContaJaTemNick: "Sua conta já tem um nick vinculado.",
  ContaJaVinculada: "Essa conta Google já está vinculada a outro usuário.",
  GoogleJaVinculado: "Sua conta já tem um Google vinculado. Desvincule o atual para trocar.",
  ContaNaoEncontrada: "Não foi possível concluir o vínculo. Entre novamente e tente outra vez.",
};

function readLinkError(): string {
  if (typeof window === "undefined") return "";
  const code = new URLSearchParams(window.location.search).get("erro");
  return code ? LINK_ERRORS[code] ?? "Não foi possível concluir o vínculo. Tente novamente." : "";
}

function VerifiedBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-green-cs/40 bg-green-cs/10 px-2 py-0.5 text-xs font-semibold text-green-cs">
      <ShieldCheck size={12} /> {children}
    </span>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-green-cs focus:outline-none";

export function ContasVinculadas() {
  const { update } = useSession();
  const [data, setData] = useState<Vinculos | null>(null);
  const [error, setError] = useState(readLinkError);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<"nick" | "google" | "microsoft" | "unlink" | null>(null);
  const [nickForm, setNickForm] = useState({ username: "", password: "" });
  const [originalAccount, setOriginalAccount] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/perfil/vinculos", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } catch {
      setError("Erro de conexão ao carregar as contas vinculadas.");
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/perfil/vinculos", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json) setData(json);
      })
      .catch(() => {
        if (active) setError("Erro de conexão ao carregar as contas vinculadas.");
      });
    return () => {
      active = false;
    };
  }, []);

  /** Grava a intenção de vínculo e segue para o login externo */
  const startLink = async (provider: "google" | "microsoft") => {
    setError("");
    setBusy(provider);
    try {
      const res = await fetch("/api/perfil/vinculos/iniciar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      if (!res.ok) throw new Error();
      await signIn(provider, { redirectTo: "/perfil/configuracoes?aba=vinculos" });
    } catch {
      setError("Não foi possível iniciar o vínculo. Tente novamente.");
      setBusy(null);
    }
  };

  const linkNick = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setOriginalAccount(false);
    setBusy("nick");
    try {
      const res = await fetch("/api/perfil/vinculos/nick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nickForm),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Não foi possível vincular o nick.");
        setOriginalAccount(json.code === "ContaOriginal");
        return;
      }
      setNickForm({ username: "", password: "" });
      setMessage(`Nick ${json.nick} vinculado.`);
      await update({ revalidar: true }); // com um objeto, o servidor relê o nick no banco
      await load();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setBusy(null);
    }
  };

  const unlinkGoogle = async () => {
    setError("");
    setMessage("");
    setBusy("unlink");
    try {
      const res = await fetch("/api/perfil/vinculos/google", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Não foi possível remover o vínculo.");
        return;
      }
      setMessage("Google desvinculado.");
      await load();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setBusy(null);
    }
  };

  if (!data) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-green-cs" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Contas Vinculadas</h2>
        <p className="mt-1 text-sm text-[#A0A0A0]">
          Escolha como entrar no site e vincule seu nick do Minecraft para jogar, comprar e participar do fórum.
        </p>
      </div>

      {error && <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}
      {message && <p className="rounded-lg bg-green-cs/10 px-3 py-2 text-sm text-green-cs">{message}</p>}

      {/* Nick do Minecraft */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-start gap-3">
          <Gamepad2 size={20} className="mt-0.5 shrink-0 text-green-cs" />
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-white">Nick do Minecraft</h3>

            {data.nick ? (
              <div className="mt-2 space-y-2 text-sm">
                <p className="flex flex-wrap items-center gap-2 text-white">
                  <span className="font-[family-name:var(--font-jetbrains-mono)]">{data.nick.name}</span>
                  {data.microsoft && <VerifiedBadge>Verificado pela Microsoft</VerifiedBadge>}
                </p>
                <ul className="space-y-1 text-[#A0A0A0]">
                  {data.nick.javaOriginal && (
                    <li className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-green-cs" /> Conta original (Java) verificada
                    </li>
                  )}
                  {data.nick.bedrock && (
                    <li className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-green-cs" /> Conta Bedrock verificada
                    </li>
                  )}
                  {(data.nick.javaOriginal || data.nick.bedrock) && data.providers.microsoft && (
                    <li>Você pode entrar no site com o botão Entrar com Microsoft.</li>
                  )}
                </ul>
                {/* Conta original ou Bedrock ainda não validada no site: confirma pela Microsoft */}
                {!data.microsoft && (data.nick.javaOriginal || data.nick.bedrock) && data.providers.microsoft && (
                  <button
                    type="button"
                    onClick={() => startLink("microsoft")}
                    disabled={busy !== null}
                    className="mt-1 flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-40"
                  >
                    {busy === "microsoft" && <Loader2 size={14} className="animate-spin" />}
                    Validar com Microsoft
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-2 space-y-4">
                <p className="text-sm text-[#A0A0A0]">
                  Sua conta ainda não tem um nick. Informe o nick e a senha que você usa no servidor.
                </p>
                <form onSubmit={linkNick} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    aria-label="Nick do Minecraft"
                    placeholder="Nick do Minecraft"
                    autoComplete="username"
                    value={nickForm.username}
                    onChange={(e) => setNickForm((f) => ({ ...f, username: e.target.value }))}
                    className={inputClass}
                  />
                  <input
                    aria-label="Senha usada no servidor"
                    type="password"
                    placeholder="Senha do servidor"
                    autoComplete="current-password"
                    value={nickForm.password}
                    onChange={(e) => setNickForm((f) => ({ ...f, password: e.target.value }))}
                    className={inputClass}
                  />
                  <button
                    type="submit"
                    disabled={busy !== null || !nickForm.username || !nickForm.password}
                    className="flex items-center justify-center gap-2 rounded-lg bg-green-cs px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-dark disabled:opacity-40"
                  >
                    {busy === "nick" ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Vincular
                  </button>
                </form>

                {data.providers.microsoft && (
                  <div
                    className={`rounded-lg border p-4 text-sm ${
                      originalAccount ? "border-green-cs/40 bg-green-cs/5" : "border-white/10"
                    }`}
                  >
                    <p className="text-[#E0E0E0]">
                      Joga com conta original (Java) ou pelo Bedrock? Confirme pela conta Microsoft, sem senha.
                    </p>
                    <button
                      type="button"
                      onClick={() => startLink("microsoft")}
                      disabled={busy !== null}
                      className="mt-3 flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-40"
                    >
                      {busy === "microsoft" && <Loader2 size={14} className="animate-spin" />}
                      Vincular com Microsoft
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Google */}
      {data.providers.google && (
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="flex flex-wrap items-center gap-2 font-bold text-white">
                Google
                {data.google && <VerifiedBadge>Verificado pelo Google</VerifiedBadge>}
              </h3>
              <p className="mt-1 text-sm text-[#A0A0A0]">
                {data.google
                  ? `Vinculado${data.google.email ? ` a ${data.google.email}` : ""}. Você pode entrar com o botão Entrar com Google.`
                  : "Vincule para entrar no site com sua conta Google."}
              </p>
            </div>
            {data.google ? (
              <button
                type="button"
                onClick={unlinkGoogle}
                disabled={busy !== null}
                className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-40"
              >
                {busy === "unlink" && <Loader2 size={14} className="animate-spin" />}
                Desvincular
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startLink("google")}
                disabled={busy !== null}
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#1A1A2E] transition-colors hover:bg-white/90 disabled:opacity-40"
              >
                {busy === "google" && <Loader2 size={14} className="animate-spin" />}
                Vincular Google
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
