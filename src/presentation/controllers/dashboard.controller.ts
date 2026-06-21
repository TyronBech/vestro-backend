import { Response } from 'express';
import { DashboardService } from '../../services/dashboard.service';
import { logger } from '../../utils/logger';

export class DashboardController {
  /**
   * GET /dashboard
   * Returns consolidated pipeline state: budget config, credit shield,
   * macro asset balances, and sweep readiness.
   */
  static async getDashboardData(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      logger.warn(`getDashboardData failed: Not authenticated`);
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`getDashboardData request received for user: ${req.user?.email}`);
    const result = await DashboardService.getDashboardData(userId);
    if (!result.ok) {
      logger.error(`getDashboardData failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(500).json({ errors: [{ code: result.error, message: 'Failed to load dashboard data' }] });
      return;
    }
    logger.info(`getDashboardData request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: result.value });
  }
}
