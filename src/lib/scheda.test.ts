import { describe, it, expect } from "vitest";
import { campiMancantiPerCompletamento } from "./scheda";
import type { SchedaContent } from "./scheda";

// Contenuto vuoto di base (tutti i campi ai default), da personalizzare nei test.
function emptyContent(): SchedaContent {
  return {
    riferimento: "",
    data: "",
    oraArrivo: "",
    nome: "",
    cognome: "",
    dataNascita: "",
    sesso: "",
    telefono: "",
    gruppo: "",
    codiceTriage: "",
    oraInizioTrattamento: "",
    responsabile: "",
    coscienza: "",
    vieAeree: "",
    respiro: "",
    circolo: "",
    addome: "",
    patologie: [],
    esito: "",
    sintomi: {},
    parametri: [],
    anamnesi: "",
    terapiaDomiciliare: "",
    negaTerapiaDomiciliare: false,
    allergie: "",
    negaAllergie: false,
    terapieSomministrate: [],
    diario: [],
    conclusioni: "",
  };
}

describe("campiMancantiPerCompletamento", () => {
  it("su scheda vuota segnala tutti i requisiti", () => {
    const missing = campiMancantiPerCompletamento(emptyContent());
    expect(missing).toContain("Identificativo paziente (cognome o riferimento)");
    expect(missing).toContain("Valutazione iniziale (almeno un campo)");
    expect(missing).toContain("Esito");
  });

  it("accetta il riferimento in alternativa al cognome", () => {
    const c = { ...emptyContent(), riferimento: "RM-001", coscienza: "Vigile", esito: "Dimesso" };
    expect(campiMancantiPerCompletamento(c)).toEqual([]);
  });

  it("basta una sola voce di valutazione", () => {
    const c = { ...emptyContent(), cognome: "Rossi", circolo: "Presente", esito: "Ricovero" };
    expect(campiMancantiPerCompletamento(c)).toEqual([]);
  });

  it("manca l'esito → non completabile", () => {
    const c = { ...emptyContent(), cognome: "Rossi", coscienza: "Vigile" };
    expect(campiMancantiPerCompletamento(c)).toEqual(["Esito"]);
  });

  it("ignora i valori composti solo da spazi", () => {
    const c = { ...emptyContent(), cognome: "   ", riferimento: "  ", coscienza: " ", esito: " " };
    expect(campiMancantiPerCompletamento(c).length).toBe(3);
  });
});
