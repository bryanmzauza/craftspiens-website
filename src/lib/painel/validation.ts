// =============================================================================
// Painel: validação do que chega nas rotas /api/painel
// =============================================================================
import { z } from "zod";
import { NextResponse } from "next/server";

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
export const COUPON_CODE = /^[A-Z0-9_-]{3,30}$/;

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.trim() || null : v),
    z.string().max(max, `máximo de ${max} caracteres`).nullable().optional()
  );

const money = z.coerce
  .number({ message: "valor inválido" })
  .refine((v) => Number.isFinite(v), "valor inválido")
  .transform((v) => Math.round(v * 100) / 100);

export const productSchema = z
  .object({
    name: z.string().trim().min(2, "nome muito curto").max(255),
    slug: z.string().trim().toLowerCase().max(100).regex(SLUG_PATTERN, "use letras minúsculas, números e hífens"),
    description: z.string().trim().min(1, "descreva o produto").max(5000),
    shortDescription: optionalText(255),
    price: money.refine((v) => v >= 1 && v <= 100000, "o preço deve ficar entre R$ 1,00 e R$ 100.000,00"),
    originalPrice: money.nullable().optional(),
    category: z.enum(["VIP", "RANK", "COSMETICO", "MOEDA", "KIT"]),
    imageUrl: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() || null : v),
      z.url({ protocol: /^https$/, message: "use um endereço https" }).max(500).nullable().optional()
    ),
    durationDays: z.coerce.number().int().min(1).max(3650).nullable().optional(),
    benefits: z
      .array(z.object({ label: z.string().trim().min(1).max(120), included: z.boolean() }))
      .max(30)
      .default([]),
    stock: z.coerce.number().int().min(-1).max(1_000_000).default(-1),
    featured: z.boolean().default(false),
    badge: optionalText(50),
    color: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() || null : v),
      z.string().regex(HEX_COLOR, "cor no formato #RRGGBB").nullable().optional()
    ),
    order: z.coerce.number().int().min(0).max(100000).optional(),
    active: z.boolean().default(true),
  })
  .refine((p) => p.originalPrice == null || p.originalPrice > p.price, {
    message: "o preço antigo precisa ser maior que o preço atual",
    path: ["originalPrice"],
  });

export type ProductInput = z.infer<typeof productSchema>;

export const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(COUPON_CODE, "use de 3 a 30 letras, números, hífen ou sublinhado"),
  discount: z.coerce.number().refine((v) => v > 0 && v <= 100, "o desconto deve ficar entre 1% e 100%"),
  maxUses: z.coerce.number().int().min(1).max(1_000_000).nullable().optional(),
  expiresAt: z.preprocess(
    (v) => (v === "" ? null : v),
    z.coerce.date({ message: "data inválida" }).nullable().optional()
  ),
  active: z.boolean().default(true),
});

export const classSchema = z
  .object({
    title: z.string().trim().min(2, "informe a disciplina ou o nome da aula").max(120),
    topic: optionalText(200),
    description: optionalText(2000),
    teacher: z.string().trim().min(2, "informe o professor").max(100),
    level: optionalText(50),
    color: z.string().regex(HEX_COLOR, "cor no formato #RRGGBB"),
    location: optionalText(100),
    disciplineId: z.string().max(40).nullable().optional(),
    startsAt: z.coerce.date({ message: "início inválido" }),
    endsAt: z.coerce.date({ message: "fim inválido" }),
    cancelled: z.boolean().default(false),
    cancelReason: optionalText(200),
  })
  .refine((c) => c.endsAt.getTime() > c.startsAt.getTime(), { message: "o fim deve ser depois do início", path: ["endsAt"] })
  .refine((c) => c.endsAt.getTime() - c.startsAt.getTime() <= 12 * 60 * 60 * 1000, {
    message: "a aula pode durar no máximo 12 horas",
    path: ["endsAt"],
  });

export type ClassInput = z.infer<typeof classSchema>;

/** Lê o corpo JSON e valida; em erro, devolve a resposta 400 com a primeira mensagem */
export async function parseBody<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<{ data: z.infer<T> } | { error: NextResponse }> {
  const body = await request.json().catch(() => null);
  if (body === null || typeof body !== "object") {
    return { error: NextResponse.json({ error: "Requisição inválida." }, { status: 400 }) };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue.path.length > 0 ? `${String(issue.path[0])}: ` : "";
    return {
      error: NextResponse.json({ error: `${field}${issue.message}`, field: issue.path[0] ?? null }, { status: 400 }),
    };
  }
  return { data: parsed.data };
}
