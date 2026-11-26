import { describe, expect, it } from "vitest";
import { couponAppliesTo, couponProductsLabel } from "@/lib/coupons";

describe("couponAppliesTo", () => {
  it("lista vazia vale para qualquer produto", () => {
    expect(couponAppliesTo([], "p1")).toBe(true);
  });

  it("com lista, vale só para os produtos listados", () => {
    expect(couponAppliesTo(["p1", "p2"], "p2")).toBe(true);
    expect(couponAppliesTo(["p1"], "p2")).toBe(false);
  });
});

describe("couponProductsLabel", () => {
  const names = new Map([
    ["a", "VIP"],
    ["b", "Premium"],
    ["c", "1M Sapiens"],
    ["d", "Rastro"],
  ]);

  it("descreve a restrição em português", () => {
    expect(couponProductsLabel([], names)).toBe("todos os produtos");
    expect(couponProductsLabel(["a"], names)).toBe("VIP");
    expect(couponProductsLabel(["a", "b"], names)).toBe("VIP e Premium");
    expect(couponProductsLabel(["a", "b", "c"], names)).toBe("VIP, Premium e 1M Sapiens");
    expect(couponProductsLabel(["a", "b", "c", "d"], names)).toBe("VIP, Premium e mais 2");
  });

  it("ignora IDs de produtos excluídos", () => {
    expect(couponProductsLabel(["a", "x"], names)).toBe("VIP");
    expect(couponProductsLabel(["x"], names)).toBe("nenhum produto disponível");
  });
});
