import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  throw new Error("MERCADOPAGO_ACCESS_TOKEN is not defined");
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

export const preference = new Preference(client);
export const payment = new Payment(client);

export const MP_CONFIG = {
  backUrls: {
    success: `${process.env.AUTH_URL}/loja/pedido/sucesso`,
    failure: `${process.env.AUTH_URL}/loja/pedido/falha`,
    pending: `${process.env.AUTH_URL}/loja/pedido/pendente`,
  },
  notificationUrl: `${process.env.AUTH_URL}/api/loja/webhook`,
  statementDescriptor: "CRAFTSAPIENS",
  autoReturn: "approved" as const,
};
