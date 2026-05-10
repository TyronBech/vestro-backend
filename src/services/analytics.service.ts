import { Result, ok, err } from '../utils/result';
import { TransactionRepositoryPg } from '../infrastructure/db/transaction.repository.pg';
import { TransactionFlow, TransactionType } from '@prisma/client';
import { analyticsFilterSchema } from '../presentation/schemas/analytics.schema';
import { z } from 'zod';

export type AnalyticsFilterInput = z.infer<typeof analyticsFilterSchema>['query'];
import { logger } from '../utils/logger';

const transactionRepo = new TransactionRepositoryPg();

export class AnalyticsService {
  static async getGeneralReport(userId: string, input: AnalyticsFilterInput): Promise<Result<any, 'DB_ERROR'>> {
    try {
      logger.info(`Executing getGeneralReport service for userId: ${userId}`);
      let startDate = new Date();
      let endDate = new Date();

      if (input.startDate && input.endDate) {
        startDate = new Date(input.startDate);
        endDate = new Date(input.endDate);
      } else {
        const now = new Date();
        if (input.period === 'day') {
          startDate.setHours(0, 0, 0, 0);
        } else if (input.period === 'week') {
          startDate.setDate(now.getDate() - now.getDay());
          startDate.setHours(0, 0, 0, 0);
        } else if (input.period === 'month') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (input.period === 'year') {
          startDate = new Date(now.getFullYear(), 0, 1);
        }
      }

      const transactions = await transactionRepo.findByUserIdInDateRange(userId, startDate, endDate);

      let totalIncome = 0;
      let totalExpense = 0;
      let totalSavings = 0;
      let totalInvestment = 0;

      const categoryBreakdown: Record<string, { name: string; amount: number; type: string }> = {};

      for (const t of transactions) {
        if (t.flow === TransactionFlow.INFLOW) totalIncome += t.amount;
        if (t.flow === TransactionFlow.OUTFLOW) totalExpense += t.amount;
        if (t.type === TransactionType.SAVINGS) totalSavings += t.amount;
        if (t.type === TransactionType.INVESTMENT) totalInvestment += t.amount;

        if (!categoryBreakdown[t.categoryId]) {
          categoryBreakdown[t.categoryId] = { name: t.category.name, amount: 0, type: t.type };
        }
        categoryBreakdown[t.categoryId]!.amount += t.amount;
      }

      logger.info(`getGeneralReport service completed successfully for userId: ${userId}`);
      return ok({
        period: input.period,
        startDate,
        endDate,
        totalIncome,
        totalExpense,
        totalSavings,
        totalInvestment,
        categoryBreakdown: Object.values(categoryBreakdown),
      });
    } catch (error) {
      logger.error(`getGeneralReport service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }
}
