import { PrismaClient } from "@prisma/client";

// Singleton: in dev Next ricarica i moduli ad ogni HMR, quindi conserviamo
// l'istanza su globalThis per non esaurire le connessioni al database.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
