import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meu Perfil",
  description: "Painel do jogador CraftSapiens — métricas, progresso e configurações.",
};

export default function PerfilPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 lg:px-6">
      <h1 className="font-[family-name:var(--font-press-start)] text-3xl text-white sm:text-4xl">
        MEU PERFIL
      </h1>
      <p className="mt-4 text-[#E0E0E0]">
        Dashboard do jogador — métricas, progresso e atividades.
      </p>
    </div>
  );
}
