import { describe, expect, it } from "vitest";
import {
  ParametroVitaleSchema,
  SchedaCreateSchema,
  SchedaUpdateSchema,
  SintomiSchema,
} from "@/lib/schemas/scheda";

describe("SintomiSchema", () => {
  it("accetta categorie e codici validi", () => {
    const res = SintomiSchema.safeParse({
      cardiorespiratorio: { codici: ["dispnea", "cianosi"], note: "note libere" },
      altro: { codici: [], note: "qualcosa" },
    });
    expect(res.success).toBe(true);
  });

  it("rifiuta una categoria sconosciuta", () => {
    const res = SintomiSchema.safeParse({
      inesistente: { codici: [], note: "" },
    });
    expect(res.success).toBe(false);
  });

  it("rifiuta un codice non appartenente alla categoria", () => {
    const res = SintomiSchema.safeParse({
      cardiorespiratorio: { codici: ["vomito"], note: "" },
    });
    expect(res.success).toBe(false);
  });

  it("applica i default a codici/note mancanti", () => {
    const res = SintomiSchema.parse({ neurologica: {} });
    expect(res.neurologica).toEqual({ codici: [], note: "" });
  });
});

describe("ParametroVitaleSchema", () => {
  it("riempie con stringa vuota i campi mancanti", () => {
    const res = ParametroVitaleSchema.parse({ ora: "08:30", pa: "120/80" });
    expect(res.ora).toBe("08:30");
    expect(res.pa).toBe("120/80");
    expect(res.spo2).toBe("");
    expect(res.gcs).toBe("");
  });
});

describe("SchedaCreateSchema", () => {
  it("accetta un body vuoto (bozza vuota)", () => {
    expect(SchedaCreateSchema.safeParse({}).success).toBe(true);
  });

  it("accetta contenuto parziale valido", () => {
    const res = SchedaCreateSchema.safeParse({
      riferimento: "MR-001",
      anamnesi: "paziente cosciente",
    });
    expect(res.success).toBe(true);
  });
});

describe("SchedaUpdateSchema", () => {
  it("rifiuta un body completamente vuoto", () => {
    expect(SchedaUpdateSchema.safeParse({}).success).toBe(false);
  });

  it("accetta un autosave parziale di un singolo campo", () => {
    expect(SchedaUpdateSchema.safeParse({ conclusioni: "dimesso" }).success).toBe(true);
  });

  it("accetta il passaggio di stato a COMPLETED", () => {
    expect(SchedaUpdateSchema.safeParse({ status: "COMPLETED" }).success).toBe(true);
  });

  it("rifiuta uno status non valido", () => {
    expect(SchedaUpdateSchema.safeParse({ status: "ARCHIVED" }).success).toBe(false);
  });
});
