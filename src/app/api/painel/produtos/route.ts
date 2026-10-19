import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logPanel, requirePanel } from "@/lib/painel/session";
import { parseBody, productSchema } from "@/lib/painel/validation";
import { approvedTotals, productData, round2, toPanelProduct } from "@/lib/painel/store";

export const dynamic = "force-dynamic";

// GET /api/painel/produtos — todos os produtos (ativos e desligados) com as vendas
export async function GET(request: Request) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;

  const [products, totals, withOrders] = await Promise.all([
    prisma.product.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
    approvedTotals(),
    prisma.orderItem.groupBy({ by: ["productId"], _count: { _all: true } }),
  ]);
  const hasOrders = new Set(withOrders.map((row) => row.productId));

  return NextResponse.json({
    products: products.map((product) => {
      const stats = totals.byProduct.get(product.id);
      return {
        ...toPanelProduct(product),
        stats: {
          sold: stats?.sold ?? 0,
          sold30: stats?.sold30 ?? 0,
          revenue: round2(stats?.revenue ?? 0),
          lastSaleAt: stats?.lastSaleAt ?? null,
        },
        // Com pedidos, o slug fica travado (o plugin entrega pelo slug) e o produto não pode ser excluído
        locked: hasOrders.has(product.id),
      };
    }),
  });
}

// POST /api/painel/produtos — cria um produto
export async function POST(request: Request) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;

  const parsed = await parseBody(request, productSchema);
  if ("error" in parsed) return parsed.error;
  const input = parsed.data;

  if (await prisma.product.findUnique({ where: { slug: input.slug }, select: { id: true } })) {
    return NextResponse.json({ error: "Já existe um produto com este slug.", field: "slug" }, { status: 409 });
  }

  const last = await prisma.product.aggregate({ _max: { order: true } });
  const product = await prisma.product.create({
    data: { ...productData(input), order: input.order ?? (last._max.order ?? 0) + 10 },
  });

  await logPanel(access.session, "produto.criar", product.name, { slug: product.slug, preco: input.price });
  return NextResponse.json({ product: toPanelProduct(product) }, { status: 201 });
}
