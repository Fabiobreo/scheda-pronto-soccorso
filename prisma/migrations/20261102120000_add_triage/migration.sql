-- AlterTable
ALTER TABLE "Scheda" ADD COLUMN     "triage" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "triageRisultato" JSONB;
