/*
  Warnings:

  - You are about to drop the `accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `banks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `goals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_bankId_fkey";

-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_userId_fkey";

-- DropForeignKey
ALTER TABLE "goals" DROP CONSTRAINT "goals_userId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_userId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_accountId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_goalId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_userId_fkey";

-- DropTable
DROP TABLE "accounts";

-- DropTable
DROP TABLE "banks";

-- DropTable
DROP TABLE "categories";

-- DropTable
DROP TABLE "goals";

-- DropTable
DROP TABLE "notifications";

-- DropTable
DROP TABLE "transactions";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "AccountType";

-- DropEnum
DROP TYPE "GoalStatus";

-- DropEnum
DROP TYPE "NotificationType";

-- DropEnum
DROP TYPE "TransactionFlow";

-- DropEnum
DROP TYPE "TransactionType";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "twoFactorSecret" TEXT,
    "is2FAEnabled" BOOLEAN NOT NULL DEFAULT false,
    "biometricsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "biometricKeyHash" TEXT,
    "panicModeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "spendingLimit" DOUBLE PRECISION,
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "netSalary" DOUBLE PRECISION NOT NULL,
    "needsRate" DOUBLE PRECISION NOT NULL DEFAULT 0.50,
    "wantsRate" DOUBLE PRECISION NOT NULL DEFAULT 0.30,
    "savingsRate" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "investmentsRate" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "cashAmount" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardName" TEXT NOT NULL,
    "creditLimit" DOUBLE PRECISION NOT NULL,
    "statementCutoffDay" INTEGER NOT NULL,
    "paymentDueDay" INTEGER NOT NULL,
    "unbilledSpend" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "midCyclePaid" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SweepLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "targetVault" TEXT NOT NULL,
    "notes" TEXT,
    "sweptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SweepLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MacroAsset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "targetGoal" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MacroAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetConfig_userId_key" ON "BudgetConfig"("userId");

-- AddForeignKey
ALTER TABLE "BudgetConfig" ADD CONSTRAINT "BudgetConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCard" ADD CONSTRAINT "CreditCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SweepLog" ADD CONSTRAINT "SweepLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MacroAsset" ADD CONSTRAINT "MacroAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
