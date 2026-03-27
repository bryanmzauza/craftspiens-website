import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              category: true,
              imageUrl: true,
              shortDescription: true,
            },
          },
        },
      },
      coupon: {
        select: { code: true, discount: true },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  // Only allow access to own orders (unless admin)
  if (order.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  return NextResponse.json({
    id: order.id,
    status: order.status,
    total: Number(order.total),
    paymentMethod: order.paymentMethod,
    coupon: order.coupon
      ? { code: order.coupon.code, discount: Number(order.coupon.discount) }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      product: item.product,
      quantity: item.quantity,
      price: Number(item.price),
      subtotal: Number(item.price) * item.quantity,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  });
}
