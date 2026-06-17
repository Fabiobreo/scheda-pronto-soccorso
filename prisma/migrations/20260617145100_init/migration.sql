-- CreateEnum
CREATE TYPE "SchedaStatus" AS ENUM ('DRAFT', 'COMPLETED');

-- CreateTable
CREATE TABLE "Scheda" (
    "id" TEXT NOT NULL,
    "status" "SchedaStatus" NOT NULL DEFAULT 'DRAFT',
    "riferimento" TEXT NOT NULL DEFAULT '',
    "sintomi" JSONB NOT NULL DEFAULT '{}',
    "parametri" JSONB NOT NULL DEFAULT '[]',
    "anamnesi" TEXT NOT NULL DEFAULT '',
    "terapiaDomiciliare" TEXT NOT NULL DEFAULT '',
    "negaTerapiaDomiciliare" BOOLEAN NOT NULL DEFAULT false,
    "allergie" TEXT NOT NULL DEFAULT '',
    "negaAllergie" BOOLEAN NOT NULL DEFAULT false,
    "terapieSomministrate" JSONB NOT NULL DEFAULT '[]',
    "diario" JSONB NOT NULL DEFAULT '[]',
    "conclusioni" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Scheda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scheda_status_updatedAt_idx" ON "Scheda"("status", "updatedAt");
