import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const validStatuses = ["PENDING", "APPROVED", "REJECTED", "REFUNDED"];
  const statusFilter =
    status && validStatuses.includes(status.toUpperCase())
      ? status.toUpperCase()
      : undefined;

  const where = {
    userId: session.user.id,
    ...(statusFilter && { status: statusFilter as "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED" }),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                category: true,
                imageUrl: true,
                durationDays: true,
              },
            },
          },
        },
        coupon: {
          select: { code: true, discount: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ]);

  // Detectar VIP ativo: pedido APPROVED com produto VIP e durationDays definido
  const activeVip = await prisma.order.findFirst({
    where: {
      userId: session.user.id,
      status: "APPROVED",
      items: {
        some: {
          product: {
            category: "VIP",
            durationDays: { not: null },
          },
        },
      },
    },
    include: {
      items: {
        where: {
          product: {
            category: "VIP",
            durationDays: { not: null },
          },
        },
        include: {
          product: {
            select: { name: true, durationDays: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  let vip: { name: string; expiresAt: string } | null = null;
  if (activeVip) {
    const vipItem = activeVip.items[0];
    if (vipItem?.product.durationDays) {
      const expiresAt = new Date(activeVip.createdAt);
      expiresAt.setDate(expiresAt.getDate() + vipItem.product.durationDays);
      if (expiresAt > new Date()) {
        vip = {
          name: vipItem.product.name,
          expiresAt: expiresAt.toISOString(),
        };
      }
    }
  }

  const totalApproved = await prisma.order.aggregate({
    where: { userId: session.user.id, status: "APPROVED" },
    _sum: { total: true },
    _count: true,
  });

  return NextResponse.json({
    orders: orders.map((order) => ({
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
      })),
      createdAt: order.createdAt,
    })),
    vip,
    summary: {
      totalSpent: Number(totalApproved._sum.total || 0),
      totalOrders: total,
      approvedOrders: totalApproved._count,
    },
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  });
}
