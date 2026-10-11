import { NextResponse } from "next/server";
import { DISCORD_INVITE_CODE } from "@/lib/constants";

// Contagem de membros do servidor do Discord, a partir do convite público.
// Fica em cache por 10 minutos para não depender da API do Discord a cada visita.
export const revalidate = 600;

export async function GET() {
  try {
    const res = await fetch(
      `https://discord.com/api/v10/invites/${DISCORD_INVITE_CODE}?with_counts=true`,
      { next: { revalidate: 600 }, signal: AbortSignal.timeout(5_000) }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    return NextResponse.json({
      members: data.approximate_member_count ?? null,
      online: data.approximate_presence_count ?? null,
    });
  } catch {
    return NextResponse.json({ members: null, online: null });
  }
}
