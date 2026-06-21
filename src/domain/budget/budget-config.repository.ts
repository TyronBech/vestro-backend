import { BudgetConfig, Prisma } from '@prisma/client';

export type CreateBudgetConfigDto = Prisma.BudgetConfigUncheckedCreateInput;
export type UpdateBudgetConfigDto = Prisma.BudgetConfigUncheckedUpdateInput;

/**
 * Domain interface for BudgetConfig persistence operations.
 * BudgetConfig is a 1:1 relation with User — each user has at most one.
 */
export interface IBudgetConfigRepository {
  /** Finds the budget config for a given user, or null if none exists. */
  findByUserId(userId: string): Promise<BudgetConfig | null>;

  /**
   * Creates or updates the budget config for a user.
   * Uses Prisma upsert — create if missing, update if exists.
   */
  upsertByUserId(userId: string, data: Omit<CreateBudgetConfigDto, 'userId'>): Promise<BudgetConfig>;
}
