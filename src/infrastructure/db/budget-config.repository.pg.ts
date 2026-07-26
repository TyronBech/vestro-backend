import { BudgetConfig } from '@prisma/client';
import { prisma } from './prisma.client';
import { IBudgetConfigRepository, CreateBudgetConfigDto, UpdateBudgetConfigDto } from '../../domain/budget/budget-config.repository';

/**
 * Prisma-backed implementation of the BudgetConfig repository.
 * Uses the singleton Prisma client — never instantiates its own.
 */
export class BudgetConfigRepositoryPg implements IBudgetConfigRepository {
  private readonly db = prisma;

  async findAllByUserId(userId: string): Promise<BudgetConfig[]> {
    return this.db.budgetConfig.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, userId: string): Promise<BudgetConfig | null> {
    return this.db.budgetConfig.findFirst({
      where: { id, userId },
    });
  }

  async findByUserId(userId: string): Promise<BudgetConfig | null> {
    const configs = await this.findAllByUserId(userId);
    return configs[0] || null;
  }

  async create(
    userId: string,
    data: Omit<CreateBudgetConfigDto, 'userId'>,
  ): Promise<BudgetConfig> {
    return this.db.budgetConfig.create({
      data: { userId, ...data },
    });
  }

  async update(
    id: string,
    userId: string,
    data: UpdateBudgetConfigDto,
  ): Promise<BudgetConfig> {
    const existing = await this.db.budgetConfig.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new Error(`BudgetConfig with id ${id} not found for user ${userId}`);
    }

    return this.db.budgetConfig.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, userId: string): Promise<BudgetConfig> {
    const existing = await this.db.budgetConfig.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new Error(`BudgetConfig with id ${id} not found for user ${userId}`);
    }

    return this.db.budgetConfig.delete({
      where: { id },
    });
  }
}
