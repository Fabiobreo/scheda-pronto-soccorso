import { NextResponse } from "next/server";
import { runRetention } from "@/lib/maintenance";
import { logger } from "@/lib/logger";

// Job di manutenzione: applica la politica di conservazione (vedi RETENTION).
// Invocato dal cron di Vercel (vercel.json). NON passa da getAuthContext: è
// protetto dal segreto CRON_SECRET. Vercel inoltra `Authorization: Bearer <CRON_SECRET>`.
export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    logger.error("CRON_SECRET non configurato: job di retention disabilitato");
    return NextResponse.json({ error: "Non configurato" }, { status: 503 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  try {
    const result = await runRetention();
    logger.info("Retention eseguita", { ...result });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    logger.error("Errore durante la retention", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
