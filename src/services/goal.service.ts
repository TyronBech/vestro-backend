import { Result, ok, err } from '../utils/result';
import { GoalRepositoryPg } from '../infrastructure/db/goal.repository.pg';
import { createGoalSchema } from '../presentation/schemas/goal.schema';
import { z } from 'zod';

export type CreateGoalInput = z.infer<typeof createGoalSchema>['body'];

const goalRepo = new GoalRepositoryPg();

export class GoalService {
  static async createGoal(userId: string, input: CreateGoalInput): Promise<Result<any, 'DB_ERROR'>> {
    try {
      const goal = await goalRepo.create({
        user: { connect: { id: userId } },
        title: input.title,
        targetAmount: Math.round(input.targetAmount * 100),
        deadline: input.deadline ? new Date(input.deadline) : null,
      });
      return ok(goal);
    } catch {
      return err('DB_ERROR');
    }
  }

  static async listGoals(userId: string): Promise<Result<any, 'DB_ERROR'>> {
    try {
      const goals = await goalRepo.findByUserId(userId);
      const enrichedGoals = goals.map((goal) => {
        const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
        return {
          ...goal,
          percentage: Number(percentage.toFixed(2)),
        };
      });
      return ok(enrichedGoals);
    } catch {
      return err('DB_ERROR');
    }
  }
}
