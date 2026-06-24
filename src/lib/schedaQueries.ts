import { z } from "zod";
import { db } from "@/lib/db";
import { normalizeSintomi, type SchedaListItem } from "@/lib/scheda";

// Parsing e validazione dei parametri di lista (ricerca/filtri/paginazione/ordinamento).
// Condiviso tra la route API e il Server Component della home: una sola fonte di verità.

export const SCHEDA_SORT_FIELDS = ["updatedAt", "createdAt", "cognome"] as const;
export type SchedaSortField = (typeof SCHEDA_SORT_FIELDS)[number];

export const SchedaListParamsSchema = z.object({
  q: z.string().trim().max(120).catch(""),
  status: z.enum(["DRAFT", "COMPLETED"]).optional().catch(undefined),
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
  sintomi: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
} as const;

// Esegue la query paginata. Esclude sempre le schede nel cestino (deletedAt != null).
export async function listSchede(params: SchedaListParams): Promise<SchedaListResult> {
  const { q, status, page, pageSize, sort, dir } = params;

  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { cognome: { contains: q, mode: "insensitive" as const } },
            { nome: { contains: q, mode: "insensitive" as const } },
            { riferimento: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
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
    sintomi: normalizeSintomi(r.sintomi),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
  }));

  return { items, total, page, pageSize };
}
