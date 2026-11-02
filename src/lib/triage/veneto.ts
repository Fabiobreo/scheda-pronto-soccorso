// Modello Veneto a 4 codici: parametri, MEWS, valutazione ispettiva, motivo di
// accesso con discriminatori, parte pediatrica (APE / M-PEWS).

export type Avpu = "A" | "V" | "P" | "U";

const PUNTI_AVPU: Record<Avpu, number> = { A: 0, V: 1, P: 2, U: 3 };

// MEWS: ritorna [punteggio, numero di parametri considerati].
// PAS ≥ 200 = 3 punti: lettura letterale della tabella regionale (il MEWS
// standard ne assegna 2).
export function mews(
  avpu: Avpu | null,
  fr: number | null,
  fc: number | null,
  pas: number | null,
  tc: number | null
): [number, number] {
  let s = 0;
  let n = 0;
  if (avpu) {
    n++;
    s += PUNTI_AVPU[avpu];
  }
  if (fr !== null) {
    n++;
    s += fr < 9 ? 2 : fr <= 14 ? 0 : fr <= 20 ? 1 : fr < 30 ? 2 : 3;
  }
  if (fc !== null) {
    n++;
    s += fc < 40 ? 2 : fc <= 50 ? 1 : fc <= 100 ? 0 : fc <= 110 ? 1 : fc < 130 ? 2 : 3;
  }
  if (pas !== null) {
    n++;
    s += pas <= 70 ? 3 : pas <= 80 ? 2 : pas <= 100 ? 1 : pas < 200 ? 0 : 3;
  }
  if (tc !== null) {
    n++;
    s += tc < 35 || tc >= 38.5 ? 2 : 0;
  }
  return [s, n];
}

// Soglie pediatriche Veneto [FC, FR] oltre le quali il codice è GIALLO.
export function soglieVenetoPed(mesi: number): [number, number] {
  if (mesi < 3) return [180, 50];
  if (mesi < 36) return [160, 40];
  if (mesi < 108) return [140, 30];
  return [100, 20];
}
