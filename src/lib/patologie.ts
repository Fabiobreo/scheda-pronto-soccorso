// Tassonomia della "patologia prevalente" (codifica tipo 118) della sezione
// Valutazione iniziale. Fonte di verità unica: usata sia per renderizzare il
// modale di selezione sia per validare (Zod) i codici salvati e per
// ricostruire le label in sola lettura. Vedi `schemas/scheda.ts`.

export interface VocePatologia {
  codice: string;
  label: string;
}

export interface CategoriaPatologie {
  id: string;
  label: string;
  voci: VocePatologia[];
}

export const CATEGORIE_PATOLOGIE: CategoriaPatologie[] = [
  {
    id: "traumatica",
    label: "Traumatica",
    voci: [
      { codice: "C0101", label: "Cranio" },
      { codice: "C0102", label: "Torace" },
      { codice: "C0103", label: "Addome" },
      { codice: "C0104", label: "Arti" },
      { codice: "C0105", label: "Rachide" },
      { codice: "C0106", label: "Emorragia" },
      { codice: "C0107", label: "Amputazione" },
      { codice: "C0108", label: "Ferita" },
      { codice: "C0109", label: "Frattura" },
      { codice: "C0110", label: "Contusione" },
      { codice: "C0111", label: "Ustione" },
      { codice: "C0112", label: "Folgorazione/elettrocuzione" },
      { codice: "C0113", label: "Lesione da freddo" },
      { codice: "C0114", label: "Lesione agli occhi" },
      { codice: "C0115", label: "Politraumatismo" },
      { codice: "C0116", label: "Altra traumatica" },
    ],
  },
  {
    id: "cardiocircolatoria",
    label: "Cardiocircolatoria",
    voci: [
      { codice: "C0201", label: "Crisi ipertensiva" },
      { codice: "C0203", label: "Dolore toracico" },
      { codice: "C0204", label: "Cardiopalmo/Aritmia" },
      { codice: "C0205", label: "Arresto cardio-circolatorio" },
      { codice: "C0206", label: "Sindrome coronarica acuta" },
      { codice: "C0209", label: "Altra cardio-circolatoria" },
    ],
  },
  {
    id: "respiratoria",
    label: "Respiratoria",
    voci: [
      { codice: "C0301", label: "Distress respiratorio" },
      { codice: "C0302", label: "Corpo estraneo" },
      { codice: "C0303", label: "Crisi asmatica" },
      { codice: "C0304", label: "Immersione/sommersione" },
      { codice: "C0305", label: "Insufficienza respiratoria cronica" },
      { codice: "C0309", label: "Altra respiratoria" },
    ],
  },
  {
    id: "neurologica",
    label: "Neurologica",
    voci: [
      { codice: "C0401", label: "Convulsioni" },
      { codice: "C0402", label: "Cefalea" },
      { codice: "C0403", label: "Coma" },
      { codice: "C0404", label: "Ictus" },
      { codice: "C0405", label: "Decadimento psichico" },
      { codice: "C0406", label: "Perdita di coscienza" },
    ],
  },
  {
    id: "psichiatrica",
    label: "Psichiatrica",
    voci: [
      { codice: "C0501", label: "Tentato suicidio" },
      { codice: "C0502", label: "Agitazione psicomotoria" },
      { codice: "C0509", label: "Altra psichiatrica" },
    ],
  },
  {
    id: "oncologica",
    label: "Oncologica",
    voci: [{ codice: "C0601", label: "Neoplastica" }],
  },
  {
    id: "tossicologica",
    label: "Tossicologica",
    voci: [
      { codice: "C0700", label: "Intossicazione etilica" },
      { codice: "C0701", label: "Ossido di carbonio" },
      { codice: "C0702", label: "Farmaci" },
      { codice: "C0703", label: "Alimenti" },
      { codice: "C0704", label: "Sostanze chimiche" },
      { codice: "C0705", label: "Overdose/stupefacenti" },
      { codice: "C0709", label: "Altra intossicazione" },
    ],
  },
  {
    id: "metabolica",
    label: "Metabolica",
    voci: [
      { codice: "C0801", label: "Iperglicemia" },
      { codice: "C0802", label: "Ipoglicemia" },
      { codice: "C0809", label: "Altro - metabolica" },
    ],
  },
  {
    id: "gastroenterologica",
    label: "Gastroenterologica",
    voci: [
      { codice: "C0901", label: "Emorragia digestiva" },
      { codice: "C0902", label: "Dolore addominale" },
      { codice: "C0909", label: "Altro - gastroenterologica" },
    ],
  },
  {
    id: "urologica",
    label: "Urologica",
    voci: [
      { codice: "C1002", label: "Ritenzione urinaria" },
      { codice: "C1009", label: "Altro - urologica" },
    ],
  },
  {
    id: "oftalmologica",
    label: "Oftalmologica",
    voci: [
      { codice: "C1101", label: "Ferita penetrante occhio" },
      { codice: "C1109", label: "Altro - oftalmologia" },
    ],
  },
  {
    id: "orl",
    label: "Otorinolaringoiatrica (ORL)",
    voci: [
      { codice: "C1201", label: "Epistassi" },
      { codice: "C1202", label: "Corpo estraneo" },
      { codice: "C1209", label: "Altro - ORL" },
    ],
  },
  {
    id: "dermatologica",
    label: "Dermatologica",
    voci: [
      { codice: "C1301", label: "Parassitosi" },
      { codice: "C1302", label: "Reazione orticarioide" },
      { codice: "C1309", label: "Altro - dermatologica" },
    ],
  },
  {
    id: "ostetrico_ginecologica",
    label: "Ostetrico-ginecologica",
    voci: [
      { codice: "C1401", label: "Parto" },
      { codice: "C1402", label: "Metrorragia" },
      { codice: "C1403", label: "Minaccia aborto" },
      { codice: "C1409", label: "Altro - ostetrico-ginecologica" },
    ],
  },
  {
    id: "infettiva",
    label: "Infettiva",
    voci: [
      { codice: "C1501", label: "Stato febbrile" },
      { codice: "C1509", label: "Altro - infettiva" },
    ],
  },
  {
    id: "altra",
    label: "Altra / Maxiemergenza",
    voci: [
      { codice: "C1901", label: "Stato febbrile" },
      {
        codice: "C1902",
        label: "NBCR (catastrofe o emergenza nucleare, batteriologica, chimica o radioattiva)",
      },
    ],
  },
];

// Tutte le voci in ordine, utile per lookup e validazione.
export const VOCI_PATOLOGIE: VocePatologia[] = CATEGORIE_PATOLOGIE.flatMap((c) => c.voci);

// Set dei codici validi. Usato dalla validazione Zod.
export const CODICI_PATOLOGIE: Set<string> = new Set(VOCI_PATOLOGIE.map((v) => v.codice));

// Mappa codice -> label, per ricostruire le etichette da un elenco di codici.
export const LABEL_PER_CODICE: Record<string, string> = Object.fromEntries(
  VOCI_PATOLOGIE.map((v) => [v.codice, v.label])
);
