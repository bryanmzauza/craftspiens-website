// Mapeamentos visuais do catálogo compartilhados entre a vitrine, a compra e o pedido
import {
  Crown,
  Coins,
  Sparkles,
  Flame,
  Heart,
  Music,
  Star,
  PartyPopper,
  Package,
  type LucideIcon,
} from "lucide-react";

export type PlanFamily = "vip" | "premium";

/** vip, vip-anual, vip-cosmeticos -> vip; premium, premium-anual, premium-cosmeticos -> premium */
export function planFamily(slug: string): PlanFamily {
  return slug.startsWith("premium") ? "premium" : "vip";
}

// Combo do plano mensal com os cosméticos por 30 dias (vip -> vip-cosmeticos).
// É um produto próprio, fora da grade de planos; a página de compra do plano
// oferece a troca. O plugin entrega o plano e os cosméticos temporários.
const COMBO_SUFFIX = "-cosmeticos";

export function isCombo(slug: string): boolean {
  return slug.endsWith(COMBO_SUFFIX);
}

export function comboSlug(planSlug: string): string {
  return `${planSlug}${COMBO_SUFFIX}`;
}

export function comboBaseSlug(slug: string): string {
  return isCombo(slug) ? slug.slice(0, -COMBO_SUFFIX.length) : slug;
}

const COSMETIC_ICONS: [RegExp, LucideIcon][] = [
  [/chama|fogo|fire/, Flame],
  [/corac|heart/, Heart],
  [/nota|music/, Music],
  [/estrela|star/, Star],
  [/entrada|fogos|join/, PartyPopper],
];

export function cosmeticIcon(slug: string): LucideIcon {
  const match = COSMETIC_ICONS.find(([pattern]) => pattern.test(slug));
  return match ? match[1] : Sparkles;
}

export function productIcon(category: string, slug: string): LucideIcon {
  switch (category) {
    case "VIP":
      return Crown;
    case "MOEDA":
      return Coins;
    case "COSMETICO":
      return cosmeticIcon(slug);
    default:
      return Package;
  }
}

export const CATEGORY_LABELS: Record<string, string> = {
  VIP: "Plano",
  MOEDA: "Sapiens",
  COSMETICO: "Cosmético",
  RANK: "Rank",
  KIT: "Kit",
};
