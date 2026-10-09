import crypto from "crypto";

// Validação da assinatura dos webhooks do MercadoPago (header x-signature).
// Formato do header: "ts=1704908010,v1=618c85345248dd820d5fd456117c2ab2ef8eda45a0282ff693eac24131a5e839"
// Manifesto assinado: "id:{data.id};request-id:{x-request-id};ts:{ts};"

type VerifyInput = {
  xSignature: string;
  xRequestId: string;
  dataId: string;
  secret: string;
  toleranceMs?: number;
};

export function verifyMpSignature({
  xSignature,
  xRequestId,
  dataId,
  secret,
  toleranceMs = 10 * 60 * 1000,
}: VerifyInput): boolean {
  const parts = new Map<string, string>();
  for (const part of xSignature.split(",")) {
    const index = part.indexOf("=");
    if (index > 0) parts.set(part.slice(0, index).trim(), part.slice(index + 1).trim());
  }

  const ts = parts.get("ts");
  const v1 = parts.get("v1");
  if (!ts || !v1 || !/^\d+$/.test(ts) || !/^[0-9a-f]+$/i.test(v1)) return false;

  // Rejeita notificações antigas (reenvio de requisições capturadas)
  const tsMs = Number(ts) > 1e12 ? Number(ts) : Number(ts) * 1000;
  if (Math.abs(Date.now() - tsMs) > toleranceMs) return false;

  // IDs alfanuméricos devem ser usados em minúsculas no manifesto
  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifest = `id:${id};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(v1.toLowerCase(), "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
