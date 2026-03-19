import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aulas",
  description:
    "Explore o catálogo de aulas gamificadas da CraftSapiens no Minecraft.",
};

export default function AulasPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 lg:px-6">
      <h1 className="font-[family-name:var(--font-press-start)] text-3xl text-white sm:text-4xl">
        AULAS
      </h1>
      <p className="mt-4 text-[#E0E0E0]">
        Catálogo de disciplinas e aulas gamificadas.
      </p>
    </div>
  );
}
