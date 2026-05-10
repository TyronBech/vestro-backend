import { Request, Response } from 'express';
import { GoalService } from '../../services/goal.service';
import { logger } from '../../utils/logger';

export class GoalController {
  static async createGoal(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    logger.info(`createGoal request received for user: ${req.user?.email}`);
    const result = await GoalService.createGoal(userId, req.body);
    if (!result.ok) {
      logger.error(`createGoal failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(400).json({ errors: [{ code: result.error, message: 'Failed to create goal' }] });
      return;
    }
    logger.info(`createGoal request successful for user: ${req.user?.email}`);
    res.status(201).json({ data: result.value });
  }

  static async listGoals(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    logger.info(`listGoals request received for user: ${req.user?.email}`);
    const result = await GoalService.listGoals(userId);
    if (!result.ok) {
      logger.error(`listGoals failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(500).json({ errors: [{ code: result.error, message: 'Failed to list goals' }] });
      return;
    }
    logger.info(`listGoals request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: result.value });
  }
}
