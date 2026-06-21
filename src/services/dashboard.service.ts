import { Result, ok, err } from '../utils/result';
import { BudgetService } from './budget.service';
import { CreditCardService } from './credit-card.service';
import { MacroAssetService } from './macro-asset.service';
import { SweepService } from './sweep.service';
import { logger } from '../utils/logger';

/**
 * Dashboard service — consolidated pipeline state.
 *
 * Returns the unified state of all three pipelines:
 * - Pipeline A: Budget config + Payday Guillotine readiness
 * - Pipeline B: Credit Shield status
 * - Pipeline C: Sweep readiness
 * - Plus: current macro asset balances
 */
export class DashboardService {
  /**
   * Fetches all pipeline states in parallel for the dashboard view.
   * @param userId Authenticated user's ID from JWT
   */
  static async getDashboardData(userId: string): Promise<Result<any, 'DB_ERROR'>> {
    try {
      logger.info(`Executing getDashboardData service for userId: ${userId}`);

      // Run all independent pipeline queries in parallel
      const [budgetResult, shieldResult, assetsResult, sweepResult] = await Promise.all([
        BudgetService.getBudgetConfig(userId),
        CreditCardService.getCreditShieldStatus(userId),
        MacroAssetService.listAssets(userId),
        SweepService.getSweepReadiness(userId),
      ]);

      // If any pipeline fails, propagate the error
      if (!budgetResult.ok) return err('DB_ERROR');
      if (!shieldResult.ok) return err('DB_ERROR');
      if (!assetsResult.ok) return err('DB_ERROR');
      if (!sweepResult.ok) return err('DB_ERROR');

      // Compute total balance across all macro assets
      const totalBalance = assetsResult.value.reduce(
        (sum: number, asset: any) => sum + (asset.balance ?? 0),
        0,
      );

      logger.info(`getDashboardData service completed successfully for userId: ${userId}`);
      return ok({
        budgetConfig: budgetResult.value,
        creditShield: shieldResult.value,
        macroAssets: assetsResult.value,
        totalBalance,
        sweepReadiness: sweepResult.value,
      });
    } catch (error) {
      logger.error(`getDashboardData service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }
}
