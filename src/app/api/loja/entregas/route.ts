import { NextResponse } from "next/server";
import {
  checkDeliveryToken,
  claimDeliveries,
  SERVER_NAME_PATTERN,
  toPluginDelivery,
} from "@/lib/deliveries";

// GET /api/loja/entregas?servidor=survival&online=uuid1,uuid2&limite=20
// Usada pelo plugin da loja (docs/plugin-entregas.md). Reserva e devolve as
// entregas pendentes que este servidor pode executar. Cada entrega devolvida
// precisa ser confirmada em POST /api/loja/entregas/[id]; sem confirmação em
// 10 minutos, ela volta para a fila.

export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ONLINE = 500;
const MAX_LIMIT = 50;

export async function GET(request: Request) {
  const authorized = checkDeliveryToken(request);
  if (authorized === null) {
    return NextResponse.json({ error: "API de entregas desligada (DELIVERY_API_TOKEN ausente)" }, { status: 503 });
  }
  if (!authorized) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const server = (searchParams.get("servidor") ?? "").trim().toLowerCase();
  if (!SERVER_NAME_PATTERN.test(server)) {
    return NextResponse.json({ error: "Parâmetro 'servidor' inválido" }, { status: 400 });
  }

  const online = (searchParams.get("online") ?? "")
    .split(",")
    .map((uuid) => uuid.trim().toLowerCase())
    .filter((uuid) => UUID_PATTERN.test(uuid))
    .slice(0, MAX_ONLINE);

  const limit = Math.min(Math.max(Number(searchParams.get("limite")) || 20, 1), MAX_LIMIT);

  const rows = await claimDeliveries(server, online, limit);
  return NextResponse.json({ servidor: server, entregas: rows.map(toPluginDelivery) });
}
