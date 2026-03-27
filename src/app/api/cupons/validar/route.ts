import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const code = (body.code as string || "").trim().toUpperCase();

  if (!code || code.length > 50) {
    return NextResponse.json(
      { error: "Código de cupom inválido" },
      { status: 400 }
    );
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code },
  });

  if (!coupon) {
    return NextResponse.json(
      { error: "Cupom não encontrado" },
      { status: 404 }
    );
  }

  if (!coupon.active) {
    return NextResponse.json(
      { error: "Este cupom está desativado" },
      { status: 400 }
    );
  }

  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return NextResponse.json(
      { error: "Este cupom expirou" },
      { status: 400 }
    );
  }

  if (coupon.maxUses && coupon.uses >= coupon.maxUses) {
    return NextResponse.json(
      { error: "Este cupom atingiu o limite de usos" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    valid: true,
    code: coupon.code,
    discount: Number(coupon.discount),
    id: coupon.id,
  });
}
