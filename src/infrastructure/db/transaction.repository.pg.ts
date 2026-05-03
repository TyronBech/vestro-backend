import { Transaction, Prisma } from '@prisma/client';
import { BaseRepositoryPg } from './base.repository.pg';
import { ITransactionRepository, CreateTransactionDto, UpdateTransactionDto } from '../../domain/transaction/transaction.repository';

export class TransactionRepositoryPg extends BaseRepositoryPg<Transaction, CreateTransactionDto, UpdateTransactionDto> implements ITransactionRepository {
  constructor() {
    super('transaction');
  }

  async findByUserId(userId: string): Promise<Transaction[]> {
    return this.db.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Returns all transactions for a user with category, goal, and account relations included.
   */
  async findByUserIdWithRelations(userId: string): Promise<any[]> {
    return this.db.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      include: { category: true, goal: true, account: true },
    });
  }

  /**
   * Returns all transactions for a user within a date range, with category included.
   */
  async findByUserIdInDateRange(userId: string, start: Date, end: Date): Promise<any[]> {
    return this.db.transaction.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
      },
      include: { category: true },
    });
  }

  /**
   * Returns the N most recent transactions for a user, with category included.
   */
  async findRecentByUserId(userId: string, take: number): Promise<any[]> {
    return this.db.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take,
      include: { category: true },
    });
  }

  /**
   * Atomic transaction: inserts a transaction and concurrently updates the linked goal.
   */
  async createWithGoalUpdate(data: Prisma.TransactionUncheckedCreateInput): Promise<Transaction> {
    return this.db.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({ data });

      if (data.goalId) {
        await tx.goal.update({
          where: { id: data.goalId },
          data: { currentAmount: { increment: data.amount } },
        });
      }

      return transaction;
    });
  }
}
