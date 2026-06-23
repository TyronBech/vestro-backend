-- CreateTable
CREATE TABLE "CoreNetwork" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "macroAssetId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoreNetwork_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CoreNetwork" ADD CONSTRAINT "CoreNetwork_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoreNetwork" ADD CONSTRAINT "CoreNetwork_macroAssetId_fkey" FOREIGN KEY ("macroAssetId") REFERENCES "MacroAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoreNetwork" ADD CONSTRAINT "CoreNetwork_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CoreNetwork"("id") ON DELETE SET NULL ON UPDATE CASCADE;
