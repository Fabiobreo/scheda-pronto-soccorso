import { describe, it, expect } from "vitest";
import { UserCreateSchema, UserUpdateSchema } from "./user";

describe("UserCreateSchema", () => {
  it("normalizza email (trim + lowercase) e applica i default", () => {
    const parsed = UserCreateSchema.parse({
      email: "  Mario.Rossi@Example.COM ",
      password: "supersegreta",
    });
    expect(parsed.email).toBe("mario.rossi@example.com");
    expect(parsed.name).toBe("");
    expect(parsed.role).toBe("NURSE");
  });

  it("rifiuta password troppo corte", () => {
    const res = UserCreateSchema.safeParse({ email: "a@b.com", password: "short" });
    expect(res.success).toBe(false);
  });

  it("rifiuta email non valide", () => {
    const res = UserCreateSchema.safeParse({ email: "non-una-email", password: "abcdefgh" });
    expect(res.success).toBe(false);
  });

  it("rifiuta ruoli sconosciuti", () => {
    const res = UserCreateSchema.safeParse({
      email: "a@b.com",
      password: "abcdefgh",
      role: "ROOT",
    });
    expect(res.success).toBe(false);
  });
});

describe("UserUpdateSchema", () => {
  it("accetta un aggiornamento parziale", () => {
    const parsed = UserUpdateSchema.parse({ role: "SUPERVISOR" });
    expect(parsed.role).toBe("SUPERVISOR");
  });

  it("rifiuta un body vuoto", () => {
    const res = UserUpdateSchema.safeParse({});
    expect(res.success).toBe(false);
  });
});
