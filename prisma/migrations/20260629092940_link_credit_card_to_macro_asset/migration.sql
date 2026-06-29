-- AlterTable
ALTER TABLE "CreditCard" ADD COLUMN     "macroAssetId" TEXT;

-- AddForeignKey
ALTER TABLE "CreditCard" ADD CONSTRAINT "CreditCard_macroAssetId_fkey" FOREIGN KEY ("macroAssetId") REFERENCES "MacroAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
