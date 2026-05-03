import { z } from 'zod';
import { TransactionFlow, TransactionType } from '@prisma/client';

// We explicitly require amounts to be passed as integers (cents) 
// to avoid any floating-point processing on the backend at all.
export const CreateTransactionSchema = z.object({
  body: z.object({
    title: z.string()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title cannot exceed 100 characters"),
    
    amount: z.number()
      .int("Amount must be an integer representing cents to avoid floating-point errors")
      .positive("Amount must be greater than zero"),
      
    flow: z.enum(TransactionFlow, {
      message: "Flow must be " + TransactionFlow,
    }),
    
    type: z.enum(TransactionType, {
      message: "Type must be " + TransactionType,
    }),
    
    categoryId: z.uuid("Invalid Category ID format"),
    
    goalId: z.uuid("Invalid Goal ID format").optional(),

    date: z.coerce.date()
  })
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
