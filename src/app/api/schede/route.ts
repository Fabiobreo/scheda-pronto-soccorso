import { NextResponse } from "next/server";
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

    const scheda = await db.$transaction(async (tx) => {
      const created = await tx.scheda.create({
        data: { ...data, createdById: auth.userId },
      });
      await recordAudit(tx, {
        entity: "Scheda",
        entityId: created.id,
        action: "CREATE",
        userId: auth.userId,
      });
      return created;
    });

    return NextResponse.json(scheda, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
