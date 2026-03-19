import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comunidade",
  description: "Fórum da comunidade CraftSapiens — discussões, dúvidas e mais.",
};

export default function ComunidadePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 lg:px-6">
      <h1 className="font-[family-name:var(--font-press-start)] text-3xl text-white sm:text-4xl">
        COMUNIDADE
      </h1>
      <p className="mt-4 text-[#E0E0E0]">
        Fórum da comunidade CraftSapiens com categorias, tópicos e discussões.
      </p>
    </div>
  );
}
