import { NextResponse } from "next/server";
import { getMinecraftStatus } from "@/lib/minecraft-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getMinecraftStatus();
  return NextResponse.json(status, {
    // O status já fica em cache no servidor por 15 s; o navegador não deve guardar
    headers: { "Cache-Control": "no-store" },
  });
}
