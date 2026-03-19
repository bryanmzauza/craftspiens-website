import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Criar Conta",
  description:
    "Registre-se na CraftSapiens e comece sua jornada no maior metaverso educacional.",
};

export default function RegistroPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <h1 className="text-center font-[family-name:var(--font-press-start)] text-2xl text-white">
          CRIAR CONTA
        </h1>
        <p className="mt-2 text-center text-sm text-[#E0E0E0]">
          Comece sua jornada na CraftSapiens
        </p>

        <form className="mt-8 space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-white">
              Username (Nick do Minecraft)
            </label>
            <input
              id="username"
              type="text"
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
              placeholder="Seu nick do Minecraft"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white">
              Senha
            </label>
            <input
              id="password"
              type="password"
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
              placeholder="Crie uma senha forte"
              required
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white">
              Confirmar Senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
              placeholder="Repita a senha"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-green-cs px-6 py-3 text-sm font-bold uppercase text-white transition-all hover:bg-green-dark hover:shadow-[0_0_20px_rgba(76,175,80,0.3)]"
          >
            Criar Conta Grátis
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#E0E0E0]">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-medium text-green-cs hover:underline">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
