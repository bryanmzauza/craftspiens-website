import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { quantity } = body;

  if (typeof quantity !== "number" || quantity < 1 || quantity > 99) {
    return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 });
  }

  const item = await prisma.cartItem.findUnique({ where: { id } });

  if (!item || item.userId !== session.user.id) {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }

  const updated = await prisma.cartItem.update({
    where: { id },
    data: { quantity },
  });

  return NextResponse.json({ item: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const item = await prisma.cartItem.findUnique({ where: { id } });

  if (!item || item.userId !== session.user.id) {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }

  await prisma.cartItem.delete({ where: { id } });

  return NextResponse.json({ message: "Item removido do carrinho" });
}
