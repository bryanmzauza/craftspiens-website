import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPublicProduct } from "@/lib/products";

export const dynamic = "force-dynamic";

// GET /api/loja/produtos — catálogo público da loja
export async function GET() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ products: products.map(toPublicProduct) });
}
