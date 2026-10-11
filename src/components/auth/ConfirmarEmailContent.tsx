"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useSession, signOut, signIn, getProviders } from "next-auth/react";
import { Loader2, Mail, MailCheck } from "lucide-react";
import { GoogleLogo } from "@/components/auth/ExternalLoginButtons";

interface EmailStatus {
  email: string | null;
  verified: boolean;
  requiresPassword: boolean;
}

const inputClass =
  "mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none";

export function ConfirmarEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();

  // Só caminhos internos (evita redirecionamento aberto)
  const redirectParam = searchParams.get("redirect");
  const redirectTo =
    redirectParam?.startsWith("/") && !redirectParam.startsWith("//") && !redirectParam.startsWith("/\\")
      ? redirectParam
      : "/perfil";
  const changing = searchParams.get("alterar") === "1";

  // update() sem argumento só relê a sessão (GET); com um objeto, o servidor
  // revalida o token no banco (trigger "update"). O conteúdo é ignorado.
  const refreshSession = () => update({ revalidar: true });
  // Voltou do Google sem o e-mail confirmado (ex.: o e-mail do Google já é de outra conta)
  const backFromGoogle = searchParams.get("google") === "1";

  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [step, setStep] = useState<"email" | "codigo">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [googleAvailable, setGoogleAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/conta/email", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: EmailStatus | null) => {
        if (!active || !data) return;
        // E-mail já confirmado e não está trocando: atualiza a sessão e segue direto
        if (data.verified && !changing) {
          refreshSession().finally(() => router.replace(redirectTo));
          return;
        }
        setStatus(data);
        if (data.email && !data.verified) setEmail(data.email);
        if (backFromGoogle) {
          setError("Não foi possível confirmar com essa conta Google. Ela ou o e-mail dela já pertencem a outra conta do site. Confirme pelo código.");
        }
      })
      .catch(() => {
        if (active) setError("Erro de conexão. Recarregue a página.");
      });
    return () => {
      active = false;
    };
    // refreshSession fica fora das dependências de propósito: update() muda a cada
    // sessão nova e faria o efeito rodar de novo depois da própria revalidação
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backFromGoogle, changing, redirectTo, router]);

  useEffect(() => {
    let active = true;
    getProviders()
      .then((providers) => {
        if (active) setGoogleAvailable(!!providers && "google" in providers);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Vincula o Google à conta logada; no retorno, o e-mail do Google passa a ser o e-mail confirmado
  const confirmWithGoogle = async () => {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await fetch("/api/perfil/vinculos/iniciar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google" }),
      });
      if (!res.ok) throw new Error();
      await signIn("google", { redirectTo: `/confirmar-email?google=1&redirect=${encodeURIComponent(redirectTo)}` });
    } catch {
      setError("Não foi possível abrir o login do Google. Tente novamente.");
      setLoading(false);
    }
  };

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await fetch("/api/conta/email/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, currentPassword: password || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível enviar o código.");
        return;
      }
      setStep("codigo");
      setCode("");
      setInfo(
        data.devCodeInTerminal
          ? "Ambiente de desenvolvimento: o e-mail não foi enviado e o código aparece no terminal do servidor."
          : `Enviamos um código de 6 dígitos para ${email}. Confira também a caixa de spam.`
      );
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/conta/email/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível confirmar o código.");
        return;
      }
      await refreshSession(); // a sessão passa a dizer que o e-mail está confirmado
      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur"
      >
        <div className="flex justify-center">
          {step === "email" ? (
            <Mail className="h-10 w-10 text-green-cs" />
          ) : (
            <MailCheck className="h-10 w-10 text-green-cs" />
          )}
        </div>
        <h1 className="mt-4 text-center font-[family-name:var(--font-press-start)] text-lg leading-relaxed text-white">
          {changing ? "ALTERAR E-MAIL" : "CONFIRME SEU E-MAIL"}
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-[#E0E0E0]">
          {changing
            ? "O novo e-mail passa a valer depois que você confirmar o código enviado para ele."
            : "Para usar a plataforma, informe seu e-mail e confirme com o código que vamos enviar. Ele é usado para recuperar a conta e receber avisos de compras."}
        </p>

        {error && (
          <div className="mt-6 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
        )}
        {info && (
          <div className="mt-6 rounded-lg border border-green-cs/20 bg-green-cs/10 px-4 py-3 text-sm text-green-cs">{info}</div>
        )}

        {!status ? (
          <div className="mt-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-green-cs" />
          </div>
        ) : step === "email" ? (
          <form onSubmit={sendCode} className="mt-8 space-y-4">
            {changing && status.email && (
              <p className="text-sm text-[#A0A0A0]">
                E-mail atual: <span className="text-white">{status.email}</span>
              </p>
            )}
            <div>
              <label htmlFor="confirm-email" className="block text-sm font-medium text-white">
                {changing ? "Novo e-mail" : "E-mail"}
              </label>
              <input
                id="confirm-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className={inputClass}
              />
            </div>
            {status.requiresPassword && (
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-white">
                  Senha atual
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !email}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-cs py-3 font-bold uppercase text-white transition-colors hover:bg-green-dark disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar código
            </button>

            {!changing && googleAvailable && (
              <>
                <div className="flex items-center gap-3 pt-2 text-xs uppercase tracking-[0.18em] text-[#A0A0A0]">
                  <span aria-hidden="true" className="h-px flex-1 bg-white/10" />
                  ou
                  <span aria-hidden="true" className="h-px flex-1 bg-white/10" />
                </div>
                <button
                  type="button"
                  onClick={confirmWithGoogle}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/[0.08] disabled:opacity-60"
                >
                  <GoogleLogo />
                  Confirmar com Google
                </button>
                <p className="text-center text-xs text-[#A0A0A0]">
                  O e-mail da conta Google passa a ser o e-mail da sua conta, e o Google fica vinculado para os próximos logins.
                </p>
              </>
            )}
          </form>
        ) : (
          <form onSubmit={confirmCode} className="mt-8 space-y-4">
            <div>
              <label htmlFor="confirm-code" className="block text-sm font-medium text-white">
                Código de 6 dígitos
              </label>
              <input
                id="confirm-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className={`${inputClass} text-center font-[family-name:var(--font-jetbrains-mono)] text-2xl tracking-[0.5em]`}
              />
            </div>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-cs py-3 font-bold uppercase text-white transition-colors hover:bg-green-dark disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar
            </button>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setInfo("");
                  setError("");
                }}
                className="text-[#A0A0A0] hover:text-white"
              >
                Trocar e-mail
              </button>
              <button
                type="button"
                onClick={() => sendCode()}
                disabled={loading}
                className="text-green-cs hover:underline disabled:opacity-50"
              >
                Reenviar código
              </button>
            </div>
          </form>
        )}

        {!changing && (
          <p className="mt-8 text-center text-xs text-[#A0A0A0]">
            Não é você?{" "}
            <button type="button" onClick={() => signOut({ redirectTo: "/" })} className="text-green-cs hover:underline">
              Sair da conta
            </button>
          </p>
        )}
      </motion.div>
    </div>
  );
}
