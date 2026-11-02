import {
  SOGLIE_FC_PED,
  SOGLIE_FR_PED,
  type CodiceLazio,
  type RigaSoglie,
} from "@/lib/triage/tabelle";

// Modello Lazio a 5 codici: ogni parametro restituisce [codice, motivazione];
// il codice finale è il più grave (numero più basso) tra quelli dei parametri.
// Soglie: Tabella 3 del manuale (adulti) e tabelle pediatriche.

export type Livello = [CodiceLazio, string];

export function lvSpo2(v: number): Livello {
  if (v <= 86) return [1, "≤ 86%"];
  if (v <= 90) return [2, "86-90%"];
  if (v <= 95) return [3, ">90-95%"];
  return [5, "> 95%"];
}

export function lvFr(v: number): Livello {
  if (v < 10) return [1, "< 10"];
  if (v > 30) return [2, "> 30"];
  if (v > 21) return [3, "22-30"];
  if (v > 16) return [4, "17-21"];
  if (v >= 12) return [5, "12-16"];
  return [4, "10-11, lievemente ridotta"];
}

export function lvFc(v: number, aritmia: boolean): Livello {
  if (v <= 40 || v >= 160) return [1, "≤ 40 o ≥ 160"];
  if (v <= 50) return [2, ">40-≤50"];
  if (v >= 110) return [2, "≥110-<160"];
  if (v >= 90) return aritmia ? [2, "≥90-<110 + aritmia nuova"] : [3, "≥90-<110"];
  if (v < 60) return [3, ">50-<60"];
  return aritmia ? [3, "60-90 + aritmia nuova"] : [5, "≥60-<90"];
}

// PAS + polsi periferici + indice di shock (FC/PAS): ritorna il più grave.
export function lvPas(v: number | null, polsiAssenti: boolean, fc: number | null): Livello | null {
  const r: Livello[] = [];
  if (polsiAssenti) r.push([1, "Polsi periferici assenti"]);
  if (v !== null) {
    if (v <= 75) r.push([1, `PAS ${v} (≤ 75)`]);
    else if (v <= 90) r.push([2, `PAS ${v} (≤ 90)`]);
    else if (v <= 105) r.push([3, `PAS ${v} (>90-≤105)`]);
    else if (v >= 250) r.push([1, `PAS ${v} (≥ 250)`]);
    else if (v > 200) r.push([2, `PAS ${v} (>200-<250)`]);
    else if (v > 170) r.push([3, `PAS ${v} (> 170)`]);
    else if (v >= 140) r.push([4, `PAS ${v} (≤ 170)`]);
    else r.push([5, `PAS ${v} (< 140)`]);
    if (fc !== null && v > 0 && fc / v >= 1) {
      r.push([2, `Indice di shock ${(fc / v).toFixed(2)} (≥ 1)`]);
    }
  }
  if (r.length === 0) return null;
  return r.reduce((a, b) => (b[0] < a[0] ? b : a));
}

export function lvPad(v: number): Livello {
  if (v >= 130) return [1, "≥ 130"];
  if (v >= 120) return [2, "≥120-<130"];
  if (v >= 100) return [3, "≥100-<120"];
  if (v >= 90) return [4, "< 100"];
  return [5, "< 90"];
}

export function lvGcs(v: number): Livello {
  if (v <= 11) return [1, "≤ 11"];
  if (v <= 13) return [2, "12-13"];
  if (v === 14) return [3, "14"];
  return [5, "15"];
}

// Temperatura < 38 °C = codice 4 solo con "febbre riferita" (scelta interpretativa).
export function lvTc(v: number, febbreRiferita: boolean): Livello {
  if (v < 35) return [1, "< 35"];
  if (v <= 35.5) return [2, "35-35,5"];
  if (v > 39.5) return [2, "> 39,5"];
  if (v >= 38) return [3, "38,0-39,5"];
  return febbreRiferita ? [4, "< 38,0 con febbre riferita"] : [5, "nella norma"];
}

export function lvDolore(v: number): Livello {
  if (v >= 8) return [2, "8-10"];
  if (v >= 4) return [3, "4-7"];
  if (v >= 1) return [4, "1-3"];
  return [5, "non in atto"];
}

// Glicemia 80–300 mg/dl non modifica il codice (scelta interpretativa).
export function lvGlicemia(v: number | null, high: boolean, chetosi: boolean): Livello | null {
  if (high) return [2, "HIGH"];
  if (v === null) return null;
  if (v < 40) return [1, "< 40"];
  if (v <= 60) return [2, "40-60"];
  if (v <= 80) return [3, "60-80"];
  if (v > 300) return chetosi ? [2, ">300 + sintomi di chetosi"] : [3, ">300 senza chetosi"];
  return [5, "> 80"];
}

// --- Pediatrico ---

// FR/FC pediatriche: soglie interpolate linearmente tra le righe della tabella
// per l'età in mesi (sotto la prima riga si usano i valori della prima).
export function lvPediatrico(tabella: readonly RigaSoglie[], v: number, mesi: number): Livello {
  let i = 0;
  while (i < tabella.length - 1 && tabella[i + 1]![0] <= mesi) i++;
  const a = tabella[i]!;
  const b = tabella[Math.min(i + 1, tabella.length - 1)]!;
  const f = mesi <= a[0] || a === b ? 0 : Math.min(1, (mesi - a[0]) / (b[0] - a[0]));
  const x = [1, 2, 3, 4, 5, 6].map((j) => a[j]! + (b[j]! - a[j]!) * f);
  const [x0, x1, x2, x3, x4, x5] = x as [number, number, number, number, number, number];
  const l: CodiceLazio =
    v < x0 ? 1 : v < x1 ? 2 : v < x2 ? 3 : v <= x3 ? 5 : v <= x4 ? 3 : v <= x5 ? 2 : 1;
  const eta = mesi < 24 ? `${mesi} mesi` : `${Math.floor(mesi / 12)} anni`;
  return [l, `(soglie per età ${eta}: ${x.map(Math.round).join("-")})`];
}

export const lvFrPed = (v: number, mesi: number) => lvPediatrico(SOGLIE_FR_PED, v, mesi);
export const lvFcPed = (v: number, mesi: number) => lvPediatrico(SOGLIE_FC_PED, v, mesi);

export function lvTcPed(t: number, mesi: number, immunoOCgCompromesse: boolean): Livello {
  if (t <= 32) return [1, "(≤32 °C)"];
  if (mesi < 1) return [2, "(<1 mese: sempre codice 2)"];
  if (mesi < 3) return [t < 36 || t >= 38 ? 2 : 3, "(1-3 mesi)"];
  if (t <= 35) return [2, "(32-35 °C)"];
  if (t > 38.5) {
    return immunoOCgCompromesse
      ? [2, "(>38,5 con immunodepressione o CG compromesse)"]
      : [3, "(>38,5, CG buone)"];
  }
  if (t < 36) return [mesi < 36 ? 3 : 4, "(<36 °C)"];
  return t <= 37 ? [5, "(36-37 °C)"] : [4, "(≤38,5 °C, CG buone)"];
}

export function lvGlicemiaPed(v: number | null, sintomi: boolean): Livello | null {
  if (v === null) return null;
  if (v < 55) return sintomi ? [2, "(<55 con sintomi)"] : [3, "(<55 senza sintomi)"];
  if (v > 300) return sintomi ? [2, "(>300 con sintomi)"] : [3, "(>300 senza sintomi)"];
  if (v > 100) return [4, "(100-300; con chetonuria/acidosi sale di un livello)"];
  if (v >= 60) return [5, "(60-100)"];
  return [4, "(55-60)"];
}
