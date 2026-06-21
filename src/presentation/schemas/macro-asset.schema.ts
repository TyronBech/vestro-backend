import { z } from 'zod';

export const createMacroAssetSchema = z.object({
  body: z.object({
    bankName: z.string().min(1, "Bank name is required").max(50, "Bank name is too long"),
    purpose: z.string().min(1, "Purpose is required").max(100, "Purpose is too long"),
    balance: z.number().nonnegative("Balance must be non-negative").optional(),
    targetGoal: z.number().positive("Target goal must be positive").nullable().optional(),
  })
});

export const updateMacroAssetSchema = z.object({
  body: z.object({
    bankName: z.string().min(1).max(50).optional(),
    purpose: z.string().min(1).max(100).optional(),
    balance: z.number().nonnegative().optional(),
    targetGoal: z.number().positive().nullable().optional(),
  })
  .strict(),
  params: z.object({
    id: z.uuid("Invalid asset ID"),
  }),
});
