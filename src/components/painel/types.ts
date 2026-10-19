// Formatos que as rotas /api/painel devolvem, como chegam ao navegador (datas em texto)

export interface PanelSaleView {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";
  total: number;
  paidAmount: number | null;
  installments: number | null;
  paymentKind: "pix" | "cartao" | null;
  paymentMethod: string | null;
  coupon: { code: string; discount: number } | null;
  buyer: { id: string; nick: string | null; email: string };
  items: { name: string; slug: string; category: string; color: string | null; quantity: number; price: number }[];
  delivery: "delivered" | "pending" | "failed" | "none";
  createdAt: string;
  paidAt: string | null;
}

export interface Benefit {
  label: string;
  included: boolean;
}

export interface PanelProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  price: number;
  originalPrice: number | null;
  category: "VIP" | "RANK" | "COSMETICO" | "MOEDA" | "KIT";
  imageUrl: string | null;
  durationDays: number | null;
  benefits: Benefit[];
  stock: number;
  featured: boolean;
  badge: string | null;
  color: string | null;
  order: number;
  active: boolean;
  createdAt: string;
  stats: { sold: number; sold30: number; revenue: number; lastSaleAt: string | null };
  locked: boolean;
}

export interface PanelCoupon {
  id: string;
  code: string;
  discount: number;
  maxUses: number | null;
  uses: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
  state: "ativo" | "desligado" | "vencido" | "esgotado";
  locked: boolean;
  stats: { orders: number; revenue: number; discount: number };
}

export interface PanelDelivery {
  id: string;
  orderId?: string;
  kind: "DELIVER" | "REVOKE";
  status: "PENDING" | "PROCESSING" | "DELIVERED" | "FAILED";
  productName: string;
  productSlug?: string;
  category?: string;
  username: string;
  platform: "JAVA" | "BEDROCK";
  attempts: number;
  requiresOnline: boolean;
  claimedBy: string | null;
  claimedAt?: string | null;
  deliveredBy: string | null;
  deliveredAt: string | null;
  lastError: string | null;
  createdAt: string;
}

export interface PanelClass {
  id: string;
  title: string;
  topic: string | null;
  description: string | null;
  teacher: string;
  level: string | null;
  color: string;
  location: string | null;
  disciplineId: string | null;
  startsAt: string;
  endsAt: string;
  cancelled: boolean;
  cancelReason: string | null;
  seriesId: string | null;
  seriesSize: number;
  createdBy: string | null;
  discipline: { name: string; slug: string } | null;
}

export interface PanelDiscipline {
  id: string;
  name: string;
  slug: string;
  color: string;
  levels: string;
}
