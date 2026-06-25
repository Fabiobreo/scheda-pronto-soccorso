-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'EXPORT';
ALTER TYPE "AuditAction" ADD VALUE 'USER_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'USER_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'USER_DELETE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "forcePasswordChange" BOOLEAN NOT NULL DEFAULT false;
