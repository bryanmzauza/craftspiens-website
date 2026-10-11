// =============================================================================
// Variáveis de ambiente — validação centralizada
// =============================================================================
// A validação é preguiçosa (só roda na primeira chamada de getEnv()), para que o
// `next build` não dependa das variáveis de produção. Em runtime, o servidor
// valida tudo ao subir via src/instrumentation.ts e falha com uma mensagem única.
import { z } from "zod";
import { SERVER_IP } from "@/lib/constants";

// Vazio no .env conta como "não definido"
const optionalEmail = z.preprocess((v) => (v === "" ? undefined : v), z.email().optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // NextAuth
  AUTH_SECRET: z.string().min(32, "deve ter pelo menos 32 caracteres (openssl rand -base64 32)"),
  AUTH_URL: z
    .url("deve ser uma URL completa, ex: https://craftsapiens.com.br")
    .transform((url) => url.replace(/\/+$/, "")),

  // Bancos de dados
  POSTGRES_URL: z.string().regex(/^postgres(ql)?:\/\//, "deve começar com postgresql://"),
  DATABASE_URL: z.string().regex(/^(mysql|mariadb):\/\//, "deve começar com mysql:// ou mariadb://"),

  // MercadoPago
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().min(1),

  // SMTP
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.email().default("nao-responda@craftsapiens.com.br"),
  SMTP_FROM_NAME: z.string().min(1).default("CraftSapiens"),
  // Respostas aos e-mails automáticos vão para este endereço (ex.: contato@, encaminhado ao Gmail)
  SMTP_REPLY_TO: optionalEmail,
  // Caixa da equipe que recebe as mensagens do formulário de contato
  CONTACT_INBOX: optionalEmail,

  // Login externo (opcional: sem as credenciais, o botão correspondente não aparece)
  AUTH_GOOGLE_ID: z.string().min(1).optional(),
  AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
  AUTH_MICROSOFT_ID: z.string().min(1).optional(),
  AUTH_MICROSOFT_SECRET: z.string().min(1).optional(),

  // Servidor Minecraft
  MINECRAFT_SERVER_HOST: z.string().min(1).default(SERVER_IP),
  // Opcional: sem ela, a porta vem do registro SRV do domínio (_minecraft._tcp)
  MINECRAFT_SERVER_PORT: z.coerce.number().int().positive().optional(),
});

export type Env = z.infer<typeof envSchema>;

// Nomes antigos que ainda aparecem em .env de versões anteriores
const RENAMED: Record<string, string> = {
  NEXTAUTH_URL: "AUTH_URL",
  NEXTAUTH_SECRET: "AUTH_SECRET",
  SMTP_PASSWORD: "SMTP_PASS",
};

let cached: Env | undefined;

export function getEnv(): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((issue) => {
      const name = String(issue.path[0]);
      const oldName = Object.keys(RENAMED).find(
        (old) => RENAMED[old] === name && process.env[old]
      );
      const hint = oldName ? ` (renomeie ${oldName} para ${name})` : "";
      return `  - ${name}: ${issue.message}${hint}`;
    });
    throw new Error(`Variáveis de ambiente inválidas ou ausentes:\n${problems.join("\n")}`);
  }

  cached = parsed.data;
  return cached;
}

/** URL pública do site, sem barra final */
export function siteUrl(): string {
  return getEnv().AUTH_URL;
}
