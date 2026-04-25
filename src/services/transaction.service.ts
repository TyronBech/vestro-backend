import { z } from 'zod';
import { supabase } from '../config/supabase';

// Transaction validation schema
export const TransactionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  profileId: z.string().uuid('Invalid profile ID'),
  goalId: z.string().uuid('Invalid goal ID').optional().nullable(),
});

export type TransactionInput = z.infer<typeof TransactionSchema>;

export class TransactionService {
  /**
   * Adds a new transaction, applying Flat Minimalism logic: simple, direct, error-proof.
   * @param input Raw transaction data
   * @returns Created transaction record
   */
  static async addTransaction(input: unknown) {
    // 1. Validate inputs via TransactionSchema
    // Any validation failure throws a ZodError which can trigger Haptics on the client
    const validated = TransactionSchema.parse(input);

    // 2. Convert decimal input to cents (integers) to avoid floating-point errors
    const amountInCents = Math.round(validated.amount * 100);

    // Prepare transaction data following database schema (with soft-deletes)
    const transactionData = {
      title: validated.title,
      amount: amountInCents,
      type: validated.type,
      profile_id: validated.profileId,
      goal_id: validated.goalId || null,
      deleted_at: null, // Soft-deletes support
    };

    // Insert transaction into the database
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (txError) {
      throw new Error(`Failed to add transaction: ${txError.message}`);
    }

    // 3. If the transaction is linked to a goalId, increment current_amount in goals table
    if (validated.goalId) {
      // Simple read-modify-write for goal progress
      const { data: goal, error: fetchError } = await supabase
        .from('goals')
        .select('current_amount')
        .eq('id', validated.goalId)
        .is('deleted_at', null)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch linked goal: ${fetchError.message}`);
      }

      const newAmount = (goal.current_amount || 0) + amountInCents;

      const { error: updateError } = await supabase
        .from('goals')
        .update({ current_amount: newAmount })
        .eq('id', validated.goalId);

      if (updateError) {
        throw new Error(`Failed to update goal progress: ${updateError.message}`);
      }
    }

    return transaction;
  }
}
