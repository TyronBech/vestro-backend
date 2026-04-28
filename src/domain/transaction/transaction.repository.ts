import { Transaction, Prisma } from '@prisma/client';
import { IBaseRepository } from '../core/base.repository';

export type CreateTransactionDto = Prisma.TransactionCreateInput;
export type UpdateTransactionDto = Prisma.TransactionUpdateInput;

export interface ITransactionRepository extends IBaseRepository<Transaction, CreateTransactionDto, UpdateTransactionDto> {
  findByUserId(userId: string): Promise<Transaction[]>;
  createWithGoalUpdate(data: Prisma.TransactionUncheckedCreateInput): Promise<Transaction>;
}
