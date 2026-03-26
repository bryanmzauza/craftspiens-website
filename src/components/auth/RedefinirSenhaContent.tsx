"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Lock,
  CheckCircle,
  Loader2,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";

export function RedefinirSenhaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="mb-3 font-[family-name:var(--font-press-start)] text-lg text-white">
              LINK INVÁLIDO
            </h1>
            <p className="mb-6 text-sm text-[#E0E0E0]">
              O link de recuperação de senha é inválido ou está incompleto.
            </p>
            <Link
              href="/recuperar-senha"
              className="inline-flex items-center gap-2 text-sm text-green-cs hover:underline"
            >
              Solicitar novo link
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const passwordValid =
    form.password.length >= 8 &&
    /[a-zA-Z]/.test(form.password) &&
    /[0-9]/.test(form.password);
  const passwordsMatch =
    form.confirmPassword.length > 0 &&
    form.password === form.confirmPassword;

  const getPasswordStrength = () => {
    const p = form.password;
    if (p.length === 0) return { label: "", color: "", width: "0%" };
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^a-zA-Z0-9]/.test(p)) score++;

    const levels = [
      { label: "Muito fraca", color: "bg-red-500", width: "20%" },
      { label: "Fraca", color: "bg-orange-500", width: "40%" },
      { label: "Razoável", color: "bg-yellow-500", width: "60%" },
      { label: "Forte", color: "bg-green-400", width: "80%" },
      { label: "Muito forte", color: "bg-green-cs", width: "100%" },
    ];
    return levels[Math.min(score, 4)];
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!passwordValid) {
      setError("A senha deve ter pelo menos 8 caracteres, 1 letra e 1 número.");
      return;
    }

    if (!passwordsMatch) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/redefinir-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: form.password,
          confirmPassword: form.confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao redefinir senha.");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Erro ao conectar com o servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-cs/20">
              <CheckCircle className="h-8 w-8 text-green-cs" />
            </div>
            <h1 className="mb-3 font-[family-name:var(--font-press-start)] text-lg text-white">
              SENHA REDEFINIDA
            </h1>
            <p className="mb-4 text-sm text-[#E0E0E0]">
              Sua senha foi alterada com sucesso! A nova senha vale tanto para
              o site quanto para o servidor Minecraft.
            </p>
            <p className="mb-6 text-xs text-white/50">
              Redirecionando para o login...
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-green-cs hover:underline"
            >
              Ir para o Login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-cs/20">
              <Lock className="h-7 w-7 text-green-cs" />
            </div>
            <h1 className="mb-2 font-[family-name:var(--font-press-start)] text-lg text-white">
              NOVA SENHA
            </h1>
            <p className="text-sm text-[#E0E0E0]">
              Crie uma nova senha para sua conta. Ela será sincronizada com o
              servidor Minecraft.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-white"
              >
                Nova Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  placeholder="Mínimo 8 caracteres"
                  required
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 pr-12 text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-white/50">
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium text-white"
              >
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, confirmPassword: e.target.value }))
                  }
                  placeholder="Repita a nova senha"
                  required
                  autoComplete="new-password"
                  className={`w-full rounded-lg border bg-white/5 px-4 py-3 pr-12 text-white placeholder:text-white/40 focus:outline-none ${
                    form.confirmPassword.length > 0
                      ? passwordsMatch
                        ? "border-green-cs"
                        : "border-red-500"
                      : "border-white/20 focus:border-green-cs"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  {showConfirm ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {form.confirmPassword.length > 0 && !passwordsMatch && (
                <p className="mt-1 text-xs text-red-400">
                  As senhas não coincidem
                </p>
              )}
            </div>

            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !passwordValid || !passwordsMatch}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-cs py-3 font-bold uppercase text-white transition-colors hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                "Redefinir Senha"
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
        </div>
      </motion.div>
    </div>
  );
}
