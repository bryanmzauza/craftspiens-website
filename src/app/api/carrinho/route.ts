import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const items = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          originalPrice: true,
          category: true,
          imageUrl: true,
          shortDescription: true,
          badge: true,
          color: true,
          active: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const activeItems = items.filter((item) => item.product.active);

  const subtotal = activeItems.reduce(
    (acc, item) => acc + Number(item.product.price) * item.quantity,
    0
  );

  return NextResponse.json({
    items: activeItems.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: item.product,
    })),
    subtotal,
    itemCount: activeItems.reduce((acc, item) => acc + item.quantity, 0),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { productId, quantity = 1 } = body;

  if (!productId || typeof productId !== "string") {
    return NextResponse.json({ error: "productId é obrigatório" }, { status: 400 });
  }

  if (typeof quantity !== "number" || quantity < 1 || quantity > 99) {
    return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || !product.active) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  if (product.stock !== -1 && product.stock < quantity) {
    return NextResponse.json({ error: "Estoque insuficiente" }, { status: 400 });
  }

  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
  });

  if (existing) {
    const newQty = existing.quantity + quantity;
    const updated = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty },
    });
    return NextResponse.json({ item: updated, message: "Quantidade atualizada" });
  }

  const item = await prisma.cartItem.create({
    data: {
      userId: session.user.id,
      productId,
      quantity,
    },
  });

  return NextResponse.json({ item, message: "Produto adicionado ao carrinho" }, { status: 201 });
}
