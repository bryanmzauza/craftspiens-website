"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

type ExternalProvider = "microsoft" | "google";

/** Mensagens para os códigos de erro do login externo (?error=...) */
export const EXTERNAL_LOGIN_ERRORS: Record<string, string> = {
  MicrosoftSemConta:
    "Não encontramos uma conta do servidor ligada a essa conta Microsoft. O login pela Microsoft funciona para quem já entrou no servidor com a conta original (Java) ou pelo Bedrock. Se você joga com nick e senha, entre pelo formulário abaixo.",
  GoogleEmailEmUso:
    "Já existe uma conta com este e-mail, mas ele ainda não foi confirmado. Entre com seu nick e senha e confirme o e-mail, pelo código ou com o Google. Depois disso, o login pelo Google passa a funcionar.",
  GoogleOutraConta:
    "A conta com este e-mail já está vinculada a outra conta Google. Entre com essa conta Google ou com seu nick e senha.",
  GoogleEmailNaoVerificado: "Seu e-mail do Google ainda não foi verificado. Verifique-o no Google e tente de novo.",
  OAuthCallbackError: "Não foi possível concluir o login pela conta externa. Tente novamente.",
  ServicoIndisponivel: "Não foi possível concluir o login agora. Tente novamente em alguns instantes.",
  OAuthSignin: "Não foi possível iniciar o login pela conta externa. Tente novamente.",
  AccessDenied: "O acesso foi negado. Tente novamente.",
  Configuration: "O login por esta conta não está disponível no momento.",
};

const LABELS: Record<ExternalProvider, string> = {
  microsoft: "Entrar com Microsoft",
  google: "Entrar com Google",
};

function MicrosoftLogo() {
  return (
    <svg viewBox="0 0 21 21" className="h-5 w-5" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

export function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

interface ExternalLoginButtonsProps {
  /** Para onde ir depois do login */
  redirectTo: string;
  /** Provedores a exibir, na ordem (padrão: Microsoft e Google) */
  only?: ExternalProvider[];
  /** Texto dos botões no cadastro ("Criar conta com Google") */
  mode?: "login" | "register";
}

export function ExternalLoginButtons({ redirectTo, only = ["microsoft", "google"], mode = "login" }: ExternalLoginButtonsProps) {
  const [available, setAvailable] = useState<ExternalProvider[] | null>(null);
  const [pending, setPending] = useState<ExternalProvider | null>(null);

  useEffect(() => {
    let active = true;
    getProviders()
      .then((providers) => {
        if (!active) return;
        setAvailable(only.filter((id) => providers && id in providers));
      })
      .catch(() => {
        if (active) setAvailable([]);
      });
    return () => {
      active = false;
    };
    // `only` é uma lista fixa definida por quem usa o componente
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!available || available.length === 0) return null;

  return (
    <div className="space-y-3">
      {available.map((id) => {
        const label = mode === "register" && id === "google" ? "Criar conta com Google" : LABELS[id];
        return (
          <button
            key={id}
            type="button"
            disabled={pending !== null}
            onClick={() => {
              setPending(id);
              signIn(id, { redirectTo });
            }}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/[0.08] disabled:opacity-60"
          >
            {pending === id ? <Loader2 className="h-5 w-5 animate-spin" /> : id === "microsoft" ? <MicrosoftLogo /> : <GoogleLogo />}
            {label}
          </button>
        );
      })}

      {available.includes("microsoft") && (
        <p className="text-center text-xs text-[#A0A0A0]">
          A conta Microsoft serve para quem joga com Minecraft original (Java) ou pelo Bedrock.
        </p>
      )}

      <div className="flex items-center gap-3 pt-2 text-xs uppercase tracking-[0.18em] text-[#A0A0A0]">
        <span aria-hidden="true" className="h-px flex-1 bg-white/10" />
        {mode === "register" ? "ou cadastre com nick e senha" : "ou entre com nick e senha"}
        <span aria-hidden="true" className="h-px flex-1 bg-white/10" />
      </div>
    </div>
  );
}
