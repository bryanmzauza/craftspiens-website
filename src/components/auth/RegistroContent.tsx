"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Check, X, Pickaxe, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";

function getPasswordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;

  if (score <= 1) return { label: "Fraca", color: "bg-error", width: "w-1/5" };
  if (score === 2) return { label: "Razoável", color: "bg-orange-400", width: "w-2/5" };
  if (score === 3) return { label: "Média", color: "bg-yellow-400", width: "w-3/5" };
  if (score === 4) return { label: "Forte", color: "bg-green-cs", width: "w-4/5" };
  return { label: "Muito Forte", color: "bg-green-cs", width: "w-full" };
}

function isValidUsername(u: string) {
  return /^[a-zA-Z0-9_]{3,16}$/.test(u);
}

function isAtLeast13(dateStr: string) {
  if (!dateStr) return false;
  const birth = new Date(dateStr);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= 13;
  }
  return age >= 13;
}

export function RegistroContent() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [form, setForm] = useState({
    username: "",
    email: "",
    birthdate: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const usernameValid = form.username.length === 0 || isValidUsername(form.username);
  const passwordMatch =
    form.confirmPassword.length === 0 || form.password === form.confirmPassword;
  const passwordMinValid = form.password.length === 0 || (form.password.length >= 8 && /[a-zA-Z]/.test(form.password) && /\d/.test(form.password));
  const birthdateValid = form.birthdate.length === 0 || isAtLeast13(form.birthdate);

  const checkUsername = useCallback(async (username: string) => {
    if (!isValidUsername(username)) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    try {
      const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      setUsernameStatus(data.available ? "available" : "taken");
    } catch {
      setUsernameStatus("idle");
    }
  }, []);

  useEffect(() => {
    if (!isValidUsername(form.username)) {
      setUsernameStatus("idle");
      return;
    }
    const timeout = setTimeout(() => checkUsername(form.username), 500);
    return () => clearTimeout(timeout);
  }, [form.username, checkUsername]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isValidUsername(form.username)) {
      setError("Username deve ter 3-16 caracteres (letras, números e _).");
      return;
    }
    if (!passwordMinValid) {
      setError("Senha deve ter pelo menos 8 caracteres, com ao menos 1 letra e 1 número.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (!isAtLeast13(form.birthdate)) {
      setError("Você precisa ter pelo menos 13 anos para se registrar.");
      return;
    }
    if (!form.terms) {
      setError("Você precisa aceitar os Termos e Condições.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          birthdate: form.birthdate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar conta.");
        return;
      }

      setSuccess(true);

      const signInResult = await signIn("credentials", {
        username: form.username,
        password: form.password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/login");
      } else {
        router.push("/perfil");
        router.refresh();
      }
    } catch {
      setError("Erro ao conectar com o servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur"
      >
        <div className="flex justify-center">
          <Pickaxe className="h-10 w-10 text-green-cs" />
        </div>
        <h1 className="mt-4 text-center font-[family-name:var(--font-press-start)] text-2xl text-white">
          CRIAR CONTA
        </h1>
        <p className="mt-2 text-center text-sm text-[#E0E0E0]">
          Comece sua jornada na CraftSapiens
        </p>

        {error && (
          <div className="mt-6 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-lg border border-green-cs/20 bg-green-cs/10 px-4 py-3 text-sm text-green-cs">
            Conta criada com sucesso! Redirecionando...
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {/* Username */}
          <div>
            <label htmlFor="reg-username" className="block text-sm font-medium text-white">
              Username (Nick do Minecraft) *
            </label>
            <div className="relative">
              <input
                id="reg-username"
                type="text"
                required
                maxLength={16}
                value={form.username}
                onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
                className={`${inputClass} pr-10`}
                placeholder="Seu nick do Minecraft"
                autoComplete="username"
              />
              {form.username.length > 0 && (
                <span className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2">
                  {usernameStatus === "checking" ? (
                    <Loader2 size={16} className="animate-spin text-white/40" />
                  ) : usernameStatus === "taken" ? (
                    <X size={16} className="text-error" />
                  ) : usernameValid && usernameStatus === "available" ? (
                    <Check size={16} className="text-green-cs" />
                  ) : usernameValid ? (
                    <Check size={16} className="text-green-cs" />
                  ) : (
                    <X size={16} className="text-error" />
                  )}
                </span>
              )}
            </div>
            {form.username.length > 0 && !usernameValid && (
              <p className="mt-1 text-xs text-error">3-16 caracteres: letras, números e _ apenas</p>
            )}
            {usernameStatus === "taken" && (
              <p className="mt-1 text-xs text-error">Este username já está em uso</p>
            )}
            {usernameStatus === "available" && (
              <p className="mt-1 text-xs text-green-cs">Username disponível!</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-white">
              Email *
            </label>
            <input
              id="reg-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              className={inputClass}
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </div>

          {/* Data de Nascimento */}
          <div>
            <label htmlFor="reg-birthdate" className="block text-sm font-medium text-white">
              Data de Nascimento *
            </label>
            <input
              id="reg-birthdate"
              type="date"
              required
              value={form.birthdate}
              onChange={(e) => setForm((s) => ({ ...s, birthdate: e.target.value }))}
              className={`${inputClass} [color-scheme:dark]`}
            />
            {!birthdateValid && form.birthdate.length > 0 && (
              <p className="mt-1 text-xs text-error">Você precisa ter pelo menos 13 anos</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-white">
              Senha *
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                className={`${inputClass} pr-12`}
                placeholder="Crie uma senha forte"
                autoComplete="new-password"
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
            {form.password.length > 0 && (
              <div className="mt-2">
                <div className="h-1.5 w-full rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`}
                  />
                </div>
                <p className="mt-1 text-xs text-[#A0A0A0]">Força: {strength.label}</p>
              </div>
            )}
            {!passwordMinValid && form.password.length > 0 && (
              <p className="mt-1 text-xs text-error">Mínimo 8 caracteres, com ao menos 1 letra e 1 número</p>
            )}
          </div>

          {/* Confirmar Senha */}
          <div>
            <label htmlFor="reg-confirm" className="block text-sm font-medium text-white">
              Confirmar Senha *
            </label>
            <div className="relative">
              <input
                id="reg-confirm"
                type={showConfirm ? "text" : "password"}
                required
                minLength={8}
                value={form.confirmPassword}
                onChange={(e) => setForm((s) => ({ ...s, confirmPassword: e.target.value }))}
                className={`${inputClass} pr-12`}
                placeholder="Repita a senha"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-[#A0A0A0] hover:text-white"
                aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {!passwordMatch && form.confirmPassword.length > 0 && (
              <p className="mt-1 text-xs text-error">As senhas não coincidem</p>
            )}
          </div>

          {/* Aceitar Termos */}
          <label className="flex items-start gap-3 text-sm text-[#E0E0E0]">
            <input
              type="checkbox"
              checked={form.terms}
              onChange={(e) => setForm((s) => ({ ...s, terms: e.target.checked }))}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/5 accent-green-cs"
              required
            />
            <span>
              Li e concordo com os{" "}
              <Link href="/termos" className="text-green-cs hover:underline" target="_blank">
                Termos e Condições
              </Link>{" "}
              e a{" "}
              <Link href="/termos" className="text-green-cs hover:underline" target="_blank">
                Política de Privacidade
              </Link>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-cs px-6 py-3 text-sm font-bold uppercase text-white transition-all hover:bg-green-dark hover:shadow-[0_0_20px_rgba(76,175,80,0.3)] disabled:opacity-50"
          >
            {loading ? "Criando conta..." : "Criar Minha Conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#E0E0E0]">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-medium text-green-cs hover:underline">
            Fazer login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
