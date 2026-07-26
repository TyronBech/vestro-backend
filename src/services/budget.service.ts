import { Result, ok, err } from '../utils/result';
import { BudgetConfigRepositoryPg } from '../infrastructure/db/budget-config.repository.pg';
import { MacroAssetRepositoryPg } from '../infrastructure/db/macro-asset.repository.pg';
import { logger } from '../utils/logger';

const budgetRepo = new BudgetConfigRepositoryPg();
const macroAssetRepo = new MacroAssetRepositoryPg();

/** Shape of each routing instruction in the Payday Guillotine output. */
interface RoutingInstruction {
  label: string;
  target: string;
  amount: number;
  description: string;
}

/** Full output of Pipeline A — Payday Guillotine. */
interface PaydaySplitResult {
  netPaycheck: number;
  breakdown: {
    needs: number;
    wants: number;
    savings: number;
    investments: number;
  };
  halfRent: number;
  billsCash: number;
  routingInstructions: RoutingInstruction[];
}

export class BudgetService {
  /**
   * Fetches all budget configs for a user.
   * @param userId Authenticated user's ID from JWT
   */
  static async getBudgetConfigs(
    userId: string,
  ): Promise<Result<any, 'DB_ERROR'>> {
    try {
      logger.info(`Executing getBudgetConfigs service for userId: ${userId}`);
      const configs = await budgetRepo.findAllByUserId(userId);
      logger.info(`getBudgetConfigs service completed successfully for userId: ${userId}`);
      return ok(configs);
    } catch (error) {
      logger.error(`getBudgetConfigs service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Fetches a specific budget config by ID for a user.
   * @param userId Authenticated user's ID from JWT
   * @param configId BudgetConfig ID
   */
  static async getBudgetConfigById(
    userId: string,
    configId: string,
  ): Promise<Result<any, 'NOT_FOUND' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing getBudgetConfigById service for userId: ${userId}, configId: ${configId}`);
      const config = await budgetRepo.findById(configId, userId);
      if (!config) {
        logger.warn(`getBudgetConfigById: config not found for userId ${userId}, configId ${configId}`);
        return err('NOT_FOUND');
      }
      logger.info(`getBudgetConfigById completed successfully for userId: ${userId}, configId: ${configId}`);
      return ok(config);
    } catch (error) {
      logger.error(`getBudgetConfigById DB_ERROR for userId ${userId}, configId ${configId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Fetches the primary/first budget config for a user (backward compatible).
   * @param userId Authenticated user's ID from JWT
   */
  static async getBudgetConfig(
    userId: string,
  ): Promise<Result<any, 'DB_ERROR'>> {
    try {
      logger.info(`Executing getBudgetConfig service for userId: ${userId}`);
      const config = await budgetRepo.findByUserId(userId);
      logger.info(`getBudgetConfig service completed successfully for userId: ${userId}`);
      return ok(config);
    } catch (error) {
      logger.error(`getBudgetConfig service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Creates a new budget config for a user.
   * Validates that allocation rates sum to 1.0 before persisting.
   * @param userId Authenticated user's ID from JWT
   * @param data Budget config fields
   */
  static async createBudgetConfig(
    userId: string,
    data: {
      name?: string;
      netSalary: number;
      needsRate: number;
      wantsRate: number;
      savingsRate: number;
      investmentsRate: number;
      cashAmount: number;
    },
  ): Promise<Result<any, 'INVALID_RATES' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing createBudgetConfig service for userId: ${userId}`);

      const totalRate = data.needsRate + data.wantsRate + data.savingsRate + data.investmentsRate;
      if (Math.abs(totalRate - 1.0) > 0.001) {
        logger.warn(`createBudgetConfig failed: Rates sum to ${totalRate}, expected 1.0 for userId: ${userId}`);
        return err('INVALID_RATES');
      }

      const config = await budgetRepo.create(userId, {
        name: data.name || 'Primary Job',
        netSalary: data.netSalary,
        needsRate: data.needsRate,
        wantsRate: data.wantsRate,
        savingsRate: data.savingsRate,
        investmentsRate: data.investmentsRate,
        cashAmount: data.cashAmount,
      });

      logger.info(`createBudgetConfig service completed successfully for userId: ${userId}, configId: ${config.id}`);
      return ok(config);
    } catch (error) {
      logger.error(`createBudgetConfig service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Updates an existing budget config by ID for a user.
   * @param userId Authenticated user's ID from JWT
   * @param configId BudgetConfig ID
   * @param data Partial budget config fields
   */
  static async updateBudgetConfig(
    userId: string,
    configId: string,
    data: {
      name?: string;
      netSalary?: number;
      needsRate?: number;
      wantsRate?: number;
      savingsRate?: number;
      investmentsRate?: number;
      cashAmount?: number;
    },
  ): Promise<Result<any, 'NOT_FOUND' | 'INVALID_RATES' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing updateBudgetConfig service for userId: ${userId}, configId: ${configId}`);

      const existing = await budgetRepo.findById(configId, userId);
      if (!existing) {
        logger.warn(`updateBudgetConfig: config not found for userId ${userId}, configId ${configId}`);
        return err('NOT_FOUND');
      }

      const needsRate = data.needsRate ?? existing.needsRate;
      const wantsRate = data.wantsRate ?? existing.wantsRate;
      const savingsRate = data.savingsRate ?? existing.savingsRate;
      const investmentsRate = data.investmentsRate ?? existing.investmentsRate;

      const totalRate = needsRate + wantsRate + savingsRate + investmentsRate;
      if (Math.abs(totalRate - 1.0) > 0.001) {
        logger.warn(`updateBudgetConfig failed: Rates sum to ${totalRate}, expected 1.0 for userId: ${userId}`);
        return err('INVALID_RATES');
      }

      const updated = await budgetRepo.update(configId, userId, data);
      logger.info(`updateBudgetConfig service completed successfully for userId: ${userId}, configId: ${configId}`);
      return ok(updated);
    } catch (error) {
      logger.error(`updateBudgetConfig service DB_ERROR for userId ${userId}, configId ${configId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Deletes a budget config by ID for a user.
   * @param userId Authenticated user's ID from JWT
   * @param configId BudgetConfig ID
   */
  static async deleteBudgetConfig(
    userId: string,
    configId: string,
  ): Promise<Result<any, 'NOT_FOUND' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing deleteBudgetConfig service for userId: ${userId}, configId: ${configId}`);

      const existing = await budgetRepo.findById(configId, userId);
      if (!existing) {
        logger.warn(`deleteBudgetConfig: config not found for userId ${userId}, configId ${configId}`);
        return err('NOT_FOUND');
      }

      const deleted = await budgetRepo.delete(configId, userId);
      logger.info(`deleteBudgetConfig service completed successfully for userId: ${userId}, configId: ${configId}`);
      return ok(deleted);
    } catch (error) {
      logger.error(`deleteBudgetConfig service DB_ERROR for userId ${userId}, configId ${configId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Creates or updates the budget config for a user (backward compatible).
   * Validates that allocation rates sum to 1.0 before persisting.
   * @param userId Authenticated user's ID from JWT
   * @param data Budget config fields
   */
  static async upsertBudgetConfig(
    userId: string,
    data: {
      name?: string;
      netSalary: number;
      needsRate: number;
      wantsRate: number;
      savingsRate: number;
      investmentsRate: number;
      cashAmount: number;
    },
  ): Promise<Result<any, 'INVALID_RATES' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing upsertBudgetConfig service for userId: ${userId}`);

      const totalRate = data.needsRate + data.wantsRate + data.savingsRate + data.investmentsRate;
      if (Math.abs(totalRate - 1.0) > 0.001) {
        logger.warn(`upsertBudgetConfig failed: Rates sum to ${totalRate}, expected 1.0 for userId: ${userId}`);
        return err('INVALID_RATES');
      }

      const primary = await budgetRepo.findByUserId(userId);
      let config;
      if (primary) {
        config = await budgetRepo.update(primary.id, userId, data);
      } else {
        config = await budgetRepo.create(userId, {
          name: data.name || 'Primary Job',
          ...data,
        });
      }
      logger.info(`upsertBudgetConfig service completed successfully for userId: ${userId}`);
      return ok(config);
    } catch (error) {
      logger.error(`upsertBudgetConfig service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Pipeline A — Payday Guillotine.
   *
   * Converts a raw paycheck into explicit routing instructions using a
   * specified or primary budget config (50/30/10/10 split by default).
   *
   * @param userId Authenticated user's ID from JWT
   * @param netPaycheck The net paycheck amount to split
   * @param configId Optional specific budget config ID
   */
  static async calculatePaydaySplit(
    userId: string,
    netPaycheck: number,
    configId?: string,
  ): Promise<Result<PaydaySplitResult, 'CONFIG_NOT_FOUND' | 'INSUFFICIENT_NEEDS' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing calculatePaydaySplit service for userId: ${userId}, netPaycheck: ${netPaycheck}, configId: ${configId}`);

      const config = configId
        ? await budgetRepo.findById(configId, userId)
        : await budgetRepo.findByUserId(userId);

      if (!config) {
        logger.warn(`calculatePaydaySplit failed: No budget config for userId: ${userId}`);
        return err('CONFIG_NOT_FOUND');
      }

      // Apply the allocation split
      const needs = netPaycheck * config.needsRate;
      const wants = netPaycheck * config.wantsRate;
      const savings = netPaycheck * config.savingsRate;
      const investments = netPaycheck * config.investmentsRate;

      // Half of monthly rent from Needs share
      const halfRent = config.cashAmount / 2;
      const billsCash = needs - halfRent;

      if (billsCash < 0) {
        logger.warn(`calculatePaydaySplit failed: Needs share (${needs}) is less than half-rent (${halfRent}) for userId: ${userId}`);
        return err('INSUFFICIENT_NEEDS');
      }

      const routingInstructions: RoutingInstruction[] = [
        {
          label: 'Half-Rent',
          target: 'LandBank',
          amount: halfRent,
          description: 'Retain in LandBank for rent.',
        },
        {
          label: 'Bills Cash',
          target: 'GoTyme CC Stash',
          amount: billsCash,
          description: 'Transfer to GoTyme CC Stash for bills.',
        },
        {
          label: 'Wants Sandbox',
          target: 'GoTyme Dashboard',
          amount: wants,
          description: 'Keep on GoTyme Dashboard for discretionary spending.',
        },
        {
          label: 'Safety Split',
          target: 'Maya Goals',
          amount: savings,
          description: 'Split into Maya Goals (Emergency Fund & ADV160).',
        },
        {
          label: 'Capital',
          target: 'GCash GInvest',
          amount: investments,
          description: 'Push to GCash GInvest Portal.',
        },
      ];

      logger.info(`calculatePaydaySplit service completed successfully for userId: ${userId}`);
      return ok({
        netPaycheck,
        breakdown: { needs, wants, savings, investments },
        halfRent,
        billsCash,
        routingInstructions,
      });
    } catch (error) {
      logger.error(`calculatePaydaySplit service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }
}
