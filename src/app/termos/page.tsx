import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos e Condições",
  description: "Termos de uso e política de privacidade da CraftSapiens.",
};

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 lg:px-6">
      <h1 className="font-[family-name:var(--font-press-start)] text-3xl text-white sm:text-4xl">
        TERMOS E CONDIÇÕES
      </h1>
      <p className="mt-4 text-[#E0E0E0]">
        Termos de uso, regras e política de privacidade.
      </p>
    </div>
  );
}
