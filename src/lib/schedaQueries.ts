import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { normalizeSintomi, type SchedaListItem } from "@/lib/scheda";

// Parsing e validazione dei parametri di lista (ricerca/filtri/paginazione/ordinamento).
// Condiviso tra la route API e il Server Component della home: una sola fonte di verità.

export const SCHEDA_SORT_FIELDS = ["updatedAt", "createdAt", "cognome"] as const;
export type SchedaSortField = (typeof SCHEDA_SORT_FIELDS)[number];

export const SchedaListParamsSchema = z.object({
  q: z.string().trim().max(120).catch(""),
  status: z.enum(["DRAFT", "COMPLETED"]).optional().catch(undefined),
  triage: z.string().trim().max(20).optional().catch(undefined),
  dataFrom: z.string().trim().max(20).optional().catch(undefined),
  dataTo: z.string().trim().max(20).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(20),
  sort: z.enum(SCHEDA_SORT_FIELDS).catch("updatedAt"),
  dir: z.enum(["asc", "desc"]).catch("desc"),
});
export type SchedaListParams = z.infer<typeof SchedaListParamsSchema>;

export interface SchedaListResult {
  items: SchedaListItem[];
  total: number;
  page: number;
  pageSize: number;
}

// Accetta un oggetto "grezzo" di searchParams (string | string[] | undefined) e
// ne ricava parametri validi, con default robusti (mai throw sui valori errati).
export function parseSchedaListParams(
  raw: Record<string, string | string[] | undefined>
): SchedaListParams {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return SchedaListParamsSchema.parse({
    q: first(raw.q) ?? "",
    status: first(raw.status) || undefined,
    triage: first(raw.triage) || undefined,
    dataFrom: first(raw.dataFrom) || undefined,
    dataTo: first(raw.dataTo) || undefined,
    page: first(raw.page),
    pageSize: first(raw.pageSize),
    sort: first(raw.sort),
    dir: first(raw.dir),
  });
}

const listSelect = {
  id: true,
  status: true,
  riferimento: true,
  cognome: true,
  nome: true,
  codiceTriage: true,
  sintomi: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
} as const;

// Usato da GET /api/schede/[id] e dalla pagina Server Component: espone tutti i
// campi clinici ma NON le FK interne (createdById, deletedById, completedById).
export const schedaDetailSelect = {
  id: true,
  status: true,
  riferimento: true,
  data: true,
  oraArrivo: true,
  nome: true,
  cognome: true,
  dataNascita: true,
  sesso: true,
  telefono: true,
  gruppo: true,
  codiceTriage: true,
  oraInizioTrattamento: true,
  responsabile: true,
  coscienza: true,
  vieAeree: true,
  respiro: true,
  circolo: true,
  addome: true,
  esito: true,
  patologie: true,
  sintomi: true,
  parametri: true,
  anamnesi: true,
  terapiaDomiciliare: true,
  negaTerapiaDomiciliare: true,
  allergie: true,
  negaAllergie: true,
  terapieSomministrate: true,
  diario: true,
  conclusioni: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  completedBy: { select: { name: true, email: true } },
} as const;

// Esegue la query paginata. Esclude sempre le schede nel cestino (deletedAt != null).
export async function listSchede(params: SchedaListParams): Promise<SchedaListResult> {
  const { q, status, triage, dataFrom, dataTo, page, pageSize, sort, dir } = params;

  // Condizioni combinate in AND (così posso usare più OR senza collisioni di chiave).
  const and: Prisma.SchedaWhereInput[] = [];

  // Ricerca testuale.
  if (q) {
    and.push({
      OR: [
        { cognome: { contains: q, mode: "insensitive" } },
        { nome: { contains: q, mode: "insensitive" } },
        { riferimento: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  // Filtro per intervallo di date: usa la data CLINICA della scheda se valorizzata
  // (confronto lessicografico su stringhe yyyy-MM-dd), altrimenti ripiega sulla
  // data di CREAZIONE (createdAt). I confini di giornata sono in UTC.
  if (dataFrom || dataTo) {
    const clinica: Prisma.StringFilter = { not: "" };
    if (dataFrom) clinica.gte = dataFrom;
    if (dataTo) clinica.lte = dataTo;

    const creazione: Prisma.DateTimeFilter = {};
    if (dataFrom) creazione.gte = new Date(`${dataFrom}T00:00:00.000Z`);
    if (dataTo) creazione.lte = new Date(`${dataTo}T23:59:59.999Z`);

    and.push({
      OR: [
        { data: clinica },
        { data: "", createdAt: creazione },
      ],
    });
  }

  const where: Prisma.SchedaWhereInput = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(triage ? { codiceTriage: { equals: triage, mode: "insensitive" } } : {}),
    ...(and.length ? { AND: and } : {}),
  };

  const [rows, total] = await Promise.all([
    db.scheda.findMany({
      where,
      select: listSelect,
      orderBy: { [sort]: dir },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.scheda.count({ where }),
  ]);

  const items: SchedaListItem[] = rows.map((r) => ({
    id: r.id,
    status: r.status,
    riferimento: r.riferimento,
    cognome: r.cognome,
    nome: r.nome,
    codiceTriage: r.codiceTriage,
    sintomi: normalizeSintomi(r.sintomi),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
  }));

  return { items, total, page, pageSize };
}
