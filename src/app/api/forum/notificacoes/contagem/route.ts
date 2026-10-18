import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/forum/access";

// GET /api/forum/notificacoes/contagem — só o número de notificações por ler (sino da navbar)
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });
  return NextResponse.json({ unread }, { headers: { "Cache-Control": "no-store" } });
}
