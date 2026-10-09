// IP do cliente para rate limiting.
//
// Em produção o site roda atrás do nginx, que deve definir
//   proxy_set_header X-Real-IP $remote_addr;
// O X-Forwarded-For NÃO é usado: o primeiro valor vem do próprio cliente e pode
// ser forjado para burlar os limites.
let warned = false;

export function getClientIp(headers: Headers): string {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  if (process.env.NODE_ENV !== "production") return "dev-local";

  if (!warned) {
    warned = true;
    console.warn("[client-ip] Header X-Real-IP ausente — verifique a configuração do nginx");
  }
  return "unknown";
}
