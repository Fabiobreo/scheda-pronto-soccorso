import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { SchedaCreateSchema } from "@/lib/schemas/scheda";
import { recordAudit } from "@/lib/audit";
import { listSchede, parseSchedaListParams } from "@/lib/schedaQueries";
import { guard, handleApiError, parseJsonBody } from "@/lib/apiHelpers";

export async function GET(req: Request) {
  const g = await guard(req, "schede:list", 120);
  if (!g.ok) return g.response;

  try {
    const raw = Object.fromEntries(new URL(req.url).searchParams.entries());
    const params = parseSchedaListParams(raw);
    const result = await listSchede(params);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  const g = await guard(req, "schede:create", 30);
  if (!g.ok) return g.response;

  try {
    const { auth } = g;
    const body = await parseJsonBody(req);
    const parsed = SchedaCreateSchema.parse(body);

    // Prefill data/ora di arrivo con il momento corrente se non forniti dal client.
    const now = new Date();
    const data = {
      data: now.toISOString().slice(0, 10), // yyyy-MM-dd
      oraArrivo: now.toTimeString().slice(0, 5), // HH:mm
      ...parsed,
    };

    // Retry loop: in caso di collisione sul riferimento (race condition tra richieste
    // concorrenti), si ricalcola il MAX sul DB aggiornato e si riprova. In condizioni
    // normali bastano 1-2 tentativi; 5 è un tetto conservativo.
    let scheda;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        scheda = await db.$transaction(async (tx) => {
          // Numero progressivo: massimo tra i riferimenti numerici esistenti + 1.
          // La regexp usa [0-9] e NON \d: in un template literal JS il backslash di "\d"
          // viene eliminato (escape non valido), così a Postgres arriverebbe "^d+$" che
          // non matcha nulla. {1,9} limita a 9 cifre per evitare l'overflow del CAST AS INTEGER.
          const [row] = await tx.$queryRaw<[{ max: number | null }]>`
            SELECT MAX(CAST(riferimento AS INTEGER)) AS max
            FROM "Scheda"
            WHERE riferimento ~ '^[0-9]{1,9}$' AND "deletedAt" IS NULL
          `;
          const nextRif = String((row.max ?? 0) + 1);

          const created = await tx.scheda.create({
            data: { ...data, riferimento: data.riferimento ?? nextRif, createdById: auth.userId },
          });
          await recordAudit(tx, {
            entity: "Scheda",
            entityId: created.id,
            action: "CREATE",
            userId: auth.userId,
          });
          return created;
        });
        break; // successo: esce dal loop
      } catch (err) {
        const isRiferimentoConflict =
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002" &&
          String(err.meta?.constraint ?? "").includes("riferimento");
        if (isRiferimentoConflict && attempt < 4) continue;
        throw err; // altri errori o tentativi esauriti → gestiti da handleApiError
      }
    }

    return NextResponse.json(scheda, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
