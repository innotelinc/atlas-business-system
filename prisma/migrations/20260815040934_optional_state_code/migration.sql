-- DropForeignKey
ALTER TABLE "Formation" DROP CONSTRAINT "Formation_stateCode_fkey";

-- AlterTable
ALTER TABLE "Formation" ALTER COLUMN "stateCode" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Formation" ADD CONSTRAINT "Formation_stateCode_fkey" FOREIGN KEY ("stateCode") REFERENCES "State"("code") ON DELETE SET NULL ON UPDATE CASCADE;
