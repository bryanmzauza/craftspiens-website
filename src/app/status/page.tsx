import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Status do Servidor",
  description:
    "Verifique o status do servidor Minecraft da CraftSapiens em tempo real.",
};

export default function StatusPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 lg:px-6">
      <h1 className="font-[family-name:var(--font-press-start)] text-3xl text-white sm:text-4xl">
        STATUS DO SERVIDOR
      </h1>
      <p className="mt-4 text-[#E0E0E0]">
        Informações em tempo real sobre o servidor Minecraft.
      </p>
    </div>
  );
}
