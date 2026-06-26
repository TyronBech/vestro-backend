import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AnalyticsService } from '../../services/analytics.service';
import { logger } from '../../utils/logger';

export class AnalyticsController {
  /**
   * GET /api/analytics
   * Retrieve aggregated analytics telemetry for charts and simulator.
   */
  static async getAnalyticsData(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    logger.info(`[AnalyticsController.getAnalyticsData] Request received for userId: ${userId}`);

    const result = await AnalyticsService.getAnalyticsData(userId);

    if (result.ok) {
      res.status(200).json({ data: result.value });
      return;
    }

    res.status(500).json({ error: 'Internal Server Error', message: result.error });
  }
}
