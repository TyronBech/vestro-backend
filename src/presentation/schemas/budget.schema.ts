import { z } from 'zod';

export const upsertBudgetConfigSchema = z.object({
  body: z.object({
    netSalary: z.number().positive("Net salary must be positive"),
    needsRate: z.number().min(0).max(1, "Rate must be between 0 and 1"),
    wantsRate: z.number().min(0).max(1, "Rate must be between 0 and 1"),
    savingsRate: z.number().min(0).max(1, "Rate must be between 0 and 1"),
    investmentsRate: z.number().min(0).max(1, "Rate must be between 0 and 1"),
    cashAmount: z.number().nonnegative("Cash amount must be non-negative"),
  })
});

export const paydaySplitSchema = z.object({
  body: z.object({
    netPaycheck: z.number().positive("Net paycheck must be positive"),
  })
});
