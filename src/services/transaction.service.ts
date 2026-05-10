import { Result, ok, err } from '../utils/result';
import { TransactionRepositoryPg } from '../infrastructure/db/transaction.repository.pg';
import { CreateTransactionInput } from '../presentation/schemas/transaction.schema';

export type TransactionInput = CreateTransactionInput['body'] & { userId: string };
import { logger } from '../utils/logger';

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
      logger.info(`Executing addTransaction service for userId: ${input.userId}`);
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

      logger.info(`addTransaction service completed successfully for userId: ${input.userId}, transactionId: ${transaction.id}`);
      return ok(transaction);
    } catch (error) {
      logger.error(`addTransaction service DB_ERROR for userId ${input.userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Returns all transactions for a given user, ordered newest first.
   * @param userId Authenticated user's ID from JWT
   */
  static async listTransactions(userId: string): Promise<Result<any[], 'DB_ERROR'>> {
    try {
      logger.info(`Executing listTransactions service for userId: ${userId}`);
      const transactions = await transactionRepo.findByUserIdWithRelations(userId);
      logger.info(`listTransactions service completed successfully for userId: ${userId}, count: ${transactions.length}`);
      return ok(transactions);
    } catch (error) {
      logger.error(`listTransactions service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }
}
