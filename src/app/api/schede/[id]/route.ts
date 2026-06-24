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

    const { status, ...content } = parsed;
    const data: Prisma.SchedaUpdateInput = { ...content };
    // Unica transizione consentita: DRAFT -> COMPLETED.
    if (status === "COMPLETED") {
      data.status = "COMPLETED";
      data.completedAt = new Date();
    }

    // Happy path in un solo round-trip: aggiorna SOLO se ancora DRAFT.
    // (Una scheda COMPLETED è in sola lettura: niente modifiche né riapertura.)
    const result = await db.scheda.updateMany({ where: { id, status: "DRAFT" }, data });
    if (result.count === 0) {
      // Caso raro: distinguo 404 (inesistente) da 409 (già completata) con una sola lettura.
      const existing = await db.scheda.findUnique({ where: { id }, select: { status: true } });
      if (!existing) throw new ApiError(404, "Scheda non trovata");
      throw new ApiError(409, "La scheda è completata e non è più modificabile");
    }

    // Il client usa solo `res.ok`; restituiamo un body minimale (niente extra read).
    return NextResponse.json({ updatedAt: new Date().toISOString() });
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
