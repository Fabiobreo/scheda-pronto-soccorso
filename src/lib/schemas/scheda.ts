import { z } from "zod";
import { CATEGORIA_IDS, CODICI_PER_CATEGORIA } from "@/lib/sintomi";

// --- Sotto-schemi delle sezioni a righe ripetute ---

export const ParametroVitaleSchema = z.object({
  ora: z.string().max(20).default(""),
  temp: z.string().max(20).default(""),
  spo2: z.string().max(20).default(""),
  dolore: z.string().max(20).default(""),
  pa: z.string().max(20).default(""),
  fc: z.string().max(20).default(""),
  fr: z.string().max(20).default(""),
  hgtt: z.string().max(20).default(""),
  gcs: z.string().max(20).default(""),
  rts: z.string().max(20).default(""),
});
export type ParametroVitale = z.infer<typeof ParametroVitaleSchema>;

export const TerapiaSomministrataSchema = z.object({
  ora: z.string().max(20).default(""),
  farmaco: z.string().max(200).default(""),
  dose: z.string().max(100).default(""),
  via: z.string().max(50).default(""),
  note: z.string().max(500).default(""),
});
export type TerapiaSomministrata = z.infer<typeof TerapiaSomministrataSchema>;

export const VoceDiarioSchema = z.object({
  ora: z.string().max(20).default(""),
  testo: z.string().max(2000).default(""),
});
export type VoceDiario = z.infer<typeof VoceDiarioSchema>;

// --- Sintomi (SAMPLE): record categoriaId -> selezione ---

export const CategoriaSelezioneSchema = z.object({
  codici: z.array(z.string().max(60)).default([]),
  note: z.string().max(1000).default(""),
});
export type CategoriaSelezione = z.infer<typeof CategoriaSelezioneSchema>;

export const SintomiSchema = z
  .record(z.string(), CategoriaSelezioneSchema)
  .superRefine((val, ctx) => {
    for (const [catId, sel] of Object.entries(val)) {
      if (!CATEGORIA_IDS.has(catId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Categoria sintomi sconosciuta: ${catId}`,
          path: [catId],
        });
        continue;
      }
      const allowed = CODICI_PER_CATEGORIA[catId]!;
      sel.codici.forEach((codice, i) => {
        if (!allowed.has(codice)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Codice sintomo non valido per "${catId}": ${codice}`,
            path: [catId, "codici", i],
          });
        }
      });
    }
  });
export type Sintomi = z.infer<typeof SintomiSchema>;

// --- Contenuto della scheda (tutti i campi editabili) ---

const contentShape = {
  riferimento: z.string().max(120),
  sintomi: SintomiSchema,
  parametri: z.array(ParametroVitaleSchema).max(200),
  anamnesi: z.string().max(5000),
  terapiaDomiciliare: z.string().max(5000),
  negaTerapiaDomiciliare: z.boolean(),
  allergie: z.string().max(2000),
  negaAllergie: z.boolean(),
  terapieSomministrate: z.array(TerapiaSomministrataSchema).max(200),
  diario: z.array(VoceDiarioSchema).max(500),
  conclusioni: z.string().max(5000),
} as const;

// POST /api/schede — crea una bozza. Tutto opzionale: di norma il body è vuoto.
export const SchedaCreateSchema = z.object(contentShape).partial();
export type SchedaCreateInput = z.infer<typeof SchedaCreateSchema>;

// PUT /api/schede/[id] — autosave parziale + eventuale passaggio di stato.
// La regola di transizione (solo DRAFT -> COMPLETED, niente edit su COMPLETED)
// è applicata nella route, non qui.
export const SchedaUpdateSchema = z
  .object({
    ...contentShape,
    status: z.enum(["DRAFT", "COMPLETED"]),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nessun campo da aggiornare",
  });
export type SchedaUpdateInput = z.infer<typeof SchedaUpdateSchema>;
