import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Minhas Compras",
  description: "Histórico de compras na loja CraftSapiens.",
};

export default function ComprasPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 lg:px-6">
      <h1 className="font-[family-name:var(--font-press-start)] text-3xl text-white sm:text-4xl">
        MINHAS COMPRAS
      </h1>
      <p className="mt-4 text-[#E0E0E0]">
        Histórico de pedidos e compras realizadas.
      </p>
    </div>
  );
}
