import { Response } from 'express';
import { DashboardService } from '../../services/dashboard.service';

export class DashboardController {
  static async getDashboardData(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    const result = await DashboardService.getDashboardData(userId);
    if (!result.ok) {
      res.status(500).json({ errors: [{ code: result.error, message: 'Failed to load dashboard data' }] });
      return;
    }
    res.status(200).json({ data: result.value });
  }
}
