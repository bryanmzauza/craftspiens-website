import { NextResponse } from "next/server";
import { getInstallmentRates } from "@/lib/mercadopago";
import { MAX_INSTALLMENTS } from "@/lib/installments";

export const dynamic = "force-dynamic";

// GET /api/loja/parcelas — taxas de parcelamento do cartão no Mercado Pago.
// A página de compra calcula parcela, juros e total para o valor do pedido
// (buildInstallmentPlans). Sem dados do usuário: pode ficar em cache.
export async function GET() {
  try {
    const rates = await getInstallmentRates();
    return NextResponse.json(
      { maxInstallments: MAX_INSTALLMENTS, rates },
      { headers: { "Cache-Control": "public, max-age=600" } }
    );
  } catch (err) {
    console.error("[parcelas] Erro no MercadoPago:", (err as Error).message);
    return NextResponse.json({ error: "Não foi possível consultar as parcelas." }, { status: 502 });
  }
}
