// Opzioni della valutazione iniziale (ABCDE) condivise tra editor e calcolo del
// triage: coscienza e vie aeree sono anche input del triage (vedi src/lib/triage).

export const COSCIENZA_OPTIONS = [
  "Vigile",
  "Agitato/Disorientato",
  "Reagisce Se Chiamato",
  "Reagisce Al Dolore",
  "Privo Di Conoscenza",
] as const;

export const VIE_AEREE_OPTIONS = ["Libere", "Ostruite"] as const;

// I campi della valutazione ABCDE sono String nel DB: le scelte multiple
// vengono serializzate con questo separatore (assente nelle label) e
// ri-splittate per la UI.
export const MULTI_SEP = " · ";
export const splitMulti = (v: string): string[] => (v ? v.split(MULTI_SEP) : []);
