import { createElement, type ReactElement } from "react";
import { NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { db } from "@/lib/db";
import { etichettaScheda, toContent } from "@/lib/scheda";
import { SchedaPdf, type SchedaPdfMeta } from "@/lib/pdf/SchedaPdf";
import { ApiError, guard, handleApiError } from "@/lib/apiHelpers";

// @react-pdf/renderer richiede il runtime Node (non edge).
export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// Nome file "sicuro" per Content-Disposition.
function safeFilename(label: string): string {
  const base = label.replace(/[^\p{L}\p{N}._-]+/gu, "_").replace(/^_+|_+$/g, "");
  return `${base || "scheda"}.pdf`;
}

export async function GET(req: Request, { params }: Params) {
  const blocked = await guard(req, "scheda:pdf", 60);
  if (blocked) return blocked;

  try {
    const { id } = await params;
    const row = await db.scheda.findFirst({
      where: { id, deletedAt: null },
      include: { completedBy: { select: { name: true, email: true } } },
    });
    if (!row) throw new ApiError(404, "Scheda non trovata");

    const content = toContent(row);
    const etichetta = etichettaScheda(content);
    const titolo = etichetta === "(senza riferimento)" ? "Scheda di pronto soccorso" : etichetta;

    let completata: string | null = null;
    let statoLabel = "Bozza";
    if (row.status === "COMPLETED" && row.completedAt) {
      const data = format(row.completedAt, "d MMMM yyyy, HH:mm", { locale: it });
      const autore = row.completedBy ? row.completedBy.name || row.completedBy.email : null;
      completata = `Completata il ${data}${autore ? ` da ${autore}` : ""}`;
      statoLabel = "Completata";
    } else {
      statoLabel = `Bozza · aggiornata il ${format(row.updatedAt, "d MMMM yyyy, HH:mm", { locale: it })}`;
    }

    const meta: SchedaPdfMeta = { titolo, statoLabel, completata };
    // renderToBuffer è tipizzato per ricevere direttamente un <Document>; SchedaPdf
    // lo incapsula, perciò il cast è sicuro (a runtime restituisce un Document).
    const element = createElement(SchedaPdf, {
      content,
      meta,
    }) as unknown as ReactElement<DocumentProps>;
    const buffer = await renderToBuffer(element);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename(etichetta)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
