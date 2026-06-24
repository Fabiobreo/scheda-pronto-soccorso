import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { SchedaUpdateSchema } from "@/lib/schemas/scheda";
import { getAuthContext } from "@/lib/apiAuth";
import { recordAudit } from "@/lib/audit";
import { hasMinRole } from "@/lib/roles";
import { campiMancantiPerCompletamento, toContent } from "@/lib/scheda";
import { ApiError, guard, handleApiError, parseJsonBody } from "@/lib/apiHelpers";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const blocked = await guard(req, "scheda:get", 120);
  if (blocked) return blocked;

  try {
    const { id } = await params;
    const scheda = await db.scheda.findFirst({ where: { id, deletedAt: null } });
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
    const auth = await getAuthContext(req);
    const body = await parseJsonBody(req);
    const parsed = SchedaUpdateSchema.parse(body);

    const { status, expectedUpdatedAt, ...content } = parsed;
    // Unchecked: updateMany accetta solo scalari (niente relazioni nested), quindi
    // l'attore va impostato con la FK scalare completedById, non con `connect`.
    const data: Prisma.SchedaUncheckedUpdateInput = { ...content };
    const completing = status === "COMPLETED";
    if (completing) {
      // Validazione clinica: la scheda è completabile solo se i campi minimi sono
      // presenti. Si valida lo stato FINALE (record corrente + modifiche in arrivo).
      const existing = await db.scheda.findFirst({ where: { id, deletedAt: null } });
      if (!existing) throw new ApiError(404, "Scheda non trovata");
      const merged = { ...toContent(existing), ...content };
      const missing = campiMancantiPerCompletamento(merged);
      if (missing.length > 0) {
        return NextResponse.json(
          { error: "Compila i campi obbligatori prima di completare", missing },
          { status: 422 }
        );
      }

      data.status = "COMPLETED";
      data.completedAt = new Date();
      if (auth.userId) data.completedById = auth.userId;
    }

    const newUpdatedAt = await db.$transaction(async (tx) => {
      // Happy path in un solo round-trip: aggiorna SOLO se ancora DRAFT, non eliminata
      // e (se fornito) con updatedAt invariato — controllo di concorrenza ottimistica.
      const where: Prisma.SchedaWhereInput = { id, status: "DRAFT", deletedAt: null };
      if (expectedUpdatedAt) where.updatedAt = new Date(expectedUpdatedAt);

      const result = await tx.scheda.updateMany({ where, data });
      if (result.count === 0) {
        const existing = await tx.scheda.findUnique({
          where: { id },
          select: { status: true, deletedAt: true },
        });
        if (!existing || existing.deletedAt) throw new ApiError(404, "Scheda non trovata");
        if (existing.status === "COMPLETED") {
          throw new ApiError(409, "La scheda è completata e non è più modificabile");
        }
        // È ancora DRAFT ma updatedAt non coincide: qualcuno l'ha modificata nel frattempo.
        throw new ApiError(
          409,
          "La scheda è stata modificata altrove. Ricarica la pagina per vedere i dati aggiornati."
        );
      }
      await recordAudit(tx, {
        entity: "Scheda",
        entityId: id,
        action: completing ? "COMPLETE" : "UPDATE",
        userId: auth.userId,
      });
      const fresh = await tx.scheda.findUnique({ where: { id }, select: { updatedAt: true } });
      return fresh!.updatedAt;
    });

    // Restituisce l'updatedAt ESATTO del DB: il client lo usa come prossimo token.
    return NextResponse.json({ updatedAt: newUpdatedAt.toISOString() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const blocked = await guard(req, "scheda:delete", 30);
  if (blocked) return blocked;

  try {
    const { id } = await params;
    const auth = await getAuthContext(req);
    // Hard-delete (purge) definitiva: solo ADMIN, dal cestino.
    const purge = new URL(req.url).searchParams.get("purge") === "1";

    if (purge) {
      if (!hasMinRole(auth.role, "ADMIN")) {
        throw new ApiError(403, "Solo un amministratore può eliminare definitivamente");
      }
      await db.$transaction(async (tx) => {
        await tx.scheda.delete({ where: { id } });
        await recordAudit(tx, {
          entity: "Scheda",
          entityId: id,
          action: "PURGE",
          userId: auth.userId,
        });
      });
      return new NextResponse(null, { status: 204 });
    }

    // Soft-delete (default): marca deletedAt; il record resta nel cestino.
    await db.$transaction(async (tx) => {
      const result = await tx.scheda.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date(), deletedById: auth.userId },
      });
      if (result.count === 0) throw new ApiError(404, "Scheda non trovata");
      await recordAudit(tx, {
        entity: "Scheda",
        entityId: id,
        action: "DELETE",
        userId: auth.userId,
      });
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
