import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "Conheça a história da CraftSapiens, o maior metaverso educacional do mundo.",
};

export default function SobrePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 lg:px-6">
      <h1 className="font-[family-name:var(--font-press-start)] text-3xl text-white sm:text-4xl">
        SOBRE
      </h1>
      <p className="mt-4 text-[#E0E0E0]">
        Conheça a CraftSapiens — O Maior Metaverso Educacional do Mundo.
      </p>
    </div>
  );
}
