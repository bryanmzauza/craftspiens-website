import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { getEnv, siteUrl } from "@/lib/env";

let client: MercadoPagoConfig | undefined;

function getClient(): MercadoPagoConfig {
  client ??= new MercadoPagoConfig({ accessToken: getEnv().MERCADOPAGO_ACCESS_TOKEN });
  return client;
}

export function getPreferenceClient(): Preference {
  return new Preference(getClient());
}

export function getPaymentClient(): Payment {
  return new Payment(getClient());
}

export function getMpConfig() {
  const base = siteUrl();
  return {
    backUrls: {
      success: `${base}/loja/pedido/sucesso`,
      failure: `${base}/loja/pedido/falha`,
      pending: `${base}/loja/pedido/pendente`,
    },
    notificationUrl: `${base}/api/loja/webhook`,
    statementDescriptor: "CRAFTSAPIENS",
    autoReturn: "approved" as const,
  };
}
