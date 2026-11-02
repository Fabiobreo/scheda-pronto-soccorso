import type { TriageKey } from "@/theme";

// Tabelle cliniche dei modelli di triage Lazio (5 codici) e Veneto (4 codici).
// Portate dal programma di calcolo fornito dal referente (triage_server/app.js).
// Fonti: Manuale regionale Triage intra-ospedaliero modello Lazio a cinque codici;
// Indirizzi tecnico-operativi Triage Veneto (DGR 1888/2015).
// Strumento di supporto: l'attribuzione del codice resta dell'infermiere di triage.

export type CodiceLazio = 1 | 2 | 3 | 4 | 5;
export type CodiceVeneto = "R" | "G" | "V" | "B";

export interface DescrizioneCodice {
  nome: string; // "ROSSO"
  denominazione: string; // "EMERGENZA"
  attesa: string;
  definizione: string;
  colore: TriageKey;
}

export const CODICI_LAZIO: Record<CodiceLazio, DescrizioneCodice> = {
  1: {
    nome: "ROSSO",
    denominazione: "EMERGENZA",
    attesa: "Accesso immediato",
    definizione: "Interruzione o compromissione di una o più funzioni vitali",
    colore: "rosso",
  },
  2: {
    nome: "ARANCIONE",
    denominazione: "URGENZA",
    attesa: "Accesso entro 15 minuti",
    definizione:
      "Rischio di compromissione delle funzioni vitali. Condizione con rischio evolutivo o dolore severo",
    colore: "arancione",
  },
  3: {
    nome: "AZZURRO",
    denominazione: "URGENZA DIFFERIBILE",
    attesa: "Accesso entro 60 minuti",
    definizione:
      "Condizione stabile senza apparente rischio evolutivo che solitamente richiede prestazioni complesse",
    colore: "azzurro",
  },
  4: {
    nome: "VERDE",
    denominazione: "URGENZA MINORE",
    attesa: "Accesso entro 120 minuti",
    definizione:
      "Condizione stabile senza rischio evolutivo che solitamente richiede prestazioni diagnostico terapeutiche semplici mono-specialistiche",
    colore: "verde",
  },
  5: {
    nome: "BIANCO",
    denominazione: "NON URGENZA",
    attesa: "Accesso entro 240 minuti",
    definizione: "Problema non urgente o di minima rilevanza clinica",
    colore: "bianco",
  },
};

export const CODICI_VENETO: Record<CodiceVeneto, DescrizioneCodice> = {
  R: {
    nome: "ROSSO",
    denominazione: "EMERGENZA",
    attesa: "Presa in cura e visita medica immediate",
    definizione: "Assenza o compromissione ispettiva o misurata delle funzioni vitali",
    colore: "rosso",
  },
  G: {
    nome: "GIALLO",
    denominazione: "URGENZA PER RISCHIO",
    attesa:
      "Presa in cura infermieristica: 15’ · Visita medica: 60’ · Osservazione infermieristica: 15’ · Rivalutazione triage: 30’",
    definizione: "Funzioni vitali non compromesse, con rischio evolutivo di compromissione precoce",
    colore: "giallo",
  },
  V: {
    nome: "VERDE",
    denominazione: "CONDIZIONE DI SOFFERENZA",
    attesa:
      "Presa in cura infermieristica: 30’ · Visita medica: 90’ · Osservazione infermieristica: 30’ · Rivalutazione triage: 60’",
    definizione:
      "Nessuna compromissione né rischio evolutivo precoce; sofferenza oggettiva psichica o fisica",
    colore: "verde",
  },
  B: {
    nome: "BIANCO",
    denominazione: "PROBLEMA MINORE",
    attesa: "Triage avanzato · Visita medica: 90’ · Rivalutazione triage: 90’",
    definizione:
      "Nessuna compromissione, rischio o sofferenza oggettiva: problema urgente minore o non urgente differibile",
    colore: "bianco",
  },
};

// Ordine di gravità del modello Veneto (indice minore = più grave).
export const ORDINE_VENETO: readonly CodiceVeneto[] = ["R", "G", "V", "B"];

// Codice Lazio → opzione del campo "Codice triage" della scheda.
export const LAZIO_A_CODICE_SCHEDA: Record<CodiceLazio, string> = {
  1: "Rosso",
  2: "Arancione",
  3: "Azzurro",
  4: "Verde",
  5: "Bianco",
};

// Identificativo stabile di una voce a partire dalla sua etichetta.
export function slug(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

export interface Voce {
  id: string;
  label: string;
}

const voci = (labels: string[]): Voce[] => labels.map((label) => ({ id: slug(label), label }));

// --- Veneto: valutazione ispettiva in porta (ogni segno → ROSSO) ---

export const ISPETTIVI_VENETO: Voce[] = voci([
  "Alterazione del sensorio in porta (V-P-U)",
  "Rumori respiratori ispettivi",
  "Sforzo respiratorio ispettivo",
  "Eloquio ostacolato dallo sforzo respiratorio",
  "Cute pallida, fredda, sudata (o cianotica)",
  "Test clino-ortostatico ispettivo positivo",
]);

// --- Veneto: motivi di accesso e discriminatori ---

export interface Discriminatore extends Voce {
  livello: Exclude<CodiceVeneto, "B">;
}

export interface MotivoAccesso {
  id: string;
  label: string;
  discriminatori: Discriminatore[]; // in ordine R, G, V
  seNessuno: CodiceVeneto; // codice se nessun discriminatore è presente
}

const S = "Aspetto sofferente + NRS 8-10";

// [id, label, ROSSO, GIALLO, VERDE, codice se nessuno]
const MOTIVI_RAW: [string, string, string[], string[], string[], CodiceVeneto][] = [
  [
    "dis",
    "Dispnea (sintomo cardine)",
    [],
    [
      "Disfonia/Disfagia/Odinofagia",
      "Sincope",
      "Cardiopalmo",
      "Dolore toracico, addominale o lombare",
      "ECG significativo",
    ],
    [],
    "V",
  ],
  [
    "sin",
    "Sincope (sintomo cardine)",
    [],
    [
      "Dispnea",
      "Cardiopalmo",
      "Dolore toracico, addominale o lombare",
      "Cefalea",
      "Convulsioni",
      "Disturbi psichici o neurologici",
      "Emorragie",
      "Febbre",
      "Prova posturale positiva",
      "Scala di Cincinnati positiva",
      "ECG significativo",
    ],
    [],
    "V",
  ],
  [
    "car",
    "Cardiopalmo (sintomo cardine)",
    [],
    [
      "Dispnea",
      "Sincope",
      "Dolore toracico, addominale o lombare",
      "Emorragie",
      "ECG significativo",
    ],
    [],
    "V",
  ],
  [
    "tma",
    "Trauma maggiore",
    ["Funzioni vitali alterate (coma, distress respiratorio o shock)"],
    [
      "Gravidanza",
      "Età <1 anno",
      "Cranio-facciale: ferita penetrante/profonda o grave emorragia",
      "Cranio-facciale: corpo estraneo conficcato",
      "Cranio-facciale: disturbi neurologici",
      "Cranio-facciale: disturbi psichici",
      "Perdita di conoscenza ≥1 min",
      "Cefalea intensa e diffusa insorta da <72h",
      "Sospetta frattura della base cranica",
      "Vomito (≥3 episodi)",
      "Rischio ostruzione vie aeree (fratture/instabilità del massiccio, emorragia copiosa)",
      "Grave trauma all’occhio",
      "Collo: ferita penetrante/profonda o grave emorragia",
      "Collo: corpo estraneo conficcato",
      "Disfonia/Disfagia/Odinofagia",
      "Colonna: paresi (para/tetraparesi)",
      "Colonna: parestesie/insensibilità",
      "Torace/addome: ferita penetrante/profonda o grave emorragia",
      "Torace/addome: corpo estraneo conficcato",
      "Movimenti paradossi del torace",
      "Dolore addominale",
      "Arti: ferita penetrante/profonda, grave emorragia o settori prossimali",
      "Arti: corpo estraneo conficcato",
      "Sospetta lussazione grosse articolazioni o frattura scomposta prossimale",
      "Emorragia interna sospetta (emottisi, ematemesi-melena, ematuria, rettorragia, emorragia vaginale)",
      "Ustione estesa (>18%; >10% se età ≤10 anni)",
      "Ustione al volto/vie aeree",
      "Ustione chimica",
      "Ustione elettrica",
      "Dinamica (<24h): velocità ≥70 km/h",
      "Dinamica: incastrato",
      "Dinamica: eiettato",
      "Dinamica: cappottamento del veicolo",
      "Dinamica: grave danno al veicolo (abitacolo deformato)",
      "Dinamica: decesso di passeggero nel medesimo veicolo",
      "Dinamica: pedone/ciclista/motociclista investito (≥30 km/h o separazione dal mezzo)",
      "Dinamica: caduta di testa >1 m",
      "Dinamica: caduta da altezza >3 m",
    ],
    [
      "Età ≤3 anni",
      "Età ≥75 anni",
      "Diatesi emorragica (anticoagulante o doppia antiaggregazione)",
      "Emofilia",
      S,
    ],
    "B",
  ],
  ["tmi", "Trauma minore (dinamica insignificante)", [], [], ["Emofilia"], "B"],
  [
    "tor",
    "Dolore toracico e dorsale (non traumatico)",
    [],
    [
      "Sintomatologia tipica di SCA",
      "Fattori di rischio CAD (cardiopatia ischemica nota, ipertensione, diabete, ipercolesterolemia, obesità grave, tabagismo, familiarità, cocaina)",
      "Fattori di rischio dissezione aortica (aneurisma noto, ipertensione, Marfan)",
      "Fattori di rischio embolia polmonare (TVP, allettamento, viaggi lunghi, recente intervento, tabagismo, estro-progestinici, trombofilia, gravidanza/puerperio, neoplasia attiva)",
    ],
    [S],
    "B",
  ],
  [
    "abd",
    "Dolore addominale, lombare, pelvico (non traumatico)",
    [],
    ["Anamnesi di aneurisma aortico", "Intossicazione", "Vomito, diarrea in età <3 anni"],
    ["Dolore al testicolo", "Dolore addominale in donna mono-ovarica", "Diabete", S],
    "B",
  ],
  [
    "cef",
    "Cefalea (non traumatica)",
    [],
    [
      "Insorgenza improvvisa",
      "Disturbi neurologici",
      "Disturbi psichici",
      "Febbre + disturbi psichici",
      "Gravidanza >25 settimana",
    ],
    ["Occhio rosso dolente", S],
    "B",
  ],
  [
    "dn",
    "Disturbi neurologici",
    [],
    [
      "In atto con esordio ≤6h",
      "Cefalea",
      "Disturbi psichici",
      "Diabete",
      "Intossicazione",
      "Gravidanza >25 settimana",
    ],
    ["Vertigini con incapacità a mantenere la stazione eretta"],
    "B",
  ],
  [
    "dp",
    "Disturbi psichici",
    [],
    [
      "Cefalea",
      "Febbre + cefalea",
      "Disturbi neurologici",
      "Diabete",
      "Intossicazione",
      "Violenza verso se stessi",
      "Violenza verso altri",
      "Gravidanza >25 settimana",
    ],
    ["BPCO", "Epatopatia"],
    "B",
  ],
  [
    "int",
    "Intossicazione",
    [],
    [
      "Disfonia/Disfagia/Odinofagia",
      "Disturbi neurologici",
      "Disturbi psichici",
      "Enterale ≤3h",
      "Contatto mucoso/cutaneo",
      "Volontaria",
      "Tossici specifici",
    ],
    [S],
    "B",
  ],
  [
    "all",
    "Allergia, anafilassi",
    [],
    [
      "Disfagia/Disfonia/Odinofagia",
      "Sintomatologia cutanea ingravescente",
      "Dolore addominale",
      "Nausea, vomito, diarrea",
      "Pregresso episodio di shock anafilattico",
    ],
    [],
    "B",
  ],
  [
    "emo",
    "Emorragie (non traumatiche)",
    [],
    [
      "Ematemesi/Melena",
      "Emottisi importante",
      "Metrorragia >25 settimana (gravida)",
      "Diatesi emorragica",
      "Febbre",
    ],
    [],
    "B",
  ],
  [
    "feb",
    "Febbre (>38 °C)",
    [],
    [
      "Porpora, ematomi, epistassi, gengivorragia",
      "Cefalea + disturbi psichici",
      "Immunocompromesso",
      "Età <3 mesi",
      "Vomito, diarrea in età <3 anni",
    ],
    ["Edema periorbitario", "Età <1 anno"],
    "B",
  ],
  [
    "arto",
    "Dolore acuto a un arto non traumatico",
    [],
    ["Arto freddo, pallido, ipotermico"],
    ["Arto edematoso, cianotico", "Febbre", S],
    "B",
  ],
  [
    "gra",
    "Gravidanza",
    [],
    [
      "Metrorragia >25 settimana",
      "Cefalea >25 settimana",
      "Disturbi neurologici/psichici >25 settimana",
      "Contrazioni uterine predittive di parto imminente",
    ],
    ["Ipertensione, edemi >25 settimana"],
    "B",
  ],
  [
    "alt",
    "Altro di emergenza giallo",
    [],
    ["Rischio presunto dall’infermiere di triage, non definibile con le tabelle"],
    [],
    "G",
  ],
  ["min", "Altro motivo minore / per apparato", [], [], [S], "B"],
];

export const MOTIVI_VENETO: MotivoAccesso[] = MOTIVI_RAW.map(
  ([id, label, rosso, giallo, verde, seNessuno]) => ({
    id,
    label,
    seNessuno,
    discriminatori: [
      ...rosso.map((l) => ({ id: slug(l), label: l, livello: "R" as const })),
      ...giallo.map((l) => ({ id: slug(l), label: l, livello: "G" as const })),
      ...verde.map((l) => ({ id: slug(l), label: l, livello: "V" as const })),
    ],
  })
);

// Oggetto senza prototipo: gli id arrivano dal client, e chiavi come "__proto__"
// o "toString" non devono risolversi in membri di Object.prototype.
export const MOTIVI_PER_ID: Readonly<Record<string, MotivoAccesso>> = Object.freeze(
  Object.assign(
    Object.create(null) as Record<string, MotivoAccesso>,
    Object.fromEntries(MOTIVI_VENETO.map((m) => [m.id, m]))
  )
);

// --- Lazio pediatrico: soglie FR e FC per età (tab. pediatriche 3 e 4, da CTAS) ---
// [mesi, rosso/arancio, arancio/azzurro, azzurro/bianco, bianco/azzurro, azzurro/arancio, arancio/rosso]
// Ricavate dai grafici a bande del manuale: valori approssimati di circa 1–2 unità
// (accettato dal referente clinico).

export type RigaSoglie = readonly [number, number, number, number, number, number, number];

export const SOGLIE_FR_PED: readonly RigaSoglie[] = [
  [3, 16, 25, 34, 52, 60, 70],
  [4.5, 15, 24, 33, 51, 60, 69],
  [6, 15, 24, 32, 50, 58, 67],
  [9, 14, 22, 29, 47, 55, 64],
  [12, 13, 21, 29, 45, 52, 60],
  [15, 13, 19, 27, 42, 49, 57],
  [18, 13, 19, 26, 39, 46, 52],
  [21, 13, 19, 25, 37, 42, 48],
  [23.5, 13, 18, 24, 35, 39, 45],
  [48, 13, 18, 23, 33, 37, 42],
  [60, 14, 18, 21, 29, 32, 36],
  [72, 15, 17, 20, 26, 29, 32],
  [96, 14, 16, 18, 24, 26, 28],
  [120, 12, 15, 17, 22, 24, 26],
  [144, 11, 13, 16, 21, 23, 26],
  [168, 9, 12, 15, 20, 22, 25],
  [192, 9, 11, 13, 18, 21, 23],
  [213.6, 8, 9, 13, 17, 20, 22],
];

export const SOGLIE_FC_PED: readonly RigaSoglie[] = [
  [4.5, 95, 111, 127, 159, 175, 190],
  [6, 93, 109, 125, 157, 172, 188],
  [9, 88, 104, 119, 149, 165, 180],
  [12, 83, 98, 112, 142, 157, 170],
  [15, 78, 94, 108, 138, 152, 166],
  [18, 75, 89, 104, 134, 148, 164],
  [21, 71, 86, 99, 130, 144, 159],
  [23.5, 69, 84, 98, 127, 141, 156],
  [60, 63, 78, 92, 119, 135, 150],
  [72, 58, 72, 86, 115, 129, 144],
  [96, 49, 64, 78, 106, 119, 134],
  [120, 44, 58, 71, 99, 113, 127],
  [144, 38, 53, 66, 93, 107, 119],
  [168, 36, 49, 62, 89, 103, 116],
  [192, 33, 46, 58, 86, 99, 113],
  [213.6, 30, 44, 57, 83, 96, 110],
];
