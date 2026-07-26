import { BudgetConfig, Prisma } from '@prisma/client';

export type CreateBudgetConfigDto = Prisma.BudgetConfigUncheckedCreateInput;
export type UpdateBudgetConfigDto = Prisma.BudgetConfigUncheckedUpdateInput;

/**
 * Domain interface for BudgetConfig persistence operations.
 * BudgetConfig is a 1:N relation with User — each user can have multiple configs.
 */
export interface IBudgetConfigRepository {
  /** Finds all budget configs for a given user. */
  findAllByUserId(userId: string): Promise<BudgetConfig[]>;

  /** Finds a single budget config by its ID for a specific user. */
  findById(id: string, userId: string): Promise<BudgetConfig | null>;

  /** Finds the first/primary budget config for a given user, or null if none exists. */
  findByUserId(userId: string): Promise<BudgetConfig | null>;

  /** Creates a new budget config for a user. */
  create(userId: string, data: Omit<CreateBudgetConfigDto, 'userId'>): Promise<BudgetConfig>;

  /** Updates a budget config by ID for a user. */
  update(id: string, userId: string, data: UpdateBudgetConfigDto): Promise<BudgetConfig>;

  /** Deletes a budget config by ID for a user. */
  delete(id: string, userId: string): Promise<BudgetConfig>;
}
