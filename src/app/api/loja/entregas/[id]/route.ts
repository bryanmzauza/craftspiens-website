import { NextResponse } from "next/server";
import { checkDeliveryToken, resolveDelivery, SERVER_NAME_PATTERN } from "@/lib/deliveries";

// POST /api/loja/entregas/[id] — resultado de uma entrega executada pelo plugin.
// Body: { servidor: "lobby", ok: true }
//       { servidor, ok: false, erro: "..." }                       falha: volta para a fila até 5 tentativas
//       { servidor, ok: false, aguardarJogador: true, erro?: "" } adiada até o jogador entrar (não conta tentativa)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authorized = checkDeliveryToken(request);
  if (authorized === null) {
    return NextResponse.json({ error: "API de entregas desligada (DELIVERY_API_TOKEN ausente)" }, { status: 503 });
  }
  if (!authorized) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const server = typeof body.servidor === "string" ? body.servidor.trim().toLowerCase() : "";
  if (!SERVER_NAME_PATTERN.test(server) || typeof body.ok !== "boolean") {
    return NextResponse.json({ error: "Body inválido: esperado { servidor, ok, erro? }" }, { status: 400 });
  }

  const found = await resolveDelivery(
    id,
    server,
    body.ok
      ? { ok: true }
      : {
          ok: false,
          error: typeof body.erro === "string" ? body.erro : undefined,
          waitForPlayer: body.aguardarJogador === true,
        }
  );
  if (!found) {
    return NextResponse.json({ error: "Entrega não encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
