import { Goal } from '@prisma/client';
import { BaseRepositoryPg } from './base.repository.pg';
import { IGoalRepository, CreateGoalDto, UpdateGoalDto } from '../../domain/goal/goal.repository';

export class GoalRepositoryPg extends BaseRepositoryPg<Goal, CreateGoalDto, UpdateGoalDto> implements IGoalRepository {
  constructor() {
    super('goal');
  }

  async findByUserId(userId: string): Promise<Goal[]> {
    return this.db.goal.findMany({
      where: { userId },
    });
  }
}
