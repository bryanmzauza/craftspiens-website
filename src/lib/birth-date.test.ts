import { describe, expect, it } from "vitest";
import { ageInYears, isAtLeastMinAge, parseBirthDate } from "@/lib/birth-date";

const now = new Date("2026-10-18T12:00:00.000Z");

describe("parseBirthDate", () => {
  it("aceita datas válidas no formato AAAA-MM-DD", () => {
    expect(parseBirthDate("2010-05-20", now)?.toISOString()).toBe("2010-05-20T00:00:00.000Z");
  });

  it("recusa formatos, datas inexistentes, futuras ou antigas demais", () => {
    expect(parseBirthDate("20/05/2010", now)).toBeNull();
    expect(parseBirthDate("2010-02-30", now)).toBeNull();
    expect(parseBirthDate("2027-01-01", now)).toBeNull();
    expect(parseBirthDate("1899-12-31", now)).toBeNull();
    expect(parseBirthDate(123, now)).toBeNull();
  });
});

describe("idade mínima", () => {
  it("calcula a idade pelo calendário", () => {
    expect(ageInYears(new Date("2013-10-18T00:00:00Z"), now)).toBe(13);
    expect(ageInYears(new Date("2013-10-19T00:00:00Z"), now)).toBe(12);
  });

  it("exige 13 anos completos", () => {
    expect(isAtLeastMinAge(new Date("2013-10-18T00:00:00Z"), now)).toBe(true);
    expect(isAtLeastMinAge(new Date("2013-10-19T00:00:00Z"), now)).toBe(false);
  });
});
