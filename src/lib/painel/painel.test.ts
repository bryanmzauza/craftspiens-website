import { afterEach, describe, expect, it, vi } from "vitest";

// Ambiente de teste: só o que o painel lê. Os valores são fictícios.
const env = {
  AUTH_SECRET: "segredo-de-teste-com-mais-de-32-caracteres",
  AUTH_URL: "https://exemplo.test",
  PAINEL_CODIGO: "codigo-de-teste-123" as string | undefined,
};
vi.mock("@/lib/env", () => ({ getEnv: () => env }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

const { checkPanelCode, createPanelToken, normalizePanelName, readPanelToken } = await import("@/lib/painel/session");
const { couponState } = await import("@/lib/painel/store");
const { buildIcs } = await import("@/lib/ics");

afterEach(() => {
  env.PAINEL_CODIGO = "codigo-de-teste-123";
  vi.useRealTimers();
});

describe("código do painel", () => {
  it("aceita só o código exato", () => {
    expect(checkPanelCode("codigo-de-teste-123")).toBe(true);
    expect(checkPanelCode("codigo-de-teste-12")).toBe(false);
    expect(checkPanelCode("")).toBe(false);
  });

  it("fica desligado sem PAINEL_CODIGO", () => {
    env.PAINEL_CODIGO = undefined;
    expect(checkPanelCode("qualquer")).toBe(false);
    expect(() => createPanelToken("Bryan")).toThrow();
  });
});

describe("sessão do painel", () => {
  it("lê o próprio token", () => {
    const { token } = createPanelToken("Helton");
    expect(readPanelToken(token)?.name).toBe("Helton");
  });

  it("recusa token alterado", () => {
    const { token } = createPanelToken("Helton");
    const [payload, signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ n: "Outro", e: Date.now() + 1e9 })).toString("base64url");
    expect(readPanelToken(`${forged}.${signature}`)).toBeNull();
    expect(readPanelToken(`${payload}.${signature.slice(0, -2)}xx`)).toBeNull();
    expect(readPanelToken("lixo")).toBeNull();
  });

  it("encerra as sessões quando o código muda", () => {
    const { token } = createPanelToken("Helton");
    env.PAINEL_CODIGO = "outro-codigo-de-teste";
    expect(readPanelToken(token)).toBeNull();
  });

  it("expira depois de 12 horas", () => {
    vi.useFakeTimers();
    const { token } = createPanelToken("Helton");
    vi.advanceTimersByTime(12 * 60 * 60 * 1000 + 1000);
    expect(readPanelToken(token)).toBeNull();
  });
});

describe("normalizePanelName", () => {
  it("aceita nomes comuns e limpa os espaços", () => {
    expect(normalizePanelName("  Bryan  ")).toBe("Bryan");
    expect(normalizePanelName("Prof.  Helton")).toBe("Prof. Helton");
    expect(normalizePanelName("João_2")).toBe("João_2");
  });

  it("recusa vazio, curto, longo ou com símbolos", () => {
    expect(normalizePanelName("")).toBeNull();
    expect(normalizePanelName("A")).toBeNull();
    expect(normalizePanelName("x".repeat(31))).toBeNull();
    expect(normalizePanelName("<script>")).toBeNull();
    expect(normalizePanelName(42)).toBeNull();
  });
});

describe("couponState", () => {
  const now = new Date("2026-10-19T12:00:00Z").getTime();
  const base = { active: true, expiresAt: null as Date | null, maxUses: null as number | null, uses: 0 };

  it("ativo, desligado, vencido e esgotado", () => {
    expect(couponState(base, now)).toBe("ativo");
    expect(couponState({ ...base, active: false }, now)).toBe("desligado");
    expect(couponState({ ...base, expiresAt: new Date("2026-10-18T00:00:00Z") }, now)).toBe("vencido");
    expect(couponState({ ...base, maxUses: 5, uses: 5 }, now)).toBe("esgotado");
    expect(couponState({ ...base, maxUses: 5, uses: 4 }, now)).toBe("ativo");
  });
});

describe("buildIcs", () => {
  it("gera um evento com lembrete e escapa o texto", () => {
    const ics = buildIcs([
      {
        id: "abc",
        title: "Matemática: frações, parte 1; revisão",
        startsAt: "2026-10-20T17:00:00.000Z",
        endsAt: "2026-10-20T18:30:00.000Z",
      },
    ]);
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTART:20261020T170000Z");
    expect(ics).toContain("DTEND:20261020T183000Z");
    expect(ics).toContain("SUMMARY:Matemática: frações\\, parte 1\\; revisão");
    expect(ics).toContain("TRIGGER:-PT15M");
    expect(ics.split("\r\n").every((line) => line.length <= 75)).toBe(true);
  });

  it("marca aulas canceladas", () => {
    const ics = buildIcs([{ id: "x", title: "Física", startsAt: new Date(), endsAt: new Date(), cancelled: true }]);
    expect(ics).toContain("STATUS:CANCELLED");
  });
});
