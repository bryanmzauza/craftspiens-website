import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Entre em contato com a CraftSapiens — dúvidas, sugestões e suporte.",
};

export default function ContatoPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 lg:px-6">
      <h1 className="font-[family-name:var(--font-press-start)] text-3xl text-white sm:text-4xl">
        CONTATO
      </h1>
      <p className="mt-4 text-[#E0E0E0]">
        Fale conosco — estamos sempre prontos para ajudar.
      </p>
    </div>
  );
}
