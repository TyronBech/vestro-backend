import { Result, ok, err } from '../utils/result';
import { UserRepositoryPg } from '../infrastructure/db/user.repository.pg';
import { AccountRepositoryPg } from '../infrastructure/db/account.repository.pg';
import { TransactionRepositoryPg } from '../infrastructure/db/transaction.repository.pg';
import { TransactionFlow } from '@prisma/client';
import { logger } from '../utils/logger';

const userRepo = new UserRepositoryPg();
const accountRepo = new AccountRepositoryPg();
const transactionRepo = new TransactionRepositoryPg();

export class DashboardService {
  static async getDashboardData(userId: string): Promise<Result<any, 'DB_ERROR'>> {
    try {
      logger.info(`Executing getDashboardData service for userId: ${userId}`);
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Run all independent queries in parallel — no sequential round-trips
      const [user, accounts, transactions, recentTransactions] = await Promise.all([
        userRepo.findByIdSelect(userId, { spendingLimit: true }),
        accountRepo.findByUserId(userId),
        transactionRepo.findByUserIdInDateRange(userId, firstDayOfMonth, now),
        transactionRepo.findRecentByUserId(userId, 5),
      ]);

      const availableBudget = accounts.reduce((sum, acc) => sum + acc.balance, 0);

      const monthlySpent = transactions
        .filter((t: any) => t.flow === TransactionFlow.OUTFLOW)
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      const monthlyIncome = transactions
        .filter((t: any) => t.flow === TransactionFlow.INFLOW)
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      logger.info(`getDashboardData service completed successfully for userId: ${userId}`);
      return ok({
        availableBudget,
        monthlySpent,
        monthlyIncome,
        monthlyLimit: user?.spendingLimit ?? 0,
        recentTransactions,
      });
    } catch (error) {
      logger.error(`getDashboardData service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }
}
