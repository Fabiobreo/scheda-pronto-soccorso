// Glasgow Coma Scale e Revised Trauma Score (versione "triage", T-RTS: somma dei
// punteggi codificati 0-4 di GCS, PAS e FR → 0-12). Funzioni pure, condivise da
// editor, validazione Zod (ricalcolo lato server), vista e PDF.

export interface VoceGcs {
  punti: number;
  label: string;
}

export interface ComponenteGcs {
  campo: "gcsE" | "gcsV" | "gcsM";
  label: string;
  sigla: string;
  voci: readonly VoceGcs[];
}

export const GCS_COMPONENTI: readonly ComponenteGcs[] = [
  {
    campo: "gcsE",
    label: "Apertura degli occhi",
    sigla: "E",
    voci: [
      { punti: 4, label: "Spontaneamente" },
      { punti: 3, label: "Alla parola" },
      { punti: 2, label: "Al dolore" },
      { punti: 1, label: "Non apre gli occhi" },
    ],
  },
  {
    campo: "gcsV",
    label: "Risposta verbale",
    sigla: "V",
    voci: [
      { punti: 5, label: "Orientata" },
      { punti: 4, label: "Confusa" },
      { punti: 3, label: "Parole non appropriate" },
      { punti: 2, label: "Suoni incomprensibili" },
      { punti: 1, label: "Nessuna" },
    ],
  },
  {
    campo: "gcsM",
    label: "Risposta motoria",
    sigla: "M",
    voci: [
      { punti: 6, label: "Obbedisce ai comandi" },
      { punti: 5, label: "Localizza il dolore" },
      { punti: 4, label: "Si retrae (flessione normale)" },
      { punti: 3, label: "Flessione anormale (decorticazione)" },
      { punti: 2, label: "Estensione (decerebrazione)" },
      { punti: 1, label: "Nessuna" },
    ],
  },
] as const;

function puntoValido(componente: ComponenteGcs, value: string): number | null {
  const n = Number(value);
  return componente.voci.some((v) => v.punti === n) && value.trim() !== "" ? n : null;
}

// Totale GCS dalle tre componenti (stringhe "1".."6"); null se ne manca una.
export function calcolaGcs(c: { gcsE: string; gcsV: string; gcsM: string }): number | null {
  let tot = 0;
  for (const comp of GCS_COMPONENTI) {
    const p = puntoValido(comp, c[comp.campo]);
    if (p === null) return null;
    tot += p;
  }
  return tot;
}

export function interpretaGcs(gcs: number): string {
  if (gcs <= 8) return "Grave";
  if (gcs <= 13) return "Moderata";
  return "Minore";
}

// --- Parsing dei campi testuali della tabella parametri ---

function intero(value: string): number | null {
  const m = /^\s*(\d{1,3})\s*$/.exec(value);
  return m ? Number(m[1]) : null;
}

export function parseGcs(value: string): number | null {
  const n = intero(value);
  return n !== null && n >= 3 && n <= 15 ? n : null;
}

// PA scritta come "120/80" (o solo "120"): restituisce la sistolica.
export function parsePas(value: string): number | null {
  const m = /^\s*(\d{1,3})\s*(?:\/\s*\d{1,3}\s*)?$/.exec(value);
  return m ? Number(m[1]) : null;
}

export function parseFr(value: string): number | null {
  return intero(value);
}

// --- Punteggi codificati RTS ---

export function puntiRtsGcs(gcs: number): number {
  if (gcs >= 13) return 4;
  if (gcs >= 9) return 3;
  if (gcs >= 6) return 2;
  if (gcs >= 4) return 1;
  return 0;
}

export function puntiRtsPas(pas: number): number {
  if (pas > 89) return 4;
  if (pas >= 76) return 3;
  if (pas >= 50) return 2;
  if (pas >= 1) return 1;
  return 0;
}

export function puntiRtsFr(fr: number): number {
  if (fr >= 10 && fr <= 29) return 4;
  if (fr > 29) return 3;
  if (fr >= 6) return 2;
  if (fr >= 1) return 1;
  return 0;
}

// RTS (0-12) dai campi della riga; null se GCS, PA o FR non sono utilizzabili.
export function calcolaRts(r: { gcs: string; pa: string; fr: string }): number | null {
  const gcs = parseGcs(r.gcs);
  const pas = parsePas(r.pa);
  const fr = parseFr(r.fr);
  if (gcs === null || pas === null || fr === null) return null;
  return puntiRtsGcs(gcs) + puntiRtsPas(pas) + puntiRtsFr(fr);
}

export function interpretaRts(rts: number): string {
  if (rts >= 12) return "Differibile";
  if (rts === 11) return "Urgente";
  if (rts >= 3) return "Immediato";
  return "Deceduto";
}

// Allinea i campi derivati di una riga parametri: GCS = E+V+M quando le tre
// componenti sono presenti, RTS ricalcolato quando GCS/PA/FR lo permettono.
// Se l'RTS non è calcolabile resta il valore salvato (righe storiche).
export function normalizzaParametro<
  T extends {
    gcs: string;
    gcsE: string;
    gcsV: string;
    gcsM: string;
    pa: string;
    fr: string;
    rts: string;
  },
>(row: T): T {
  const gcsTot = calcolaGcs(row);
  const gcs = gcsTot !== null ? String(gcsTot) : row.gcs;
  const rtsTot = calcolaRts({ gcs, pa: row.pa, fr: row.fr });
  const rts = rtsTot !== null ? String(rtsTot) : row.rts;
  return gcs === row.gcs && rts === row.rts ? row : { ...row, gcs, rts };
}

// Testo della cella GCS in vista/stampa: "13 (E4 V4 M5)" se ci sono le componenti.
export function formatGcs(r: { gcs: string; gcsE: string; gcsV: string; gcsM: string }): string {
  if (!r.gcs) return "";
  return r.gcsE && r.gcsV && r.gcsM ? `${r.gcs} (E${r.gcsE} V${r.gcsV} M${r.gcsM})` : r.gcs;
}
