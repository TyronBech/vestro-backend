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
   * Fetches the budget config for a user.
   * Returns null in the value if no config exists yet.
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
   * Creates or updates the budget config for a user.
   * Validates that allocation rates sum to 1.0 before persisting.
   * @param userId Authenticated user's ID from JWT
   * @param data Budget config fields
   */
  static async upsertBudgetConfig(
    userId: string,
    data: {
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

      // Validate allocation rates sum to 1.0 (with floating-point tolerance)
      const totalRate = data.needsRate + data.wantsRate + data.savingsRate + data.investmentsRate;
      if (Math.abs(totalRate - 1.0) > 0.001) {
        logger.warn(`upsertBudgetConfig failed: Rates sum to ${totalRate}, expected 1.0 for userId: ${userId}`);
        return err('INVALID_RATES');
      }

      const config = await budgetRepo.upsertByUserId(userId, data);
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
   * Converts a raw paycheck into explicit routing instructions using the
   * user's budget config (50/30/10/10 split by default).
   *
   * Execution steps:
   * 1. Fetch cashAmount (half-monthly rent) from BudgetConfig.
   * 2. Apply the allocation rates to the incoming paycheck.
   * 3. Subtract half-rent from the Needs share; the remainder becomes bills cash.
   * 4. Return a step-by-step checklist for the mobile dashboard.
   *
   * @param userId Authenticated user's ID from JWT
   * @param netPaycheck The net paycheck amount to split
   */
  static async calculatePaydaySplit(
    userId: string,
    netPaycheck: number,
  ): Promise<Result<PaydaySplitResult, 'CONFIG_NOT_FOUND' | 'INSUFFICIENT_NEEDS' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing calculatePaydaySplit service for userId: ${userId}, netPaycheck: ${netPaycheck}`);

      const config = await budgetRepo.findByUserId(userId);
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
