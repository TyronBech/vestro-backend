-- CreateEnum
CREATE TYPE "LuxuryCategory" AS ENUM ('TECH', 'GADGETS', 'GAMING', 'APPAREL', 'DINING', 'LIFESTYLE', 'OTHER');

-- CreateEnum
CREATE TYPE "LuxuryPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "LuxuryStatus" AS ENUM ('WISHLIST', 'SAVING', 'PURCHASED', 'CANCELLED');

-- CreateTable
CREATE TABLE "LuxuryItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "LuxuryCategory" NOT NULL DEFAULT 'OTHER',
    "priceCents" INTEGER NOT NULL,
    "description" TEXT,
    "priority" "LuxuryPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "LuxuryStatus" NOT NULL DEFAULT 'WISHLIST',
    "targetDate" TIMESTAMP(3),
    "purchasedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "cashFlowId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LuxuryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LuxuryItem_cashFlowId_key" ON "LuxuryItem"("cashFlowId");

-- CreateIndex
CREATE INDEX "LuxuryItem_userId_idx" ON "LuxuryItem"("userId");

-- CreateIndex
CREATE INDEX "LuxuryItem_userId_status_idx" ON "LuxuryItem"("userId", "status");

-- AddForeignKey
ALTER TABLE "LuxuryItem" ADD CONSTRAINT "LuxuryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LuxuryItem" ADD CONSTRAINT "LuxuryItem_cashFlowId_fkey" FOREIGN KEY ("cashFlowId") REFERENCES "CashFlow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
