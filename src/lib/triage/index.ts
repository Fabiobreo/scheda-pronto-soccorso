import type { TriageInput } from "@/lib/schemas/triage";
import { nowDate } from "@/lib/time";
import { splitMulti } from "@/lib/valutazione";
import {
  ISPETTIVI_VENETO,
  MOTIVI_PER_ID,
  ORDINE_VENETO,
  type CodiceLazio,
  type CodiceVeneto,
} from "@/lib/triage/tabelle";
import {
  lvDolore,
  lvFc,
  lvFcPed,
  lvFr,
  lvFrPed,
  lvGcs,
  lvGlicemia,
  lvGlicemiaPed,
  lvPad,
  lvPas,
  lvSpo2,
  lvTc,
  lvTcPed,
  type Livello,
} from "@/lib/triage/lazio";
import { mews, soglieVenetoPed, type Avpu } from "@/lib/triage/veneto";

// Calcolo del codice di triage (modelli Lazio e Veneto, adulti e pediatrico).
// Funzione pura, usata sia dal client (anteprima live) sia dal server (che
// ricalcola il risultato prima di salvarlo: il client non è fonte di verità).

export interface RigaLazio {
  livello: CodiceLazio;
  voce: string;
  dettaglio: string;
}

export interface RigaVeneto {
  livello: CodiceVeneto | null; // null = riga informativa (non modifica il codice)
  voce: string;
  dettaglio: string;
}

export interface RisultatoTriage {
  eta: number | null; // anni
  pediatrico: boolean; // età < 18 anni
  avpu: Avpu | null;
  lazio: { codice: CodiceLazio; righe: RigaLazio[] } | null;
  veneto: { codice: CodiceVeneto; righe: RigaVeneto[] } | null;
  avvisi: string[];
}

// Campi della scheda (già presenti) usati dal calcolo.
export interface ContestoTriage {
  coscienza: string;
  vieAeree: string;
  dataNascita: string;
  data: string; // data della scheda; se vuota si usa la data odierna
}

// Coscienza della valutazione iniziale → AVPU (la voce più grave tra le scelte).
// "Agitato/Disorientato" non ha un corrispondente AVPU e non incide sul codice.
const AVPU_PER_COSCIENZA: Record<string, Avpu> = Object.assign(Object.create(null), {
  Vigile: "A",
  "Reagisce Se Chiamato": "V",
  "Reagisce Al Dolore": "P",
  "Privo Di Conoscenza": "U",
});
const GRAVITA_AVPU: Avpu[] = ["U", "P", "V", "A"];

export function avpuDaCoscienza(coscienza: string): Avpu | null {
  const scelte = new Set(splitMulti(coscienza).map((c) => AVPU_PER_COSCIENZA[c]));
  return GRAVITA_AVPU.find((a) => scelte.has(a)) ?? null;
}

// --- Età ---

function parseData(s: string): [number, number, number] | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

// Età in mesi compiuti alla data di riferimento (null se la nascita manca).
export function etaInMesi(dataNascita: string, riferimento: string): number | null {
  const n = parseData(dataNascita);
  const r = parseData(riferimento);
  if (!n || !r) return null;
  let m = (r[0] - n[0]) * 12 + r[1] - n[1];
  if (r[2] < n[2]) m--;
  return m;
}

// --- Parsing dei valori numerici (stringhe della scheda) ---

interface Limite {
  campo: "spo2" | "fr" | "fc" | "pas" | "pad" | "tc" | "glicemia" | "gcs" | "dolore";
  label: string;
  min: number;
  max: number;
}

const LIMITI: Limite[] = [
  { campo: "spo2", label: "SpO2", min: 0, max: 100 },
  { campo: "fr", label: "FR", min: 0, max: 100 },
  { campo: "fc", label: "FC", min: 0, max: 300 },
  { campo: "pas", label: "PAS", min: 0, max: 400 },
  { campo: "pad", label: "PAD", min: 0, max: 300 },
  { campo: "tc", label: "Temperatura", min: 25, max: 45 },
  { campo: "glicemia", label: "Glicemia", min: 0, max: 1500 },
  { campo: "gcs", label: "GCS", min: 3, max: 15 },
  { campo: "dolore", label: "Dolore", min: 0, max: 10 },
];

type Valori = Record<Limite["campo"], number | null>;

const NUMERO = /^-?\d+(\.\d+)?$/;

function parseValori(input: TriageInput, avvisi: string[]): Valori {
  const out = {} as Valori;
  for (const { campo, label, min, max } of LIMITI) {
    const s = input[campo].trim().replace(",", ".");
    // Solo decimali semplici (Number() accetterebbe anche "0x5A" o "1e2").
    const x = s === "" ? null : NUMERO.test(s) ? Number(s) : NaN;
    if (x !== null && (Number.isNaN(x) || x < min || x > max)) {
      avvisi.push(`${label}: valore non valido`);
      out[campo] = null;
    } else {
      out[campo] = x;
    }
  }
  return out;
}

// --- Calcolo ---

export function calcolaTriage(
  input: TriageInput,
  ctx: ContestoTriage,
  oggi: string = nowDate()
): RisultatoTriage {
  const avvisi: string[] = [];
  const v = parseValori(input, avvisi);
  const riferimento = ctx.data || oggi;
  const mesi = etaInMesi(ctx.dataNascita, riferimento);
  const eta = mesi === null || mesi < 0 ? null : Math.floor(mesi / 12);
  const pediatrico = mesi !== null && mesi >= 0 && mesi < 216;
  const avpu = avpuDaCoscienza(ctx.coscienza);

  if (mesi !== null && mesi < 0) {
    avvisi.push("La data di nascita è successiva alla data della scheda");
  }
  if (pediatrico) {
    avvisi.push(
      "Età pediatrica: FR, FC, TC e glicemia da tabelle pediatriche; PAS/PAD e valutazione ABCD pediatrica non incluse"
    );
  }

  return {
    eta,
    pediatrico,
    avpu,
    lazio: calcolaLazio(input, v, ctx, pediatrico ? mesi! : null, eta),
    veneto: calcolaVeneto(input, v, avpu, pediatrico ? mesi! : null),
    avvisi,
  };
}

function calcolaLazio(
  input: TriageInput,
  v: Valori,
  ctx: ContestoTriage,
  mesiPed: number | null,
  eta: number | null
): RisultatoTriage["lazio"] {
  const ped = mesiPed !== null;
  const righe: RigaLazio[] = [];
  const add = (voce: string, r: Livello | null, valore = "") => {
    if (r) righe.push({ livello: r[0], voce, dettaglio: [valore, r[1]].filter(Boolean).join(" ") });
  };

  if (splitMulti(ctx.vieAeree).includes("Ostruite")) {
    righe.push({ livello: 1, voce: "A – Vie aeree", dettaglio: "Vie aeree ostruite" });
  }
  if (v.spo2 !== null) add("B – SpO2", lvSpo2(v.spo2), `SpO2 ${v.spo2}%`);
  if (v.fr !== null) {
    add("B – Freq. respiratoria", ped ? lvFrPed(v.fr, mesiPed) : lvFr(v.fr), `FR ${v.fr} atti/min`);
  }
  if (v.fc !== null) {
    add(
      "C – Freq. cardiaca",
      ped ? lvFcPed(v.fc, mesiPed) : lvFc(v.fc, input.aritmia),
      `FC ${v.fc} b/m`
    );
  }
  if (!ped) {
    add("C – Pressione sistolica", lvPas(v.pas, input.polsiAssenti, v.fc));
    if (v.pad !== null) add("C – Pressione diastolica", lvPad(v.pad), `PAD ${v.pad} mmHg`);
  }
  if (v.gcs !== null) add("D – GCS", lvGcs(v.gcs), `GCS ${v.gcs}`);
  if (ped && input.pedSegniAllarme) {
    righe.push({
      livello: 1,
      voce: "Segni di allarme",
      dettaglio:
        "Rash petecchiale/purpurico con aspetto settico, rigidità nucale, fontanella bombata o stato soporoso",
    });
  }
  if (v.tc !== null) {
    add(
      "E – Temperatura",
      ped
        ? lvTcPed(v.tc, mesiPed, input.pedImmunodepressione || input.pedCondizioniCompromesse)
        : lvTc(v.tc, input.febbreRiferita),
      `TC ${v.tc} °C`
    );
  }
  if (v.dolore !== null) add("Dolore", lvDolore(v.dolore), `Dolore ${v.dolore}/10`);
  add(
    "Glicemia",
    ped
      ? lvGlicemiaPed(v.glicemia, input.chetosi)
      : lvGlicemia(v.glicemia, input.glicemiaHigh, input.chetosi),
    v.glicemia === null ? "" : `Glicemia ${v.glicemia} mg/dl`
  );
  if (eta !== null && eta > 75 && input.pluripatologico) {
    righe.push({ livello: 3, voce: "Età", dettaglio: `Età ${eta} anni (>75) pluripatologico` });
  }

  if (righe.length === 0) return null;
  righe.sort((a, b) => a.livello - b.livello);
  return { codice: righe[0]!.livello, righe };
}

function calcolaVeneto(
  input: TriageInput,
  v: Valori,
  avpu: Avpu | null,
  mesiPed: number | null
): RisultatoTriage["veneto"] {
  const ped = mesiPed !== null;
  const righe: RigaVeneto[] = [];
  const add = (livello: CodiceVeneto | null, voce: string, dettaglio: string) =>
    righe.push({ livello, voce, dettaglio });

  for (const segno of ISPETTIVI_VENETO) {
    if (input.ispettivi.includes(segno.id)) add("R", "Triage ispettivo", segno.label);
  }
  if (avpu === "P" || avpu === "U") add("R", "AVPU", `Livello di coscienza ${avpu}`);
  if (avpu === "V") add("G", "AVPU", "Risponde solo alla voce (V)");

  if (ped) {
    const [maxFc, maxFr] = soglieVenetoPed(mesiPed);
    if (v.fc !== null && v.fc > maxFc) add("G", "FC", `FC ${v.fc} b/m (> ${maxFc} per età)`);
    if (v.fr !== null && v.fr > maxFr) add("G", "FR", `FR ${v.fr} atti/min (> ${maxFr} per età)`);
    const pews = [input.pewsCoscienza, input.pewsRespiro, input.pewsCircolo].filter(Boolean).length;
    add(
      pews > 1 ? "G" : null,
      "M-PEWS",
      `M-PEWS ${pews}/3` +
        (pews > 1 ? " (>1: Fast Track non indicato)" : " (≤1: Fast Track indicato)")
    );
    if (input.pedInstabilitaAbc) add("R", "APE", "Instabilità fisiologica ABC");
  } else if (v.fr !== null) {
    if (v.fr < 8 || v.fr > 30) add("R", "FR", `FR ${v.fr} atti/min (<8 o >30)`);
    else if (v.fr > 20) add("G", "FR", `FR ${v.fr} atti/min (>20)`);
  }

  const sogliaSpo2 = ped ? 94 : 93;
  if (v.spo2 !== null && v.spo2 < sogliaSpo2) {
    add("G", "SpO2", `SpO2 ${v.spo2}% (<${sogliaSpo2}%)`);
  }

  if (!ped) {
    if (v.fc !== null && (v.fc < 50 || v.fc > 110)) add("G", "FC", `FC ${v.fc} b/m (<50 o >110)`);
    if (v.pas !== null && (v.pas < 90 || v.pas > 220)) {
      add("G", "PAS", `PAS ${v.pas} mmHg (<90 o >220)`);
    }
    // Lo Shock Index > 1 modifica il codice; la TC alterata da sola no (conta nel MEWS).
    if (v.fc !== null && v.pas !== null && v.pas > 0 && v.fc / v.pas > 1) {
      add("G", "Shock Index", `SI ${(v.fc / v.pas).toFixed(2)} (FC/PAS >1)`);
    }
    const [punti, n] = mews(avpu, v.fr, v.fc, v.pas, v.tc);
    if (n > 0) {
      const t = `MEWS ${punti}` + (n < 5 ? ` (parziale: ${n}/5 parametri)` : "");
      if (punti > 4) add("R", "MEWS", `${t} (>4)`);
      else if (punti > 1) add("G", "MEWS", `${t} (>1)`);
      else add(null, "MEWS", `${t} (0-1: non modifica il codice)`);
    }
  }

  const motivo = MOTIVI_PER_ID[input.motivo];
  if (motivo) {
    const presenti = motivo.discriminatori.filter((d) => input.discriminatori.includes(d.id));
    for (const d of presenti) add(d.livello, motivo.label, d.label);
    if (presenti.length === 0)
      add(motivo.seNessuno, motivo.label, "Nessun discriminatore presente");
  }

  const rank = (l: CodiceVeneto | null) =>
    l === null ? ORDINE_VENETO.length : ORDINE_VENETO.indexOf(l);
  righe.sort((a, b) => rank(a.livello) - rank(b.livello));
  const codice = righe[0]?.livello;
  if (!codice) return null;
  return { codice, righe };
}
