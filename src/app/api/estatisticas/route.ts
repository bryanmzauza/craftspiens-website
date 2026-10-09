import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/estatisticas — números exibidos na home
export async function GET() {
  const [alunos, aulas] = await Promise.all([
    prisma.user.count({ where: { deactivatedAt: null } }),
    prisma.lesson.count({
      where: { active: true, discipline: { active: true } },
    }),
  ]);

  return NextResponse.json({ alunos, aulas });
}
