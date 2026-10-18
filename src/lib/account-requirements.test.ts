import { describe, expect, it } from "vitest";
import { canBuy, canUseForum, pendingRequirements } from "@/lib/account-requirements";
import { hasAcceptedCurrentTerms, TERMS_VERSION } from "@/lib/terms";

const complete = { emailConfirmado: true, nickVinculado: true, idadeRegistrada: true, cpfRegistrado: true };

describe("exigências da conta", () => {
  it("lista o que falta na ordem de resolução", () => {
    expect(pendingRequirements(complete)).toEqual([]);
    expect(pendingRequirements({ ...complete, cpfRegistrado: false, emailConfirmado: false })).toEqual([
      "emailConfirmado",
      "cpfRegistrado",
    ]);
  });

  it("fórum dispensa o CPF; compra não", () => {
    expect(canUseForum({ ...complete, cpfRegistrado: false })).toBe(true);
    expect(canBuy({ ...complete, cpfRegistrado: false })).toBe(false);
    expect(canUseForum({ ...complete, idadeRegistrada: false })).toBe(false);
  });

  it("só a versão vigente dos termos vale", () => {
    expect(hasAcceptedCurrentTerms(TERMS_VERSION)).toBe(true);
    expect(hasAcceptedCurrentTerms("2020-01-01")).toBe(false);
    expect(hasAcceptedCurrentTerms(null)).toBe(false);
  });
});
