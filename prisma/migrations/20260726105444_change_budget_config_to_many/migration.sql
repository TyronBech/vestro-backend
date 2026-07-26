-- DropIndex
DROP INDEX "BudgetConfig_userId_key";

-- AlterTable
ALTER TABLE "BudgetConfig" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Primary Job';
