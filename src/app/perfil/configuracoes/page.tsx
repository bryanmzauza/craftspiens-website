import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configurações",
  description: "Configurações da conta CraftSapiens.",
};

export default function ConfiguracoesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 lg:px-6">
      <h1 className="font-[family-name:var(--font-press-start)] text-3xl text-white sm:text-4xl">
        CONFIGURAÇÕES
      </h1>
      <p className="mt-4 text-[#E0E0E0]">
        Gerencie dados da conta, senha, notificações e privacidade.
      </p>
    </div>
  );
}
