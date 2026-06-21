import { BudgetConfig } from '@prisma/client';
import { prisma } from './prisma.client';
import { IBudgetConfigRepository, CreateBudgetConfigDto } from '../../domain/budget/budget-config.repository';

/**
 * Prisma-backed implementation of the BudgetConfig repository.
 * Uses the singleton Prisma client — never instantiates its own.
 */
export class BudgetConfigRepositoryPg implements IBudgetConfigRepository {
  private readonly db = prisma;

  async findByUserId(userId: string): Promise<BudgetConfig | null> {
    return this.db.budgetConfig.findUnique({
      where: { userId },
    });
  }

  async upsertByUserId(
    userId: string,
    data: Omit<CreateBudgetConfigDto, 'userId'>,
  ): Promise<BudgetConfig> {
    return this.db.budgetConfig.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }
}
