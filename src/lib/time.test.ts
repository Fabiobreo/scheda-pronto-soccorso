import { describe, expect, it } from "vitest";
import { formatDataIt, nowDate } from "@/lib/time";

describe("formatDataIt", () => {
  it("converte yyyy-MM-dd in dd/MM/yyyy", () => {
    expect(formatDataIt("2026-11-02")).toBe("02/11/2026");
  });

  it("lascia invariati valori vuoti o non conformi", () => {
    expect(formatDataIt("")).toBe("");
    expect(formatDataIt("ieri")).toBe("ieri");
  });
});

describe("nowDate", () => {
  it("ritorna il formato dell'input nativo type=date", () => {
    expect(nowDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
