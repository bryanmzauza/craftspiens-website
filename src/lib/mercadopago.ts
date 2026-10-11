import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { getEnv, siteUrl } from "@/lib/env";
import { MAX_INSTALLMENTS, type InstallmentRate } from "@/lib/installments";

// Dois caminhos de pagamento, os dois no MercadoPago:
// - Pix pela API de pagamentos: o QR Code aparece no próprio site, sem redirecionar.
//   É a forma mais barata (taxa percentual, sem valor fixo) e cai na hora.
// - Cartão pelo Checkout Pro: redireciona para a página do MercadoPago.
// Boleto fica fora: a taxa fixa não compensa para itens de poucos reais.

export const PIX_EXPIRATION_MINUTES = 30;
const STATEMENT_DESCRIPTOR = "CRAFTSAPIENS";

let client: MercadoPagoConfig | undefined;

function getClient(): MercadoPagoConfig {
  client ??= new MercadoPagoConfig({ accessToken: getEnv().MERCADOPAGO_ACCESS_TOKEN, options: { timeout: 15_000 } });
  return client;
}

export function getPaymentClient(): Payment {
  return new Payment(getClient());
}

// O MercadoPago recusa notification_url que não seja pública (erro 4020 com
// http://localhost). Fora de HTTPS o campo vai vazio e vale a URL de teste
// configurada no painel (um túnel para o localhost; ver docs/mercadopago.md).
function webhookUrl(): string | undefined {
  const base = siteUrl();
  return base.startsWith("https://") ? `${base}/api/loja/webhook` : undefined;
}

// Credenciais de teste só aceitam como pagador uma conta de teste compradora
// ("Unauthorized use of live credentials" com o e-mail real do aluno)
function payerEmail(email: string): string {
  const env = getEnv();
  return env.NODE_ENV !== "production" && env.MERCADOPAGO_TEST_PAYER_EMAIL ? env.MERCADOPAGO_TEST_PAYER_EMAIL : email;
}

/** URL da página do pedido, para onde o Checkout Pro volta depois do pagamento */
export function orderPageUrl(orderId: string): string {
  return `${siteUrl()}/loja/pedido/${orderId}`;
}

/** Data no formato exigido pelo MercadoPago: 2026-10-10T18:30:00.000-03:00 */
function toMpDate(date: Date): string {
  const offsetMinutes = -180; // horário de Brasília, sem horário de verão
  const local = new Date(date.getTime() + offsetMinutes * 60_000);
  const iso = local.toISOString().replace("Z", "");
  return `${iso}-03:00`;
}

type Payer = {
  email: string;
  cpf: string;
  /** Nick do jogador; o MercadoPago pede um nome para o pagador do Pix */
  name: string;
};

type PixInput = {
  orderId: string;
  amount: number;
  description: string;
  payer: Payer;
};

export type PixResult = {
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string | null;
  expiresAt: Date;
};

export async function createPixPayment({ orderId, amount, description, payer }: PixInput): Promise<PixResult> {
  const expiresAt = new Date(Date.now() + PIX_EXPIRATION_MINUTES * 60_000);
  const payment = await getPaymentClient().create({
    body: {
      transaction_amount: amount,
      description,
      payment_method_id: "pix",
      external_reference: orderId,
      notification_url: webhookUrl(),
      statement_descriptor: STATEMENT_DESCRIPTOR,
      date_of_expiration: toMpDate(expiresAt),
      payer: {
        email: payerEmail(payer.email),
        first_name: payer.name,
        identification: { type: "CPF", number: payer.cpf },
      },
      metadata: { order_id: orderId },
    },
    // Repetir a criação do mesmo pedido não gera dois pagamentos
    requestOptions: { idempotencyKey: `pix-${orderId}` },
  });

  const data = payment.point_of_interaction?.transaction_data;
  if (!payment.id || !data?.qr_code || !data.qr_code_base64) {
    throw new Error("MercadoPago não devolveu o QR Code do Pix");
  }
  return {
    paymentId: String(payment.id),
    qrCode: data.qr_code,
    qrCodeBase64: data.qr_code_base64,
    ticketUrl: data.ticket_url ?? null,
    expiresAt,
  };
}

type CheckoutInput = {
  orderId: string;
  productId: string;
  title: string;
  description: string;
  amount: number;
  quantity: number;
  payer: Payer;
};

export type CheckoutResult = { preferenceId: string; initPoint: string };

/** Checkout Pro para cartão (até 3x). Pix também aparece lá; boleto não. */
export async function createCardCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const back = orderPageUrl(input.orderId);
  const preference = await new Preference(getClient()).create({
    body: {
      items: [
        {
          id: input.productId,
          title: input.title,
          description: input.description,
          quantity: input.quantity,
          unit_price: input.amount,
          currency_id: "BRL",
        },
      ],
      payer: {
        email: payerEmail(input.payer.email),
        name: input.payer.name,
        identification: { type: "CPF", number: input.payer.cpf },
      },
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }, { id: "atm" }],
        installments: MAX_INSTALLMENTS,
      },
      back_urls: { success: back, pending: back, failure: back },
      auto_return: "approved",
      notification_url: webhookUrl(),
      statement_descriptor: STATEMENT_DESCRIPTOR,
      external_reference: input.orderId,
      metadata: { order_id: input.orderId },
    },
    requestOptions: { idempotencyKey: `pref-${input.orderId}` },
  });

  if (!preference.id || !preference.init_point) {
    throw new Error("MercadoPago não devolveu o link do Checkout Pro");
  }
  return { preferenceId: preference.id, initPoint: preference.init_point };
}

// Taxas de parcelamento: não dependem do valor, então uma consulta serve para
// todos os produtos. Bandeira de referência: Mastercard (Visa tem as mesmas taxas
// no Mercado Pago; o valor final aparece no Checkout Pro antes de confirmar).
const RATES_TTL_MS = 60 * 60 * 1000;
const RATES_REFERENCE_AMOUNT = 1000;
let ratesCache: { rates: InstallmentRate[]; expiresAt: number } | undefined;

type MpPayerCost = {
  installments: number;
  installment_rate: number;
  min_allowed_amount: number;
  max_allowed_amount: number;
};

export async function getInstallmentRates(): Promise<InstallmentRate[]> {
  if (ratesCache && ratesCache.expiresAt > Date.now()) return ratesCache.rates;

  const url = new URL("https://api.mercadopago.com/v1/payment_methods/installments");
  url.searchParams.set("amount", String(RATES_REFERENCE_AMOUNT));
  url.searchParams.set("payment_method_id", "master");
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${getEnv().MERCADOPAGO_ACCESS_TOKEN}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`MercadoPago respondeu ${res.status} na consulta de parcelas`);

  const data = (await res.json()) as { payer_costs?: MpPayerCost[] }[];
  const costs = data[0]?.payer_costs ?? [];
  const rates = costs
    .filter((c) => c.installments <= MAX_INSTALLMENTS)
    .map((c) => ({
      installments: c.installments,
      rate: c.installment_rate,
      minAmount: c.min_allowed_amount,
      maxAmount: c.max_allowed_amount,
    }));
  if (rates.length === 0) throw new Error("MercadoPago não devolveu taxas de parcelamento");

  ratesCache = { rates, expiresAt: Date.now() + RATES_TTL_MS };
  return rates;
}
