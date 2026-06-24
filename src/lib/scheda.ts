import { z } from "zod";
import type { SchedaStatus } from "@prisma/client";
import {
  ParametroVitaleSchema,
  PatologieSchema,
  SintomiSchema,
  TerapiaSomministrataSchema,
  VoceDiarioSchema,
  type ParametroVitale,
  type Patologie,
  type Sintomi,
  type TerapiaSomministrata,
  type VoceDiario,
} from "@/lib/schemas/scheda";

// Contenuto editabile della scheda (tutto ciò che l'editor manipola).
export interface SchedaContent {
  riferimento: string;
  // Anagrafica / intestazione
  data: string;
  oraArrivo: string;
  nome: string;
  cognome: string;
  dataNascita: string;
  sesso: string;
  telefono: string;
  gruppo: string;
  codiceTriage: string;
  oraInizioTrattamento: string;
  responsabile: string;
  // Valutazione iniziale (ABCDE) + esito
  coscienza: string;
  vieAeree: string;
  respiro: string;
  circolo: string;
  addome: string;
  patologie: Patologie;
  esito: string;
  sintomi: Sintomi;
  parametri: ParametroVitale[];
  anamnesi: string;
  terapiaDomiciliare: string;
  negaTerapiaDomiciliare: boolean;
  allergie: string;
  negaAllergie: boolean;
  terapieSomministrate: TerapiaSomministrata[];
  diario: VoceDiario[];
  conclusioni: string;
}

// DTO passato dai Server Component ai client (date come stringhe ISO).
export interface SchedaDTO extends SchedaContent {
  id: string;
  status: SchedaStatus;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface SchedaListItem {
  id: string;
  status: SchedaStatus;
  riferimento: string;
  cognome: string;
  nome: string;
  sintomi: Sintomi;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

// --- Validazione di completamento ---
//
// Campi minimi richiesti per marcare una scheda come COMPLETED. È volutamente
// centralizzata e usata sia dal client (per abilitare/spiegare il bottone) sia dal
// server (422 se non soddisfatta). La lista va concordata col cliente: qui un set
// clinicamente sensato e facile da estendere.

// Ritorna le etichette dei requisiti NON soddisfatti (vuoto = completabile).
export function campiMancantiPerCompletamento(c: SchedaContent): string[] {
  const mancanti: string[] = [];

  // Identificativo paziente: almeno cognome o riferimento.
  if (!c.cognome.trim() && !c.riferimento.trim()) {
    mancanti.push("Identificativo paziente (cognome o riferimento)");
  }

  // Valutazione iniziale: almeno una delle voci ABCDE valorizzata.
  const valutazione = [c.coscienza, c.vieAeree, c.respiro, c.circolo, c.addome];
  if (valutazione.every((v) => !v.trim())) {
    mancanti.push("Valutazione iniziale (almeno un campo)");
  }

  // Esito del trattamento.
  if (!c.esito.trim()) {
    mancanti.push("Esito");
  }

  return mancanti;
}

// Etichetta della scheda per la lista: "Cognome Nome" se presenti, altrimenti
// il riferimento, altrimenti un placeholder.
export function etichettaScheda(s: { cognome: string; nome: string; riferimento: string }): string {
  const nominativo = [s.cognome, s.nome]
    .map((x) => x.trim())
    .filter(Boolean)
    .join(" ");
  return nominativo || s.riferimento.trim() || "(senza riferimento)";
}

// Coercizione difensiva dei campi Json (sconosciuti a livello di tipo Prisma).
const parametriArray = z.array(ParametroVitaleSchema).catch([]);
const terapieArray = z.array(TerapiaSomministrataSchema).catch([]);
const diarioArray = z.array(VoceDiarioSchema).catch([]);
const sintomiSafe = SintomiSchema.catch({});
const patologieSafe = PatologieSchema.catch([]);

// Riga generica restituita da Prisma (con Json e Date). Normalizziamo a SchedaContent.
interface SchedaRowLike {
  sintomi: unknown;
  patologie: unknown;
  parametri: unknown;
  terapieSomministrate: unknown;
  diario: unknown;
  riferimento: string;
  data: string;
  oraArrivo: string;
  nome: string;
  cognome: string;
  dataNascita: string;
  sesso: string;
  telefono: string;
  gruppo: string;
  codiceTriage: string;
  oraInizioTrattamento: string;
  responsabile: string;
  coscienza: string;
  vieAeree: string;
  respiro: string;
  circolo: string;
  addome: string;
  esito: string;
  anamnesi: string;
  // NB: patologie è Json (unknown), gestito sopra.
  terapiaDomiciliare: string;
  negaTerapiaDomiciliare: boolean;
  allergie: string;
  negaAllergie: boolean;
  conclusioni: string;
}

export function normalizeSintomi(raw: unknown): Sintomi {
  return sintomiSafe.parse(raw);
}

export function toContent(row: SchedaRowLike): SchedaContent {
  return {
    riferimento: row.riferimento,
    data: row.data,
    oraArrivo: row.oraArrivo,
    nome: row.nome,
    cognome: row.cognome,
    dataNascita: row.dataNascita,
    sesso: row.sesso,
    telefono: row.telefono,
    gruppo: row.gruppo,
    codiceTriage: row.codiceTriage,
    oraInizioTrattamento: row.oraInizioTrattamento,
    responsabile: row.responsabile,
    coscienza: row.coscienza,
    vieAeree: row.vieAeree,
    respiro: row.respiro,
    circolo: row.circolo,
    addome: row.addome,
    patologie: patologieSafe.parse(row.patologie),
    esito: row.esito,
    sintomi: sintomiSafe.parse(row.sintomi),
    parametri: parametriArray.parse(row.parametri),
    anamnesi: row.anamnesi,
    terapiaDomiciliare: row.terapiaDomiciliare,
    negaTerapiaDomiciliare: row.negaTerapiaDomiciliare,
    allergie: row.allergie,
    negaAllergie: row.negaAllergie,
    terapieSomministrate: terapieArray.parse(row.terapieSomministrate),
    diario: diarioArray.parse(row.diario),
    conclusioni: row.conclusioni,
  };
}

// --- Factory per nuove righe vuote ---

export function emptyParametro(): ParametroVitale {
  return ParametroVitaleSchema.parse({});
}

export function emptyTerapia(): TerapiaSomministrata {
  return TerapiaSomministrataSchema.parse({});
}

export function emptyVoceDiario(): VoceDiario {
  return VoceDiarioSchema.parse({});
}
