import { z } from 'zod';

export const createBudgetConfigSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    netSalary: z.number().positive("Net salary must be positive"),
    needsRate: z.number().min(0).max(1, "Rate must be between 0 and 1"),
    wantsRate: z.number().min(0).max(1, "Rate must be between 0 and 1"),
    savingsRate: z.number().min(0).max(1, "Rate must be between 0 and 1"),
    investmentsRate: z.number().min(0).max(1, "Rate must be between 0 and 1"),
    cashAmount: z.number().nonnegative("Cash amount must be non-negative"),
  })
});

export const updateBudgetConfigSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    netSalary: z.number().positive("Net salary must be positive").optional(),
    needsRate: z.number().min(0).max(1, "Rate must be between 0 and 1").optional(),
    wantsRate: z.number().min(0).max(1, "Rate must be between 0 and 1").optional(),
    savingsRate: z.number().min(0).max(1, "Rate must be between 0 and 1").optional(),
    investmentsRate: z.number().min(0).max(1, "Rate must be between 0 and 1").optional(),
    cashAmount: z.number().nonnegative("Cash amount must be non-negative").optional(),
  })
});

export const budgetConfigParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid budget config ID"),
  })
});

export const upsertBudgetConfigSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name cannot be empty").optional(),
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
    configId: z.string().uuid("Invalid budget config ID").optional(),
  })
});
