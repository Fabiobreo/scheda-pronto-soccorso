import { describe, expect, it } from "vitest";
import {
  RisultatoTriageSchema,
  TriageInputSchema,
  normalizzaTriageInput,
  type TriageInput,
} from "@/lib/schemas/triage";
import { avpuDaCoscienza, calcolaTriage, etaInMesi, type ContestoTriage } from "@/lib/triage";
import { lvFc, lvFr, lvFrPed, lvGlicemia, lvPas, lvSpo2, lvTc } from "@/lib/triage/lazio";
import { mews } from "@/lib/triage/veneto";
import { ISPETTIVI_VENETO, MOTIVI_PER_ID, MOTIVI_VENETO } from "@/lib/triage/tabelle";

const input = (patch: Partial<TriageInput> = {}): TriageInput => ({
  ...TriageInputSchema.parse({}),
  ...patch,
});

const ADULTO: ContestoTriage = {
  coscienza: "",
  vieAeree: "",
  dataNascita: "1980-05-10",
  data: "2026-11-02",
};

describe("soglie Lazio adulti", () => {
  it("SpO2", () => {
    expect(lvSpo2(86)[0]).toBe(1);
    expect(lvSpo2(90)[0]).toBe(2);
    expect(lvSpo2(95)[0]).toBe(3);
    expect(lvSpo2(96)[0]).toBe(5);
  });

  it("FR: 10-11 atti/min = codice 4", () => {
    expect(lvFr(9)[0]).toBe(1);
    expect(lvFr(10)[0]).toBe(4);
    expect(lvFr(12)[0]).toBe(5);
    expect(lvFr(31)[0]).toBe(2);
  });

  it("FC con aritmia di nuova insorgenza", () => {
    expect(lvFc(75, false)[0]).toBe(5);
    expect(lvFc(75, true)[0]).toBe(3);
    expect(lvFc(95, true)[0]).toBe(2);
  });

  it("PAS: polsi assenti e indice di shock", () => {
    expect(lvPas(null, false, 80)).toBeNull();
    expect(lvPas(null, true, null)?.[0]).toBe(1);
    expect(lvPas(120, false, 130)).toEqual([2, "Indice di shock 1.08 (≥ 1)"]);
  });

  it("temperatura < 38 °C è codice 4 solo con febbre riferita", () => {
    expect(lvTc(37.5, false)[0]).toBe(5);
    expect(lvTc(37.5, true)[0]).toBe(4);
  });

  it("glicemia: HIGH e chetosi", () => {
    expect(lvGlicemia(null, true, false)?.[0]).toBe(2);
    expect(lvGlicemia(350, false, true)?.[0]).toBe(2);
    expect(lvGlicemia(350, false, false)?.[0]).toBe(3);
    expect(lvGlicemia(150, false, false)?.[0]).toBe(5);
  });
});

describe("soglie pediatriche", () => {
  it("FR interpolata per età (2 anni)", () => {
    const [livello, dettaglio] = lvFrPed(30, 24);
    expect(livello).toBe(5);
    expect(dettaglio).toContain("2 anni");
  });
});

describe("MEWS", () => {
  it("somma i punti e conta i parametri", () => {
    expect(mews("A", 16, 80, 120, 37)).toEqual([1, 5]);
    expect(mews(null, 32, null, null, null)).toEqual([3, 1]);
    expect(mews("U", null, 140, 65, 39)).toEqual([11, 4]);
  });
});

describe("avpuDaCoscienza", () => {
  it("mappa le voci della valutazione iniziale e sceglie la più grave", () => {
    expect(avpuDaCoscienza("")).toBeNull();
    expect(avpuDaCoscienza("Vigile")).toBe("A");
    expect(avpuDaCoscienza("Vigile · Reagisce Al Dolore")).toBe("P");
    expect(avpuDaCoscienza("Agitato/Disorientato")).toBeNull();
  });
});

describe("etaInMesi", () => {
  it("conta i mesi compiuti", () => {
    expect(etaInMesi("2026-01-15", "2026-11-14")).toBe(9);
    expect(etaInMesi("2026-01-15", "2026-11-15")).toBe(10);
    expect(etaInMesi("", "2026-11-15")).toBeNull();
  });
});

describe("calcolaTriage", () => {
  it("senza dati non produce codici", () => {
    const r = calcolaTriage(input(), { ...ADULTO, dataNascita: "" });
    expect(r.lazio).toBeNull();
    expect(r.veneto).toBeNull();
    expect(r.eta).toBeNull();
  });

  it("adulto stabile: Lazio 5, Veneto da motivo di accesso", () => {
    const r = calcolaTriage(
      input({ spo2: "98", fr: "14", fc: "72", pas: "125", pad: "80", tc: "36,8", motivo: "tmi" }),
      { ...ADULTO, coscienza: "Vigile" }
    );
    expect(r.eta).toBe(46);
    expect(r.pediatrico).toBe(false);
    expect(r.lazio?.codice).toBe(5);
    expect(r.veneto?.codice).toBe("B");
    // MEWS 0-1 compare come riga informativa
    expect(r.veneto?.righe.some((x) => x.voce === "MEWS" && x.livello === null)).toBe(true);
  });

  it("il codice finale è il più grave dei parametri", () => {
    const r = calcolaTriage(input({ spo2: "89", fc: "72", dolore: "5" }), ADULTO);
    expect(r.lazio?.codice).toBe(2);
    expect(r.lazio?.righe.map((x) => x.livello)).toEqual([2, 3, 5]);
  });

  it("vie aeree ostruite (dalla valutazione iniziale) = Lazio 1", () => {
    const r = calcolaTriage(input(), { ...ADULTO, vieAeree: "Ostruite" });
    expect(r.lazio?.codice).toBe(1);
  });

  it("coscienza 'Reagisce Al Dolore' = AVPU P = Veneto ROSSO", () => {
    const r = calcolaTriage(input(), { ...ADULTO, coscienza: "Reagisce Al Dolore" });
    expect(r.avpu).toBe("P");
    expect(r.veneto?.codice).toBe("R");
  });

  it("segno ispettivo Veneto = ROSSO", () => {
    const r = calcolaTriage(input({ ispettivi: [ISPETTIVI_VENETO[1]!.id] }), ADULTO);
    expect(r.veneto?.codice).toBe("R");
  });

  it("discriminatore giallo del motivo di accesso", () => {
    const motivo = MOTIVI_PER_ID.tor!;
    const giallo = motivo.discriminatori.find((d) => d.livello === "G")!;
    const r = calcolaTriage(input({ motivo: "tor", discriminatori: [giallo.id] }), ADULTO);
    expect(r.veneto?.codice).toBe("G");
    expect(r.veneto?.righe[0]?.dettaglio).toBe(giallo.label);
  });

  it("anziano pluripatologico > 75 anni = Lazio 3", () => {
    const r = calcolaTriage(input({ pluripatologico: true }), {
      ...ADULTO,
      dataNascita: "1940-01-01",
    });
    expect(r.lazio?.codice).toBe(3);
  });

  it("pediatrico: tabelle pediatriche, niente PAS, M-PEWS informativo", () => {
    const r = calcolaTriage(input({ fr: "30", pas: "60", tc: "37" }), {
      ...ADULTO,
      dataNascita: "2024-11-02",
    });
    expect(r.pediatrico).toBe(true);
    expect(r.eta).toBe(2);
    expect(r.lazio?.righe.some((x) => x.voce.includes("Pressione"))).toBe(false);
    expect(r.veneto).toBeNull(); // solo M-PEWS informativo, nessun codice
    expect(r.avvisi.some((a) => a.startsWith("Età pediatrica"))).toBe(true);
  });

  it("pediatrico: segni di allarme = Lazio 1, instabilità ABC = Veneto ROSSO", () => {
    const r = calcolaTriage(input({ pedSegniAllarme: true, pedInstabilitaAbc: true }), {
      ...ADULTO,
      dataNascita: "2020-03-01",
    });
    expect(r.lazio?.codice).toBe(1);
    expect(r.veneto?.codice).toBe("R");
  });

  it("valori non validi vengono ignorati e segnalati", () => {
    const r = calcolaTriage(input({ spo2: "150", fc: "abc" }), ADULTO);
    expect(r.lazio).toBeNull();
    expect(r.avvisi).toEqual(["SpO2: valore non valido", "FC: valore non valido"]);
  });

  it("data di nascita successiva alla data della scheda", () => {
    const r = calcolaTriage(input(), { ...ADULTO, dataNascita: "2027-01-01" });
    expect(r.avvisi).toContain("La data di nascita è successiva alla data della scheda");
  });
});

describe("tabelle", () => {
  it("id dei discriminatori univoci all'interno di ogni motivo", () => {
    for (const m of MOTIVI_VENETO) {
      const ids = m.discriminatori.map((d) => d.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe("TriageInputSchema", () => {
  it("applica i default", () => {
    const r = TriageInputSchema.parse({});
    expect(r.spo2).toBe("");
    expect(r.aritmia).toBe(false);
    expect(r.discriminatori).toEqual([]);
  });

  it("rifiuta un motivo sconosciuto", () => {
    expect(TriageInputSchema.safeParse({ motivo: "xyz" }).success).toBe(false);
  });

  it("rifiuta un discriminatore che non appartiene al motivo", () => {
    const altro = MOTIVI_PER_ID.tor!.discriminatori[0]!.id;
    expect(TriageInputSchema.safeParse({ motivo: "tmi", discriminatori: [altro] }).success).toBe(
      false
    );
  });

  it("rifiuta un segno ispettivo sconosciuto", () => {
    expect(TriageInputSchema.safeParse({ ispettivi: ["boh"] }).success).toBe(false);
  });
});

describe("casi avversi", () => {
  it.each(["__proto__", "toString", "valueOf", "hasOwnProperty"])(
    "motivo %s è rifiutato e non manda in crash il calcolo",
    (motivo) => {
      expect(TriageInputSchema.safeParse({ motivo }).success).toBe(false);
      expect(() => calcolaTriage(input({ motivo }), ADULTO)).not.toThrow();
      expect(calcolaTriage(input({ motivo }), ADULTO).veneto).toBeNull();
    }
  );

  it("coscienza con chiavi di Object.prototype non produce AVPU", () => {
    expect(avpuDaCoscienza("toString · __proto__")).toBeNull();
  });

  it.each(["0x5A", "1e2", "9,5,1", "Infinity", "98abc"])("valore %s non valido", (v) => {
    const r = calcolaTriage(input({ spo2: v }), ADULTO);
    expect(r.lazio).toBeNull();
    expect(r.avvisi).toContain("SpO2: valore non valido");
  });

  it("accetta la virgola decimale", () => {
    expect(calcolaTriage(input({ tc: "38,2" }), ADULTO).lazio?.righe[0]?.dettaglio).toContain(
      "TC 38.2"
    );
  });

  it("data di nascita futura: età null, non negativa", () => {
    expect(calcolaTriage(input(), { ...ADULTO, dataNascita: "2027-06-01" }).eta).toBeNull();
  });
});

describe("normalizzaTriageInput (lettura dal DB)", () => {
  it("scarta solo le voci non più valide, senza perdere il resto", () => {
    const valido = MOTIVI_PER_ID.tor!.discriminatori[0]!.id;
    const t = normalizzaTriageInput({
      spo2: "88",
      motivo: "tor",
      discriminatori: [valido, "voce_rimossa"],
      ispettivi: ["voce_rimossa"],
    });
    expect(t.spo2).toBe("88");
    expect(t.motivo).toBe("tor");
    expect(t.discriminatori).toEqual([valido]);
    expect(t.ispettivi).toEqual([]);
  });

  it("motivo non più valido: azzera motivo e discriminatori", () => {
    const t = normalizzaTriageInput({ spo2: "88", motivo: "zzz", discriminatori: ["a"] });
    expect(t).toMatchObject({ spo2: "88", motivo: "", discriminatori: [] });
  });

  it("valore non oggetto: default", () => {
    expect(normalizzaTriageInput(null)).toEqual(TriageInputSchema.parse({}));
  });
});

describe("RisultatoTriageSchema", () => {
  it("accetta il risultato del calcolo", () => {
    const r = calcolaTriage(input({ spo2: "88", motivo: "tmi" }), ADULTO);
    expect(RisultatoTriageSchema.safeParse(r).success).toBe(true);
  });

  it("rifiuta un codice sconosciuto", () => {
    const r = calcolaTriage(input({ spo2: "88" }), ADULTO);
    const corrotto = { ...r, lazio: { ...r.lazio, codice: 9 } };
    expect(RisultatoTriageSchema.safeParse(corrotto).success).toBe(false);
  });
});
