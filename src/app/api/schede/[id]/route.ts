import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { SchedaUpdateSchema } from "@/lib/schemas/scheda";
import { ApiError, guard, handleApiError, parseJsonBody } from "@/lib/apiHelpers";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const blocked = await guard(req, "scheda:get", 120);
  if (blocked) return blocked;

  try {
    const { id } = await params;
    const scheda = await db.scheda.findUnique({ where: { id } });
    if (!scheda) throw new ApiError(404, "Scheda non trovata");
    return NextResponse.json(scheda);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request, { params }: Params) {
  // Limite più alto: l'autosave (debounced ~1s) può generare molte PUT al minuto.
  const blocked = await guard(req, "scheda:update", 180);
  if (blocked) return blocked;

  try {
    const { id } = await params;
    const body = await parseJsonBody(req);
    const parsed = SchedaUpdateSchema.parse(body);

    const existing = await db.scheda.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!existing) throw new ApiError(404, "Scheda non trovata");
    // Una scheda completata è in sola lettura: nessuna modifica, nessuna riapertura.
    if (existing.status === "COMPLETED") {
      throw new ApiError(409, "La scheda è completata e non è più modificabile");
    }

    const { status, ...content } = parsed;
    const data: Prisma.SchedaUpdateInput = { ...content };
    // Unica transizione consentita: DRAFT -> COMPLETED.
    if (status === "COMPLETED") {
      data.status = "COMPLETED";
      data.completedAt = new Date();
    }

    const updated = await db.scheda.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const blocked = await guard(req, "scheda:delete", 30);
  if (blocked) return blocked;

  try {
    const { id } = await params;
    await db.scheda.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
