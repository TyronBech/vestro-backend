import { Response } from 'express';
import { AnalyticsService } from '../../services/analytics.service';

export class AnalyticsController {
  static async getReport(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    const result = await AnalyticsService.getGeneralReport(userId, req.query);
    if (!result.ok) {
      res.status(400).json({ errors: [{ code: result.error, message: 'Failed to generate report' }] });
      return;
    }
    res.status(200).json({ data: result.value });
  }
}
