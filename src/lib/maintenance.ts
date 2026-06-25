import { db } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { RETENTION } from "@/lib/config";

export interface RetentionResult {
  schedePurged: number;
  auditPurged: number;
}

// Applica la politica di conservazione: elimina definitivamente le schede nel
// cestino oltre la soglia e le voci di audit più vecchie della soglia.
// Chiamata dal cron (vedi /api/maintenance/purge). Idempotente.
export async function runRetention(now: Date = new Date()): Promise<RetentionResult> {
  const trashCutoff = new Date(now.getTime() - RETENTION.trashDays * 24 * 60 * 60 * 1000);
  const auditCutoff = new Date(now.getTime() - RETENTION.auditDays * 24 * 60 * 60 * 1000);

  // Hard-delete delle schede nel cestino oltre la soglia.
  const schede = await db.scheda.deleteMany({
    where: { deletedAt: { not: null, lt: trashCutoff } },
  });

  // Registra una voce di audit riepilogativa (azione di sistema, userId null)
  // PRIMA di purgare l'audit, così non viene rimossa nello stesso giro.
  if (schede.count > 0) {
    await recordAudit(db, {
      entity: "Scheda",
      entityId: "maintenance",
      action: "PURGE",
      userId: null,
      meta: { autoRetention: true, count: schede.count, trashDays: RETENTION.trashDays },
    });
  }

  // Purge delle voci di audit oltre la soglia di conservazione.
  const audit = await db.auditLog.deleteMany({
    where: { at: { lt: auditCutoff } },
  });

  return { schedePurged: schede.count, auditPurged: audit.count };
}
