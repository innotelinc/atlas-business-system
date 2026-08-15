-- CreateEnum
CREATE TYPE "FormationType" AS ENUM ('LLC', 'FOR_PROFIT', 'NON_PROFIT');

-- CreateEnum
CREATE TYPE "FormationStatus" AS ENUM ('DRAFT', 'NAME_CHECK', 'DOCUMENT_BUILD', 'SIGNED', 'PAYMENT_PENDING', 'PAID', 'FILED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENT', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "State" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sosSiteUrl" TEXT NOT NULL,
    "nameSearchUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "State_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "StateFee" (
    "id" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "type" "FormationType" NOT NULL,
    "stateFeeCents" INTEGER NOT NULL,
    "documentUrl" TEXT,
    "filingTime" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "sourceNote" TEXT,

    CONSTRAINT "StateFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "interval" TEXT,
    "stripePriceId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingConfig" (
    "id" TEXT NOT NULL DEFAULT 'single',
    "serviceFeeCents" INTEGER NOT NULL DEFAULT 4900,
    "competitorRetailCents" INTEGER NOT NULL DEFAULT 19900,
    "competitorName" TEXT NOT NULL DEFAULT 'leading online formation services',

    CONSTRAINT "PricingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Formation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "FormationType" NOT NULL,
    "stateCode" TEXT NOT NULL,
    "businessName" TEXT,
    "status" "FormationStatus" NOT NULL DEFAULT 'DRAFT',
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "stripeCheckoutId" TEXT,
    "stripeCustomerId" TEXT,
    "contractSignedAt" TIMESTAMP(3),
    "signature" TEXT,
    "analystReview" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "analystNotes" TEXT,
    "analystReviewedAt" TIMESTAMP(3),
    "portalAccess" BOOLEAN NOT NULL DEFAULT false,
    "stateFeeCents" INTEGER NOT NULL DEFAULT 0,
    "serviceFeeCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Formation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NameCheck" (
    "id" TEXT NOT NULL,
    "formationId" TEXT NOT NULL,
    "sosSearched" BOOLEAN NOT NULL DEFAULT false,
    "sosSearchUrl" TEXT,
    "sosResults" TEXT,
    "claimedAvailable" BOOLEAN NOT NULL DEFAULT false,
    "similarNames" TEXT,
    "checkedAt" TIMESTAMP(3),

    CONSTRAINT "NameCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "formationId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "pdfUrl" TEXT,
    "generatedAt" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credentials" (
    "id" TEXT NOT NULL,
    "formationId" TEXT NOT NULL,
    "ein" TEXT,
    "establishedDate" TIMESTAMP(3),
    "officers" JSONB,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,

    CONSTRAINT "Credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormationService" (
    "formationId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "FormationService_pkey" PRIMARY KEY ("formationId","serviceId")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "urlLabel" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistEntry" (
    "id" TEXT NOT NULL,
    "formationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "value" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankApplication" (
    "id" TEXT NOT NULL,
    "formationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'received',
    "businessName" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dob" TEXT,
    "ssn" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StateFee_stateCode_type_key" ON "StateFee"("stateCode", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Service_key_key" ON "Service"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Formation_stripeCheckoutId_key" ON "Formation"("stripeCheckoutId");

-- CreateIndex
CREATE UNIQUE INDEX "NameCheck_formationId_key" ON "NameCheck"("formationId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_formationId_key" ON "Document"("formationId");

-- CreateIndex
CREATE UNIQUE INDEX "Credentials_formationId_key" ON "Credentials"("formationId");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistEntry_formationId_itemId_key" ON "ChecklistEntry"("formationId", "itemId");

-- AddForeignKey
ALTER TABLE "StateFee" ADD CONSTRAINT "StateFee_stateCode_fkey" FOREIGN KEY ("stateCode") REFERENCES "State"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formation" ADD CONSTRAINT "Formation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formation" ADD CONSTRAINT "Formation_stateCode_fkey" FOREIGN KEY ("stateCode") REFERENCES "State"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NameCheck" ADD CONSTRAINT "NameCheck_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credentials" ADD CONSTRAINT "Credentials_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormationService" ADD CONSTRAINT "FormationService_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormationService" ADD CONSTRAINT "FormationService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistEntry" ADD CONSTRAINT "ChecklistEntry_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistEntry" ADD CONSTRAINT "ChecklistEntry_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ChecklistItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankApplication" ADD CONSTRAINT "BankApplication_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
