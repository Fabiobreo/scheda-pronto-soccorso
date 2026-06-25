import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { ApiError, guard, handleApiError } from "@/lib/apiHelpers";

type Params = { params: Promise<{ id: string }> };

// Ripristina una scheda dal cestino (annulla il soft-delete). Solo ADMIN.
export async function POST(req: Request, { params }: Params) {
  const g = await guard(req, "scheda:restore", 30, { minRole: "ADMIN" });
  if (!g.ok) return g.response;

  try {
    const { id } = await params;
    const { auth } = g;

    await db.$transaction(async (tx) => {
      const result = await tx.scheda.updateMany({
        where: { id, deletedAt: { not: null } },
        data: { deletedAt: null, deletedById: null },
      });
      if (result.count === 0) throw new ApiError(404, "Scheda non trovata nel cestino");
      await recordAudit(tx, {
        entity: "Scheda",
        entityId: id,
        action: "RESTORE",
        userId: auth.userId,
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
