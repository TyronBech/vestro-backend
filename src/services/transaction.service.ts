import { z } from 'zod';
import { PrismaClient, TransactionFlow, TransactionType } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Transaction validation schema aligned with the Prisma schema
export const TransactionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.number().positive('Amount must be positive'),
  flow: z.nativeEnum(TransactionFlow),
  type: z.nativeEnum(TransactionType),
  userId: z.string().uuid('Invalid user ID'),
  categoryId: z.string().uuid('Invalid category ID'),
  goalId: z.string().uuid('Invalid goal ID').optional().nullable(),
});

export type TransactionInput = z.infer<typeof TransactionSchema>;

export class TransactionService {
  /**
   * Adds a new transaction, applying Flat Minimalism logic: simple, direct, error-proof.
   * The insert and optional goal-progress update are executed in a single atomic DB transaction.
   * @param input Raw transaction data
   * @returns Created transaction record
   */
  static async addTransaction(input: unknown) {
    // 1. Validate inputs via TransactionSchema
    // Any validation failure throws a ZodError which can trigger Haptics on the client
    const validated = TransactionSchema.parse(input);

    // 2. Convert decimal input to cents (integers) to avoid floating-point errors
    const amountInCents = Math.round(validated.amount * 100);

    // 3. Insert + goal update atomically so they both succeed or both roll back
    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId: validated.userId,
          title: validated.title,
          amount: amountInCents,
          flow: validated.flow,
          type: validated.type,
          categoryId: validated.categoryId,
          goalId: validated.goalId ?? null,
        },
      });

      // 4. If linked to a goal, atomically increment currentAmount
      if (validated.goalId) {
        await tx.goal.update({
          where: { id: validated.goalId },
          data: { currentAmount: { increment: amountInCents } },
        });
      }

      return transaction;
    });
  }
}

