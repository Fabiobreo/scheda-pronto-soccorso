import { z } from "zod";
import { ISPETTIVI_VENETO, MOTIVI_PER_ID } from "@/lib/triage/tabelle";

// Input del calcolo del triage, salvato nella colonna Json `Scheda.triage`.
// Coscienza (→ AVPU), vie aeree, data di nascita e data della scheda NON sono
// qui: il calcolo li legge dai campi già presenti nella scheda.
// I valori numerici sono stringhe (come gli altri campi della scheda): il calcolo
// le interpreta e segnala quelle non valide, senza bloccare l'autosave.

const num = z.string().max(10).default("");
const flag = z.boolean().default(false);

const ISPETTIVI_IDS = new Set(ISPETTIVI_VENETO.map((v) => v.id));

const TriageInputBaseSchema = z.object({
  ora: z.string().max(20).default(""),

  // Parametri vitali (Lazio + Veneto)
  spo2: num,
  fr: num,
  fc: num,
  pas: num,
  pad: num,
  gcs: num,
  tc: num,
  dolore: num,
  glicemia: num,
  aritmia: flag,
  polsiAssenti: flag,
  febbreRiferita: flag,
  glicemiaHigh: flag,
  chetosi: flag,
  pluripatologico: flag,

  // Veneto
  ispettivi: z.array(z.string().max(60)).max(20).default([]),
  motivo: z.string().max(10).default(""),
  discriminatori: z.array(z.string().max(60)).max(60).default([]),

  // Pediatrico (età < 18 anni)
  pedInstabilitaAbc: flag,
  pewsCoscienza: flag,
  pewsRespiro: flag,
  pewsCircolo: flag,
  pedImmunodepressione: flag,
  pedCondizioniCompromesse: flag,
  pedSegniAllarme: flag,
});

// Scrittura (PUT/POST): rifiuta id sconosciuti, come per i sintomi.
export const TriageInputSchema = TriageInputBaseSchema.superRefine((val, ctx) => {
  val.ispettivi.forEach((id, i) => {
    if (!ISPETTIVI_IDS.has(id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Segno ispettivo non valido: ${id}`,
        path: ["ispettivi", i],
      });
    }
  });
  if (val.motivo && !MOTIVI_PER_ID[val.motivo]) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Motivo di accesso non valido: ${val.motivo}`,
      path: ["motivo"],
    });
    return;
  }
  const ammessi = new Set((MOTIVI_PER_ID[val.motivo]?.discriminatori ?? []).map((d) => d.id));
  val.discriminatori.forEach((id, i) => {
    if (!ammessi.has(id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Discriminatore non valido per il motivo "${val.motivo}": ${id}`,
        path: ["discriminatori", i],
      });
    }
  });
});
export type TriageInput = z.infer<typeof TriageInputSchema>;

// Lettura dal DB: tollerante. Se una voce non esiste più nelle tabelle (es. dopo un
// aggiornamento del manuale) si scarta SOLO quella voce, non l'intero triage:
// altrimenti il primo autosave cancellerebbe anche i parametri inseriti.
const TriageInputLetturaSchema = TriageInputBaseSchema.catch(() => TriageInputBaseSchema.parse({}));

export function normalizzaTriageInput(raw: unknown): TriageInput {
  const t = TriageInputLetturaSchema.parse(raw);
  const motivo = MOTIVI_PER_ID[t.motivo];
  const ammessi = new Set((motivo?.discriminatori ?? []).map((d) => d.id));
  return {
    ...t,
    motivo: motivo ? t.motivo : "",
    discriminatori: t.discriminatori.filter((id) => ammessi.has(id)),
    ispettivi: t.ispettivi.filter((id) => ISPETTIVI_IDS.has(id)),
  };
}

// --- Risultato salvato (scritto solo dal server) ---

const codiceLazio = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
const codiceVeneto = z.enum(["R", "G", "V", "B"]);

// Validato in lettura: un valore legacy/corrotto non deve far cadere la vista.
export const RisultatoTriageSchema = z.object({
  eta: z.number().nullable(),
  pediatrico: z.boolean(),
  avpu: z.enum(["A", "V", "P", "U"]).nullable(),
  lazio: z
    .object({
      codice: codiceLazio,
      righe: z.array(z.object({ livello: codiceLazio, voce: z.string(), dettaglio: z.string() })),
    })
    .nullable(),
  veneto: z
    .object({
      codice: codiceVeneto,
      righe: z.array(
        z.object({ livello: codiceVeneto.nullable(), voce: z.string(), dettaglio: z.string() })
      ),
    })
    .nullable(),
  avvisi: z.array(z.string()),
});
