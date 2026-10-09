import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    // Encerra todas as sessões; a conta é reativada no próximo login
    data: { deactivatedAt: new Date(), sessionVersion: { increment: 1 } },
  });

  return NextResponse.json({ message: "Conta desativada com sucesso." });
}
