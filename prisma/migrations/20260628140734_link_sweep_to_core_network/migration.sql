-- AlterTable
ALTER TABLE "SweepLog" ADD COLUMN     "coreNetworkId" TEXT;

-- AddForeignKey
ALTER TABLE "SweepLog" ADD CONSTRAINT "SweepLog_coreNetworkId_fkey" FOREIGN KEY ("coreNetworkId") REFERENCES "CoreNetwork"("id") ON DELETE SET NULL ON UPDATE CASCADE;
