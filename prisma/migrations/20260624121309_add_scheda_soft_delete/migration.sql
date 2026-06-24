-- AlterTable
ALTER TABLE "Scheda" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Scheda_status_deletedAt_updatedAt_idx" ON "Scheda"("status", "deletedAt", "updatedAt");
