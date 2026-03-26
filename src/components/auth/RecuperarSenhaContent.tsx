"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";

export function RecuperarSenhaContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/recuperar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao processar solicitação.");
        return;
      }

      setSent(true);
    } catch {
      setError("Erro ao conectar com o servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-cs/20">
                <CheckCircle className="h-8 w-8 text-green-cs" />
              </div>
              <h1 className="mb-3 font-[family-name:var(--font-press-start)] text-lg text-white">
                EMAIL ENVIADO
              </h1>
              <p className="mb-6 text-sm leading-relaxed text-[#E0E0E0]">
                Se o email <strong className="text-white">{email}</strong> estiver
                cadastrado, enviaremos instruções para recuperação de senha.
                Verifique sua caixa de entrada e spam.
              </p>
              <p className="mb-6 text-xs text-white/50">
                O link de recuperação expira em 1 hora.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-green-cs hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para o Login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-cs/20">
                  <Mail className="h-7 w-7 text-green-cs" />
                </div>
                <h1 className="mb-2 font-[family-name:var(--font-press-start)] text-lg text-white">
                  RECUPERAR SENHA
                </h1>
                <p className="text-sm text-[#E0E0E0]">
                  Informe o email cadastrado na sua conta para receber
                  instruções de recuperação.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1 block text-sm font-medium text-white"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    autoComplete="email"
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
                  />
                </div>

                {error && (
                  <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-cs py-3 font-bold uppercase text-white transition-colors hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Link de Recuperação"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-green-cs hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para o Login
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
