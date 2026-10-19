// =============================================================================
// Painel: dados da loja (produtos, cupons, vendas) no formato das telas
// =============================================================================
import type { Coupon, Product } from "@/generated/prisma-pg";
import { prisma } from "@/lib/prisma";
import { parseBenefits } from "@/lib/products";
import type { ProductInput } from "@/lib/painel/validation";

// Datas do painel agrupadas no fuso da equipe
export const PANEL_TIMEZONE = "America/Sao_Paulo";

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: PANEL_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 2026-10-19 (dia no fuso de São Paulo) */
export function dayKey(date: Date): string {
  return dayFormatter.format(date);
}

export function toPanelProduct(product: Product) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    price: Number(product.price),
    originalPrice: product.originalPrice != null ? Number(product.originalPrice) : null,
    category: product.category,
    imageUrl: product.imageUrl,
    durationDays: product.durationDays,
    benefits: parseBenefits(product.benefits),
    stock: product.stock,
    featured: product.featured,
    badge: product.badge,
    color: product.color,
    order: product.order,
    active: product.active,
    createdAt: product.createdAt,
  };
}

/** Campos do Prisma a partir do formulário do painel */
export function productData(input: ProductInput) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    shortDescription: input.shortDescription ?? null,
    price: input.price,
    originalPrice: input.originalPrice ?? null,
    category: input.category,
    imageUrl: input.imageUrl ?? null,
    durationDays: input.durationDays ?? null,
    benefits: input.benefits.length > 0 ? JSON.stringify(input.benefits) : null,
    stock: input.stock,
    featured: input.featured,
    badge: input.badge ?? null,
    color: input.color ?? null,
    active: input.active,
    ...(input.order != null ? { order: input.order } : {}),
  };
}

export function toPanelCoupon(coupon: Coupon) {
  return {
    id: coupon.id,
    code: coupon.code,
    discount: Number(coupon.discount),
    maxUses: coupon.maxUses,
    uses: coupon.uses,
    active: coupon.active,
    expiresAt: coupon.expiresAt,
    createdAt: coupon.createdAt,
  };
}

/** Situação do cupom para a lista: ativo, desligado, vencido ou esgotado */
export function couponState(coupon: Pick<Coupon, "active" | "expiresAt" | "maxUses" | "uses">, now = Date.now()) {
  if (!coupon.active) return "desligado" as const;
  if (coupon.expiresAt && coupon.expiresAt.getTime() <= now) return "vencido" as const;
  if (coupon.maxUses != null && coupon.uses >= coupon.maxUses) return "esgotado" as const;
  return "ativo" as const;
}

/**
 * Vendas aprovadas por produto e por cupom (todas as datas). O total do pedido
 * já tem o desconto do cupom; cada pedido tem um produto só.
 */
export async function approvedTotals() {
  const orders = await prisma.order.findMany({
    where: { status: "APPROVED" },
    select: {
      total: true,
      couponId: true,
      paidAt: true,
      createdAt: true,
      items: { select: { productId: true, quantity: true, price: true } },
    },
  });

  const recentFrom = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const byProduct = new Map<string, { sold: number; revenue: number; sold30: number; lastSaleAt: Date | null }>();
  const byCoupon = new Map<string, { orders: number; revenue: number; discount: number }>();

  for (const order of orders) {
    const total = Number(order.total);
    const paidAt = order.paidAt ?? order.createdAt;
    const gross = order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    for (const item of order.items) {
      const entry = byProduct.get(item.productId) ?? { sold: 0, revenue: 0, sold30: 0, lastSaleAt: null };
      entry.sold += item.quantity;
      // Receita dividida pelo peso do item no pedido (hoje é sempre um item)
      entry.revenue += gross > 0 ? (total * Number(item.price) * item.quantity) / gross : 0;
      if (paidAt.getTime() >= recentFrom) entry.sold30 += item.quantity;
      if (!entry.lastSaleAt || paidAt > entry.lastSaleAt) entry.lastSaleAt = paidAt;
      byProduct.set(item.productId, entry);
    }
    if (order.couponId) {
      const entry = byCoupon.get(order.couponId) ?? { orders: 0, revenue: 0, discount: 0 };
      entry.orders += 1;
      entry.revenue += total;
      entry.discount += Math.max(gross - total, 0);
      byCoupon.set(order.couponId, entry);
    }
  }

  return { byProduct, byCoupon };
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
