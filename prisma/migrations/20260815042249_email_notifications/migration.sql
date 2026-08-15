-- AlterTable
ALTER TABLE "Formation" ADD COLUMN     "analystEmailSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "einReminderCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastEinReminderAt" TIMESTAMP(3),
ADD COLUMN     "paymentEmailSent" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SentEmail" (
    "id" TEXT NOT NULL,
    "formationId" TEXT,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentEmail_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SentEmail" ADD CONSTRAINT "SentEmail_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
