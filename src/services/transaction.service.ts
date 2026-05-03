import { Result, ok, err } from '../utils/result';
import { TransactionRepositoryPg } from '../infrastructure/db/transaction.repository.pg';
import { CreateTransactionInput } from '../presentation/schemas/transaction.schema';

export type TransactionInput = CreateTransactionInput['body'] & { userId: string };

const transactionRepo = new TransactionRepositoryPg();

export class TransactionService {
  /**
   * Adds a new transaction atomically.
   * Validation is handled upstream by the `validate` middleware — input is pre-typed here.
   * Amount is stored as integer cents to avoid floating-point errors.
   * @param input Validated transaction data with userId injected from JWT
   */
  static async addTransaction(input: TransactionInput): Promise<Result<any, 'DB_ERROR'>> {
    try {
      const amountInCents = Math.round(input.amount * 100);

      const transaction = await transactionRepo.createWithGoalUpdate({
        userId: input.userId,
        title: input.title,
        amount: amountInCents,
        flow: input.flow,
        type: input.type,
        categoryId: input.categoryId,
        goalId: input.goalId ?? null,
      });

      return ok(transaction);
    } catch {
      return err('DB_ERROR');
    }
  }

  /**
   * Returns all transactions for a given user, ordered newest first.
   * @param userId Authenticated user's ID from JWT
   */
  static async listTransactions(userId: string): Promise<Result<any[], 'DB_ERROR'>> {
    try {
      const transactions = await transactionRepo.findByUserIdWithRelations(userId);
      return ok(transactions);
    } catch {
      return err('DB_ERROR');
    }
  }
}
