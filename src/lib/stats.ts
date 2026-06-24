import { db } from "@/lib/db";
import { normalizeSintomi } from "@/lib/scheda";
import { CATEGORIE_SINTOMI } from "@/lib/sintomi";
import { LABEL_PER_CODICE } from "@/lib/patologie";

// Statistiche per la dashboard. Calcolate in memoria a partire dalle schede non
// eliminate: i volumi attesi (uso reparto) rendono superfluo l'uso di query SQL
// dedicate; se la mole crescesse molto, si passerebbe a groupBy / raw query.

export interface ContatoreEtichetta {
  label: string;
  count: number;
}

export interface GiornoConteggio {
  giorno: string; // ISO date (yyyy-mm-dd)
  count: number;
}

export interface DashboardStats {
  totale: number;
  bozze: number;
  completate: number;
  perGiorno: GiornoConteggio[]; // ultimi 14 giorni
  topPatologie: ContatoreEtichetta[];
  topSintomi: ContatoreEtichetta[];
}

const GIORNI = 14;

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const rows = await db.scheda.findMany({
    where: { deletedAt: null },
    select: { status: true, createdAt: true, patologie: true, sintomi: true },
  });

  let bozze = 0;
  let completate = 0;

  // Bucket ultimi 14 giorni (inizializzati a 0 per avere la serie completa).
  const giorni = new Map<string, number>();
  for (let i = GIORNI - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    giorni.set(isoDay(d), 0);
  }

  const patologieTally = new Map<string, number>();
  const sintomiTally = new Map<string, number>();
  const sintomiLabel = new Map(CATEGORIE_SINTOMI.map((c) => [c.id, c.label] as const));

  for (const r of rows) {
    if (r.status === "COMPLETED") completate++;
    else bozze++;

    const day = isoDay(r.createdAt);
    if (giorni.has(day)) giorni.set(day, giorni.get(day)! + 1);

    const patologie = Array.isArray(r.patologie) ? (r.patologie as unknown[]) : [];
    for (const code of patologie) {
      if (typeof code === "string") patologieTally.set(code, (patologieTally.get(code) ?? 0) + 1);
    }

    const sintomi = normalizeSintomi(r.sintomi);
    for (const [catId, sel] of Object.entries(sintomi)) {
      if (sel.codici.length > 0 || sel.note.trim().length > 0) {
        sintomiTally.set(catId, (sintomiTally.get(catId) ?? 0) + 1);
      }
    }
  }

  const topN = (map: Map<string, number>, label: (k: string) => string): ContatoreEtichetta[] =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, count]) => ({ label: label(k), count }));

  return {
    totale: rows.length,
    bozze,
    completate,
    perGiorno: [...giorni.entries()].map(([giorno, count]) => ({ giorno, count })),
    topPatologie: topN(patologieTally, (k) => `${k} ${LABEL_PER_CODICE[k] ?? "?"}`),
    topSintomi: topN(sintomiTally, (k) => sintomiLabel.get(k) ?? k),
  };
}
