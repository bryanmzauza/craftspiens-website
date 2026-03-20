import type { Metadata } from "next";
import { SobreContent } from "@/components/sobre/SobreContent";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "Conheça a história da CraftSapiens, o maior metaverso educacional do mundo. Aulas gamificadas no Minecraft fundadas pelo Prof. Helton Alvares Gonçalves.",
};

export default function SobrePage() {
  return <SobreContent />;
}
