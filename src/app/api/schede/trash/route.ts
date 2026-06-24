import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { etichettaScheda } from "@/lib/scheda";
import { guard, handleApiError } from "@/lib/apiHelpers";

// Lista delle schede nel cestino (soft-deleted). Solo ADMIN.
// Nota: il segmento statico "trash" ha precedenza sul dinamico "[id]".
export async function GET(req: Request) {
  const blocked = await guard(req, "schede:trash", 60, { minRole: "ADMIN" });
  if (blocked) return blocked;

  try {
    const rows = await db.scheda.findMany({
      where: { deletedAt: { not: null } },
      select: {
        id: true,
        riferimento: true,
        cognome: true,
        nome: true,
        status: true,
        deletedAt: true,
      },
      orderBy: { deletedAt: "desc" },
    });

    const items = rows.map((r) => ({
      id: r.id,
      etichetta: etichettaScheda(r),
      status: r.status,
      deletedAt: r.deletedAt!.toISOString(),
    }));

    return NextResponse.json(items);
  } catch (error) {
    return handleApiError(error);
  }
}
