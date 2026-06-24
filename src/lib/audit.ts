import type { AuditAction, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// Client Prisma: l'istanza globale o un client di transazione (così l'audit può
// essere scritto nella STESSA transazione dell'operazione che traccia).
type PrismaClientLike = typeof db | Prisma.TransactionClient;

export interface AuditInput {
  entity: "Scheda" | "User";
  entityId: string;
  action: AuditAction;
  userId?: string | null;
  meta?: Prisma.InputJsonValue;
}

// Scrive una voce nel log immutabile. Append-only: non esiste update/delete.
export async function recordAudit(client: PrismaClientLike, input: AuditInput): Promise<void> {
  await client.auditLog.create({
    data: {
      entity: input.entity,
      entityId: input.entityId,
      action: input.action,
      userId: input.userId ?? null,
      meta: input.meta,
    },
  });
}
