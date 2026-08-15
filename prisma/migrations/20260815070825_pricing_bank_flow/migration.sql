-- AlterTable
ALTER TABLE "BankApplication" ADD COLUMN     "detailsVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "detailsVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "enteredAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PricingConfig" ADD COLUMN     "serviceFeeCentsForProfit" INTEGER NOT NULL DEFAULT 4900,
ADD COLUMN     "serviceFeeCentsLLC" INTEGER NOT NULL DEFAULT 4900,
ADD COLUMN     "serviceFeeCentsNonProfit" INTEGER NOT NULL DEFAULT 4900;
