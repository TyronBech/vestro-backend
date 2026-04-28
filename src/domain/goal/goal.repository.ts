import { Goal, Prisma } from '@prisma/client';
import { IBaseRepository } from '../core/base.repository';

export type CreateGoalDto = Prisma.GoalCreateInput;
export type UpdateGoalDto = Prisma.GoalUpdateInput;

export interface IGoalRepository extends IBaseRepository<Goal, CreateGoalDto, UpdateGoalDto> {
  findByUserId(userId: string): Promise<Goal[]>;
}
