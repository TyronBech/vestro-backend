import { Request, Response } from 'express';
import { GoalService } from '../../services/goal.service';

export class GoalController {
  static async createGoal(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    const result = await GoalService.createGoal(userId, req.body);
    if (!result.ok) {
      res.status(400).json({ errors: [{ code: result.error, message: 'Failed to create goal' }] });
      return;
    }
    res.status(201).json({ data: result.value });
  }

  static async listGoals(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    const result = await GoalService.listGoals(userId);
    if (!result.ok) {
      res.status(500).json({ errors: [{ code: result.error, message: 'Failed to list goals' }] });
      return;
    }
    res.status(200).json({ data: result.value });
  }
}
