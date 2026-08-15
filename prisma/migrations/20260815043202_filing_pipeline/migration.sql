-- CreateEnum
CREATE TYPE "FilingStatus" AS ENUM ('READY', 'SUBMITTED', 'FILED', 'REJECTED', 'NEEDS_ATTENTION');

-- AlterTable
ALTER TABLE "Formation" ADD COLUMN     "filedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "State" ADD COLUMN     "filingProvider" TEXT NOT NULL DEFAULT 'ops';

-- CreateTable
CREATE TABLE "Filing" (
    "id" TEXT NOT NULL,
    "formationId" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "type" "FormationType" NOT NULL,
    "status" "FilingStatus" NOT NULL DEFAULT 'READY',
    "provider" TEXT NOT NULL DEFAULT 'ops',
    "confirmationNumber" TEXT,
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "filedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "notes" TEXT,
    "history" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Filing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Filing_status_idx" ON "Filing"("status");

-- CreateIndex
CREATE INDEX "Filing_stateCode_idx" ON "Filing"("stateCode");

-- AddForeignKey
ALTER TABLE "Filing" ADD CONSTRAINT "Filing_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Filing" ADD CONSTRAINT "Filing_stateCode_fkey" FOREIGN KEY ("stateCode") REFERENCES "State"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
