import { Response } from 'express';
import { BudgetService } from '../../services/budget.service';
import { logger } from '../../utils/logger';

export class BudgetController {
  /**
   * GET /budget
   * Fetches all budget configs for the authenticated user.
   */
  static async getBudgetConfigs(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      logger.warn(`getBudgetConfigs failed: Not authenticated`);
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`getBudgetConfigs request received for user: ${req.user?.email}`);
    const result = await BudgetService.getBudgetConfigs(userId);
    if (!result.ok) {
      logger.error(`getBudgetConfigs failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(500).json({ errors: [{ code: result.error, message: 'Failed to load budget configs' }] });
      return;
    }
    logger.info(`getBudgetConfigs request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: result.value });
  }

  /**
   * GET /budget/:id
   * Fetches a specific budget config by ID.
   */
  static async getBudgetConfigById(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      logger.warn(`getBudgetConfigById failed: Not authenticated`);
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`getBudgetConfigById request received for user: ${req.user?.email}, id: ${req.params.id}`);
    const result = await BudgetService.getBudgetConfigById(userId, req.params.id);
    if (!result.ok) {
      const status = result.error === 'NOT_FOUND' ? 404 : 500;
      logger.error(`getBudgetConfigById failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(status).json({ errors: [{ code: result.error, message: 'Budget config not found' }] });
      return;
    }
    logger.info(`getBudgetConfigById request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: result.value });
  }

  /**
   * GET /budget/primary
   * Fetches the primary/first budget config for the user (backward compatible).
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
   * POST /budget
   * Creates a new budget config for the authenticated user.
   */
  static async createBudgetConfig(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      logger.warn(`createBudgetConfig failed: Not authenticated`);
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`createBudgetConfig request received for user: ${req.user?.email}`);
    const result = await BudgetService.createBudgetConfig(userId, req.body);
    if (!result.ok) {
      const status = result.error === 'INVALID_RATES' ? 400 : 500;
      logger.error(`createBudgetConfig failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(status).json({ errors: [{ code: result.error, message: 'Failed to create budget config' }] });
      return;
    }
    logger.info(`createBudgetConfig request successful for user: ${req.user?.email}`);
    res.status(201).json({ data: result.value });
  }

  /**
   * PUT /budget/:id
   * Updates an existing budget config by ID.
   */
  static async updateBudgetConfig(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      logger.warn(`updateBudgetConfig failed: Not authenticated`);
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`updateBudgetConfig request received for user: ${req.user?.email}, id: ${req.params.id}`);
    const result = await BudgetService.updateBudgetConfig(userId, req.params.id, req.body);
    if (!result.ok) {
      const statusMap: Record<string, number> = {
        NOT_FOUND: 404,
        INVALID_RATES: 400,
        DB_ERROR: 500,
      };
      const status = statusMap[result.error] ?? 500;
      logger.error(`updateBudgetConfig failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(status).json({ errors: [{ code: result.error, message: 'Failed to update budget config' }] });
      return;
    }
    logger.info(`updateBudgetConfig request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: result.value });
  }

  /**
   * DELETE /budget/:id
   * Deletes a budget config by ID.
   */
  static async deleteBudgetConfig(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      logger.warn(`deleteBudgetConfig failed: Not authenticated`);
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`deleteBudgetConfig request received for user: ${req.user?.email}, id: ${req.params.id}`);
    const result = await BudgetService.deleteBudgetConfig(userId, req.params.id);
    if (!result.ok) {
      const status = result.error === 'NOT_FOUND' ? 404 : 500;
      logger.error(`deleteBudgetConfig failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(status).json({ errors: [{ code: result.error, message: 'Failed to delete budget config' }] });
      return;
    }
    logger.info(`deleteBudgetConfig request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: result.value });
  }

  /**
   * PUT /budget
   * Backward compatible upsert for authenticated user's primary budget config.
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
    const result = await BudgetService.calculatePaydaySplit(userId, req.body.netPaycheck, req.body.configId);
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
