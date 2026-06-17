// Tassonomia dei sintomi (sezione SAMPLE della scheda).
// Fonte di verità unica: usata sia per renderizzare le checkbox sia per validare
// (Zod) i codici salvati. Vedi `schemas/scheda.ts`.

export interface VoceSintomo {
  codice: string;
  label: string;
}

export interface CategoriaSintomi {
  id: string;
  label: string;
  voci: VoceSintomo[];
  // Se true, la categoria espone un campo note/testo libero ("altro").
  conNote: boolean;
}

export const CATEGORIE_SINTOMI: CategoriaSintomi[] = [
  {
    id: "cardiorespiratorio",
    label: "Cardiorespiratori",
    conNote: true,
    voci: [
      { codice: "dolore_toracico", label: "Dolore toracico" },
      { codice: "dispnea", label: "Dispnea" },
      { codice: "cianosi", label: "Cianosi" },
      { codice: "pallore", label: "Pallore" },
      { codice: "sudorazione_fredda", label: "Sudorazione fredda" },
      { codice: "palpitazioni", label: "Palpitazioni" },
      { codice: "crisi_asmatica", label: "Crisi asmatica" },
      { codice: "distress_respiratorio", label: "Distress respiratorio" },
      { codice: "sindrome_coronarica_acuta", label: "Sindrome coronarica acuta" },
      { codice: "arresto_cardiaco", label: "Arresto cardiaco" },
      { codice: "cardiopalmo_aritmia", label: "Cardiopalmo / aritmia" },
    ],
  },
  {
    id: "traumatologica",
    label: "Traumatologica",
    conNote: true,
    voci: [
      { codice: "ferita", label: "Ferita" },
      { codice: "contusione", label: "Contusione" },
      { codice: "dolore_mobilizzazione", label: "Mobilità e dolore alla mobilizzazione" },
      { codice: "ustione", label: "Ustione" },
      { codice: "distorsione", label: "Distorsione" },
      { codice: "lesione_da_freddo", label: "Lesione da freddo" },
      { codice: "lesione_occhi", label: "Lesione agli occhi" },
      { codice: "politrauma", label: "Politraumatismo" },
      { codice: "immobilizzazione", label: "Immobilizzazione se necessario" },
      { codice: "ghiaccio", label: "Ghiaccio" },
    ],
  },
  {
    id: "neurologica",
    label: "Neurologica",
    conNote: true,
    voci: [
      { codice: "disartria", label: "Disartria" },
      { codice: "paresi", label: "Paresi" },
      { codice: "perdita_feci", label: "Perdita feci" },
      { codice: "perdita_urine", label: "Perdita urine" },
      { codice: "vertigine", label: "Vertigine" },
      { codice: "cefalea", label: "Cefalea" },
      { codice: "dolore_schiena", label: "Dolore alla schiena" },
      { codice: "coma", label: "Coma" },
      { codice: "ictus", label: "Ictus" },
      { codice: "perdita_coscienza", label: "Perdita di coscienza" },
    ],
  },
  {
    id: "urogenitale",
    label: "Urogenitale - Urologica",
    conNote: true,
    voci: [
      { codice: "ematuria", label: "Ematuria" },
      { codice: "dolore", label: "Dolore" },
      { codice: "emorragia", label: "Emorragia" },
      { codice: "ritenzione_urinaria", label: "Ritenzione urinaria" },
    ],
  },
  {
    id: "digerente",
    label: "Digerente",
    conNote: true,
    voci: [
      { codice: "vomito", label: "Vomito" },
      { codice: "ematemesi", label: "Ematemesi" },
      { codice: "melena", label: "Melena" },
      { codice: "dolore_addominale", label: "Dolore addominale" },
      { codice: "diarrea", label: "Diarrea" },
      { codice: "occlusione", label: "Occlusione" },
      { codice: "stitichezza", label: "Stitichezza" },
      { codice: "ipoglicemia", label: "Ipoglicemia" },
      { codice: "iperglicemia", label: "Iperglicemia" },
      { codice: "altro_metabolico", label: "Altro metabolico" },
      { codice: "altro_gastrointestinale", label: "Altro gastrointestinale" },
    ],
  },
  {
    id: "tossicologico",
    label: "Tossicologico",
    conNote: true,
    voci: [
      { codice: "alcol", label: "Alcol" },
      { codice: "stupefacenti", label: "Stupefacenti" },
      { codice: "farmaci", label: "Farmaci" },
      { codice: "alimenti", label: "Alimenti" },
      { codice: "co_monossido", label: "CO (monossido)" },
      { codice: "funghi", label: "Funghi" },
      { codice: "zecca", label: "Zecca" },
    ],
  },
  {
    id: "altro",
    label: "Altro",
    conNote: true,
    voci: [],
  },
];

// Mappa categoriaId -> Set dei codici validi. Usata dalla validazione Zod.
export const CODICI_PER_CATEGORIA: Record<string, Set<string>> = Object.fromEntries(
  CATEGORIE_SINTOMI.map((c) => [c.id, new Set(c.voci.map((v) => v.codice))])
);

export const CATEGORIA_IDS: Set<string> = new Set(CATEGORIE_SINTOMI.map((c) => c.id));

// Colonne della tabella "Monitoraggio parametri", in ordine.
export const PARAMETRI_COLONNE = [
  { campo: "ora", label: "Ora" },
  { campo: "temp", label: "T°" },
  { campo: "spo2", label: "SpO2" },
  { campo: "dolore", label: "Dolore" },
  { campo: "pa", label: "PA" },
  { campo: "fc", label: "FC" },
  { campo: "fr", label: "FR" },
  { campo: "hgtt", label: "Hgtt" },
  { campo: "gcs", label: "GCS" },
  { campo: "rts", label: "RTS" },
] as const;
