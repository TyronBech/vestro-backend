-- CreateEnum
CREATE TYPE "CardBrand" AS ENUM ('MASTERCARD', 'VISA');

-- AlterTable
ALTER TABLE "CreditCard" ADD COLUMN     "cardBrand" "CardBrand" NOT NULL DEFAULT 'VISA';

-- AlterTable
ALTER TABLE "MacroAsset" ADD COLUMN     "cardBrand" "CardBrand" NOT NULL DEFAULT 'VISA';
