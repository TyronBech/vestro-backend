import { Response } from 'express';
import { AnalyticsService } from '../../services/analytics.service';
import { logger } from '../../utils/logger';

export class AnalyticsController {
  static async getReport(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    logger.info(`getReport request received for user: ${req.user?.email}`);
    const result = await AnalyticsService.getGeneralReport(userId, req.query);
    if (!result.ok) {
      logger.error(`getReport failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(400).json({ errors: [{ code: result.error, message: 'Failed to generate report' }] });
      return;
    }
    logger.info(`getReport request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: result.value });
  }
}
