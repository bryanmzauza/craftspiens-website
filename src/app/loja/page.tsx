import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loja",
  description:
    "Loja oficial CraftSapiens — VIP, Ranks, Cosméticos e muito mais.",
};

export default function LojaPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 lg:px-6">
      <h1 className="font-[family-name:var(--font-press-start)] text-3xl text-white sm:text-4xl">
        LOJA
      </h1>
      <p className="mt-4 text-[#E0E0E0]">
        Adquira planos VIP, ranks exclusivos e itens in-game.
      </p>
    </div>
  );
}
