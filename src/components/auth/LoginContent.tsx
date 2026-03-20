"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Gamepad2 } from "lucide-react";

export function LoginContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ username: "", password: "", remember: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // TODO: Integrar com NextAuth signIn("credentials", ...)
      await new Promise((r) => setTimeout(r, 1000));
      setError("Integração com o servidor será ativada em breve.");
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
          <Gamepad2 className="h-10 w-10 text-green-cs" />
        </div>
        <h1 className="mt-4 text-center font-[family-name:var(--font-press-start)] text-2xl text-white">
          ENTRAR
        </h1>
        <p className="mt-2 text-center text-sm text-[#E0E0E0]">
          Acesse sua conta CraftSapiens
        </p>

        {error && (
          <div className="mt-6 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="login-username" className="block text-sm font-medium text-white">
              Username ou Email
            </label>
            <input
              id="login-username"
              type="text"
              required
              value={form.username}
              onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
              placeholder="Seu nick ou email"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-white">
              Senha
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 pr-12 text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
                placeholder="Sua senha"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-[#A0A0A0] hover:text-white"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-[#E0E0E0]">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) => setForm((s) => ({ ...s, remember: e.target.checked }))}
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-green-cs"
              />
              Lembrar de mim
            </label>
            <Link href="/recuperar-senha" className="text-sm text-green-cs hover:underline">
              Esqueci a senha
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-cs px-6 py-3 text-sm font-bold uppercase text-white transition-all hover:bg-green-dark hover:shadow-[0_0_20px_rgba(76,175,80,0.3)] disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#E0E0E0]">
          Não tem uma conta?{" "}
          <Link href="/registro" className="font-medium text-green-cs hover:underline">
            Criar conta grátis
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
