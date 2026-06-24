import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SchedaCreateSchema } from "@/lib/schemas/scheda";
import { getAuthContext } from "@/lib/apiAuth";
import { recordAudit } from "@/lib/audit";
import { listSchede, parseSchedaListParams } from "@/lib/schedaQueries";
import { guard, handleApiError, parseJsonBody } from "@/lib/apiHelpers";

export async function GET(req: Request) {
  const blocked = await guard(req, "schede:list", 120);
  if (blocked) return blocked;

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
  const blocked = await guard(req, "schede:create", 30);
  if (blocked) return blocked;

  try {
    const auth = await getAuthContext(req);
    const body = await parseJsonBody(req);
    const data = SchedaCreateSchema.parse(body);

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
