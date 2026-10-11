import type { Product } from "@/generated/prisma-pg";

/** Estoque -1 significa produto sem limite de estoque */
export function isUnlimitedStock(stock: number): boolean {
  return stock === -1;
}

export type Benefit = { label: string; included: boolean };

/**
 * O campo `benefits` guarda JSON: uma lista de textos (`["Kit diário", ...]`)
 * ou de objetos (`[{ "label": "Kit diário", "included": true }, ...]`).
 */
export function parseBenefits(text: string | null): Benefit[] {
  if (!text) return [];
  try {
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item): Benefit[] => {
      if (typeof item === "string") return [{ label: item, included: true }];
      if (item && typeof item === "object" && typeof item.label === "string") {
        return [{ label: item.label, included: item.included !== false }];
      }
      return [];
    });
  } catch {
    return [];
  }
}

/** Valor por mês de um plano, para comparar mensal e anual */
export function monthlyEquivalent(price: number, durationDays: number | null): number | null {
  if (!durationDays || durationDays < 28) return null;
  return Math.round((price / (durationDays / 30)) * 100) / 100;
}

/** Dados do produto que vão para o navegador */
export function toPublicProduct(product: Product) {
  const price = Number(product.price);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    price,
    originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
    category: product.category,
    imageUrl: product.imageUrl,
    durationDays: product.durationDays,
    monthlyPrice: monthlyEquivalent(price, product.durationDays),
    benefits: parseBenefits(product.benefits),
    inStock: isUnlimitedStock(product.stock) || product.stock > 0,
    featured: product.featured,
    badge: product.badge,
    color: product.color,
  };
}

export type PublicProduct = ReturnType<typeof toPublicProduct>;

export function formatPrice(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}
