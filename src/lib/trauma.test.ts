import { describe, expect, it } from "vitest";
import {
  calcolaGcs,
  calcolaRts,
  formatGcs,
  interpretaGcs,
  interpretaRts,
  normalizzaParametro,
  parsePas,
  puntiRtsFr,
  puntiRtsGcs,
  puntiRtsPas,
} from "@/lib/trauma";
import { ParametroVitaleSchema } from "@/lib/schemas/scheda";

describe("GCS", () => {
  it("somma le tre componenti", () => {
    expect(calcolaGcs({ gcsE: "4", gcsV: "5", gcsM: "6" })).toBe(15);
    expect(calcolaGcs({ gcsE: "1", gcsV: "1", gcsM: "1" })).toBe(3);
  });

  it("null se manca una componente o il valore è fuori scala", () => {
    expect(calcolaGcs({ gcsE: "4", gcsV: "", gcsM: "6" })).toBeNull();
    expect(calcolaGcs({ gcsE: "5", gcsV: "5", gcsM: "6" })).toBeNull();
    expect(calcolaGcs({ gcsE: "4", gcsV: "6", gcsM: "6" })).toBeNull();
  });

  it("interpreta la gravità", () => {
    expect(interpretaGcs(8)).toBe("Grave");
    expect(interpretaGcs(9)).toBe("Moderata");
    expect(interpretaGcs(13)).toBe("Moderata");
    expect(interpretaGcs(14)).toBe("Minore");
  });

  it("formatta con le componenti", () => {
    expect(formatGcs({ gcs: "13", gcsE: "3", gcsV: "4", gcsM: "6" })).toBe("13 (E3 V4 M6)");
    expect(formatGcs({ gcs: "13", gcsE: "", gcsV: "", gcsM: "" })).toBe("13");
  });
});

describe("RTS – punteggi codificati", () => {
  it("GCS", () => {
    expect([15, 13, 12, 9, 8, 6, 5, 4, 3].map(puntiRtsGcs)).toEqual([4, 4, 3, 3, 2, 2, 1, 1, 0]);
  });
  it("PAS", () => {
    expect([120, 90, 89, 76, 75, 50, 49, 1, 0].map(puntiRtsPas)).toEqual([
      4, 4, 3, 3, 2, 2, 1, 1, 0,
    ]);
  });
  it("FR", () => {
    expect([10, 29, 30, 9, 6, 5, 1, 0].map(puntiRtsFr)).toEqual([4, 4, 3, 2, 2, 1, 1, 0]);
  });
});

describe("calcolaRts", () => {
  it("legge la sistolica da PA scritta come 120/80", () => {
    expect(parsePas("120/80")).toBe(120);
    expect(parsePas(" 85 / 50 ")).toBe(85);
    expect(parsePas("85")).toBe(85);
    expect(parsePas("n.r.")).toBeNull();
  });

  it("calcola il totale 0-12", () => {
    expect(calcolaRts({ gcs: "15", pa: "120/80", fr: "16" })).toBe(12);
    expect(calcolaRts({ gcs: "10", pa: "80/50", fr: "32" })).toBe(9);
    expect(calcolaRts({ gcs: "3", pa: "0", fr: "0" })).toBe(0);
  });

  it("null se manca un parametro", () => {
    expect(calcolaRts({ gcs: "", pa: "120/80", fr: "16" })).toBeNull();
    expect(calcolaRts({ gcs: "15", pa: "", fr: "16" })).toBeNull();
    expect(calcolaRts({ gcs: "16", pa: "120", fr: "16" })).toBeNull();
  });

  it("interpreta il punteggio", () => {
    expect(interpretaRts(12)).toBe("Differibile");
    expect(interpretaRts(11)).toBe("Urgente");
    expect(interpretaRts(10)).toBe("Immediato");
    expect(interpretaRts(3)).toBe("Immediato");
    expect(interpretaRts(2)).toBe("Deceduto");
  });
});

describe("normalizzaParametro / ParametroVitaleSchema", () => {
  const base = ParametroVitaleSchema.parse({});

  it("GCS e RTS ricalcolati dal parse (il client non può forzarli)", () => {
    const r = ParametroVitaleSchema.parse({
      gcs: "15",
      gcsE: "3",
      gcsV: "4",
      gcsM: "5",
      pa: "120/70",
      fr: "18",
      rts: "1",
    });
    expect(r.gcs).toBe("12");
    expect(r.rts).toBe("11");
  });

  it("mantiene l'RTS salvato se non calcolabile (righe storiche)", () => {
    expect(normalizzaParametro({ ...base, rts: "10" }).rts).toBe("10");
  });

  it("restituisce la stessa riga se non cambia nulla", () => {
    expect(normalizzaParametro(base)).toBe(base);
  });
});
