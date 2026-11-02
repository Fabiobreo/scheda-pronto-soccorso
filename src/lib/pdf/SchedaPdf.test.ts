import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { SchedaPdf } from "@/lib/pdf/SchedaPdf";
import { calcolaTriageScheda, toContent } from "@/lib/scheda";
import { TriageInputSchema } from "@/lib/schemas/triage";
import { MOTIVI_PER_ID } from "@/lib/triage/tabelle";

describe("SchedaPdf", () => {
  it("impagina un triage con tutti i discriminatori (più di una pagina)", async () => {
    const base = {
      triage: TriageInputSchema.parse({
        spo2: "80",
        fr: "35",
        fc: "150",
        pas: "80",
        motivo: "tma",
        discriminatori: MOTIVI_PER_ID.tma!.discriminatori.map((d) => d.id),
      }),
      coscienza: "Reagisce Al Dolore",
      vieAeree: "Ostruite",
      dataNascita: "1940-01-01",
      data: "2026-11-02",
    };
    const stringhe = [
      "riferimento",
      "oraArrivo",
      "nome",
      "cognome",
      "sesso",
      "telefono",
      "gruppo",
      "codiceTriage",
      "oraInizioTrattamento",
      "responsabile",
      "respiro",
      "circolo",
      "addome",
      "esito",
      "anamnesi",
      "terapiaDomiciliare",
      "allergie",
      "conclusioni",
    ];
    const content = toContent({
      ...Object.fromEntries(stringhe.map((k) => [k, ""])),
      ...base,
      negaTerapiaDomiciliare: false,
      negaAllergie: false,
      sintomi: {},
      patologie: [],
      parametri: [],
      terapieSomministrate: [],
      diario: [],
    } as unknown as Parameters<typeof toContent>[0]); // riga minimale di prova
    const risultato = calcolaTriageScheda(base);
    expect(risultato.veneto?.righe.length).toBeGreaterThan(40);

    // SchedaPdf incapsula un <Document>: cast come nella route del PDF.
    const el = createElement(SchedaPdf, {
      content,
      meta: { titolo: "Prova", statoLabel: "Bozza", completata: null },
      triageRisultato: risultato,
    }) as unknown as ReactElement<DocumentProps>;
    const buf = await renderToBuffer(el);
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
  }, 30000);
});
