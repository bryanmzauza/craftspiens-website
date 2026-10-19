import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma-pg";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/products";
import { logPanel, requirePanel } from "@/lib/painel/session";
import { parseBody, productSchema } from "@/lib/painel/validation";
import { productData, round2, toPanelProduct } from "@/lib/painel/store";

type Params = { params: Promise<{ id: string }> };

// Campos comparados para o registro de atividade
const TRACKED = ["name", "slug", "price", "originalPrice", "category", "stock", "active", "featured", "badge", "durationDays"] as const;

// PUT /api/painel/produtos/[id] — salva o formulário completo do produto
export async function PUT(request: Request, { params }: Params) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;
  const { id } = await params;

  const current = await prisma.product.findUnique({ where: { id }, include: { _count: { select: { orderItems: true } } } });
  if (!current) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });

  const parsed = await parseBody(request, productSchema);
  if ("error" in parsed) return parsed.error;
  const input = parsed.data;

  if (input.slug !== current.slug) {
    if (current._count.orderItems > 0) {
      return NextResponse.json(
        { error: "Este produto já tem pedidos: o slug não pode mudar (o plugin entrega pelo slug).", field: "slug" },
        { status: 409 }
      );
    }
    if (await prisma.product.findUnique({ where: { slug: input.slug }, select: { id: true } })) {
      return NextResponse.json({ error: "Já existe um produto com este slug.", field: "slug" }, { status: 409 });
    }
  }

  const before = toPanelProduct(current);
  const product = await prisma.product.update({ where: { id }, data: productData(input) });
  const after = toPanelProduct(product);

  const changes: Record<string, { de: Prisma.InputJsonValue | null; para: Prisma.InputJsonValue | null }> = {};
  for (const key of TRACKED) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changes[key] = { de: before[key] ?? null, para: after[key] ?? null };
    }
  }
  await logPanel(access.session, changes.price ? "produto.preco" : "produto.editar", product.name, changes);

  return NextResponse.json({ product: after });
}

// PATCH /api/painel/produtos/[id] — ações rápidas da lista:
// { acao: "preco", preco } | { acao: "ativo", valor } | { acao: "destaque", valor }
// { acao: "promocao", percentual } | { acao: "encerrarPromocao" }
export async function PATCH(request: Request, { params }: Params) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;
  const { id } = await params;

  const current = await prisma.product.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const price = Number(current.price);
  const original = current.originalPrice != null ? Number(current.originalPrice) : null;
  let data: Prisma.ProductUpdateInput;
  let action: string;
  let details: Prisma.InputJsonObject;

  switch (body.acao) {
    case "preco": {
      const value = round2(Number(body.preco));
      if (!Number.isFinite(value) || value < 1 || value > 100000) {
        return NextResponse.json({ error: "O preço deve ficar entre R$ 1,00 e R$ 100.000,00." }, { status: 400 });
      }
      // Preço antigo riscado que deixaria de fazer sentido sai junto
      data = { price: value, ...(original != null && original <= value ? { originalPrice: null } : {}) };
      action = "produto.preco";
      details = { de: formatPrice(price), para: formatPrice(value) };
      break;
    }
    case "ativo":
    case "destaque": {
      if (typeof body.valor !== "boolean") return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
      data = body.acao === "ativo" ? { active: body.valor } : { featured: body.valor };
      action = body.acao === "ativo" ? (body.valor ? "produto.ativar" : "produto.desativar") : "produto.destaque";
      details = { valor: body.valor };
      break;
    }
    case "promocao": {
      const percent = Number(body.percentual);
      if (!Number.isFinite(percent) || percent < 1 || percent > 90) {
        return NextResponse.json({ error: "A promoção deve ficar entre 1% e 90%." }, { status: 400 });
      }
      // O preço cheio (ou o antigo, se já houver promoção) vira o preço riscado
      const base = original ?? price;
      const value = Math.max(round2(base * (1 - percent / 100)), 1);
      data = { price: value, originalPrice: base };
      action = "produto.promocao";
      details = { percentual: percent, de: formatPrice(base), para: formatPrice(value) };
      break;
    }
    case "encerrarPromocao": {
      if (original == null) return NextResponse.json({ error: "Este produto não está em promoção." }, { status: 400 });
      data = { price: original, originalPrice: null };
      action = "produto.encerrarPromocao";
      details = { de: formatPrice(price), para: formatPrice(original) };
      break;
    }
    default:
      return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
  }

  const product = await prisma.product.update({ where: { id }, data });
  await logPanel(access.session, action, product.name, details);
  return NextResponse.json({ product: toPanelProduct(product) });
}

// DELETE /api/painel/produtos/[id] — só produtos sem pedidos; os demais são desligados
export async function DELETE(request: Request, { params }: Params) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;
  const { id } = await params;

  const product = await prisma.product.findUnique({ where: { id }, include: { _count: { select: { orderItems: true } } } });
  if (!product) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  if (product._count.orderItems > 0) {
    return NextResponse.json(
      { error: "Este produto já tem pedidos e não pode ser excluído. Desative-o para tirá-lo da loja." },
      { status: 409 }
    );
  }

  await prisma.product.delete({ where: { id } });
  await logPanel(access.session, "produto.excluir", product.name, { slug: product.slug });
  return NextResponse.json({ ok: true });
}
