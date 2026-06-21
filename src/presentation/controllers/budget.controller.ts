import { Response } from 'express';
import { BudgetService } from '../../services/budget.service';
import { logger } from '../../utils/logger';

export class BudgetController {
  /**
   * GET /budget
   * Fetches the authenticated user's budget config.
   */
  static async getBudgetConfig(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      logger.warn(`getBudgetConfig failed: Not authenticated`);
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`getBudgetConfig request received for user: ${req.user?.email}`);
    const result = await BudgetService.getBudgetConfig(userId);
    if (!result.ok) {
      logger.error(`getBudgetConfig failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(500).json({ errors: [{ code: result.error, message: 'Failed to load budget config' }] });
      return;
    }
    logger.info(`getBudgetConfig request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: result.value });
  }

  /**
   * PUT /budget
   * Creates or updates the authenticated user's budget config.
   */
  static async upsertBudgetConfig(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      logger.warn(`upsertBudgetConfig failed: Not authenticated`);
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`upsertBudgetConfig request received for user: ${req.user?.email}`);
    const result = await BudgetService.upsertBudgetConfig(userId, req.body);
    if (!result.ok) {
      const status = result.error === 'INVALID_RATES' ? 400 : 500;
      logger.error(`upsertBudgetConfig failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(status).json({ errors: [{ code: result.error, message: 'Failed to save budget config' }] });
      return;
    }
    logger.info(`upsertBudgetConfig request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: result.value });
  }

  /**
   * POST /budget/payday-split
   * Executes Pipeline A — Payday Guillotine.
   */
  static async paydaySplit(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      logger.warn(`paydaySplit failed: Not authenticated`);
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`paydaySplit request received for user: ${req.user?.email}`);
    const result = await BudgetService.calculatePaydaySplit(userId, req.body.netPaycheck);
    if (!result.ok) {
      const statusMap: Record<string, number> = {
        CONFIG_NOT_FOUND: 404,
        INSUFFICIENT_NEEDS: 400,
        DB_ERROR: 500,
      };
      const status = statusMap[result.error] ?? 500;
      logger.error(`paydaySplit failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(status).json({ errors: [{ code: result.error, message: 'Failed to calculate payday split' }] });
      return;
    }
    logger.info(`paydaySplit request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: result.value });
  }
}
