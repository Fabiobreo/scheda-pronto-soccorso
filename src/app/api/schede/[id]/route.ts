import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { SchedaUpdateSchema } from "@/lib/schemas/scheda";
import { recordAudit } from "@/lib/audit";
import { hasMinRole } from "@/lib/roles";
import {
  CAMPI_TRIAGE,
  calcolaTriageScheda,
  campiMancantiPerCompletamento,
  toContent,
} from "@/lib/scheda";
import { schedaDetailSelect } from "@/lib/schedaQueries";
import { ApiError, guard, handleApiError, parseJsonBody } from "@/lib/apiHelpers";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const g = await guard(req, "scheda:get", 120);
  if (!g.ok) return g.response;

  try {
    const { id } = await params;
    const scheda = await db.scheda.findFirst({
      where: { id, deletedAt: null },
      select: schedaDetailSelect,
    });
    if (!scheda) throw new ApiError(404, "Scheda non trovata");
    return NextResponse.json(scheda);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request, { params }: Params) {
  // Limite più alto: l'autosave (debounced ~1s) può generare molte PUT al minuto.
  const g = await guard(req, "scheda:update", 180);
  if (!g.ok) return g.response;

  try {
    const { id } = await params;
    const { auth } = g;
    const body = await parseJsonBody(req);
    const parsed = SchedaUpdateSchema.parse(body);

    const { status, expectedUpdatedAt, ...content } = parsed;
    // Unchecked: updateMany accetta solo scalari (niente relazioni nested), quindi
    // l'attore va impostato con la FK scalare completedById, non con `connect`.
    const data: Prisma.SchedaUncheckedUpdateInput = { ...content };
    const completing = status === "COMPLETED";
    // Il risultato del triage si ricalcola se cambia un suo input (e sempre al
    // completamento, per congelarlo sullo stato finale).
    const ricalcolaTriage = completing || CAMPI_TRIAGE.some((k) => k in content);
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

      if (ricalcolaTriage) {
        // L'editor invia l'intero contenuto: in quel caso gli input sono già tutti
        // nel payload. Altrimenti si integrano con il record, letto nella stessa
        // transazione (se cambia nel frattempo, l'updateMany fallisce con 409).
        const { triage, coscienza, vieAeree, dataNascita, data: dataScheda } = content;
        let base: Parameters<typeof calcolaTriageScheda>[0] | null = null;
        if (
          triage &&
          coscienza !== undefined &&
          vieAeree !== undefined &&
          dataNascita !== undefined &&
          dataScheda !== undefined
        ) {
          base = { triage, coscienza, vieAeree, dataNascita, data: dataScheda };
        } else {
          const current = await tx.scheda.findFirst({ where, select: schedaDetailSelect });
          if (current) base = { ...toContent(current), ...content };
        }
        if (base) {
          const risultato = calcolaTriageScheda(base);
          // RisultatoTriage è un oggetto JSON puro (solo stringhe/numeri/array):
          // l'interfaccia TS non ha l'index signature richiesta da InputJsonValue.
          data.triageRisultato = risultato as unknown as Prisma.InputJsonValue;
        }
      }

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
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      String(error.meta?.constraint ?? "").includes("riferimento")
    ) {
      return NextResponse.json(
        { error: "Il riferimento è già utilizzato da un'altra scheda" },
        { status: 409 }
      );
    }
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const g = await guard(req, "scheda:delete", 30);
  if (!g.ok) return g.response;

  try {
    const { id } = await params;
    const { auth } = g;
    // Hard-delete (purge) definitiva: solo ADMIN, dal cestino.
    const purge = new URL(req.url).searchParams.get("purge") === "1";

    if (purge) {
      if (!hasMinRole(auth.role, "ADMIN")) {
        throw new ApiError(403, "Solo un amministratore può eliminare definitivamente");
      }
      await db.$transaction(async (tx) => {
        const result = await tx.scheda.deleteMany({ where: { id, deletedAt: { not: null } } });
        if (result.count === 0) throw new ApiError(404, "Scheda non trovata nel cestino");
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
