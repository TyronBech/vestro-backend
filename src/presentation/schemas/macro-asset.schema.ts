import { z } from 'zod';

export const createMacroAssetSchema = z.object({
  body: z.object({
    bankName: z.string().min(1, "Bank name is required").max(50, "Bank name is too long"),
    purpose: z.string().min(1, "Purpose is required").max(100, "Purpose is too long"),
    balance: z.number().nonnegative("Balance must be non-negative").optional(),
    targetGoal: z.number().positive("Target goal must be positive").nullable().optional(),
    iconUrl: z.string().url("Must be a valid URL").nullable().optional(),
    colorCode: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color code").nullable().optional(),
    cardBrand: z.enum(['MASTERCARD', 'VISA']).optional(),
  })
});

export const updateMacroAssetSchema = z.object({
  body: z.object({
    bankName: z.string().min(1).max(50).optional(),
    purpose: z.string().min(1).max(100).optional(),
    balance: z.number().nonnegative().optional(),
    targetGoal: z.number().positive().nullable().optional(),
    iconUrl: z.string().url().nullable().optional(),
    colorCode: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
    cardBrand: z.enum(['MASTERCARD', 'VISA']).optional(),
  })
  .strict(),
  params: z.object({
    id: z.uuid("Invalid asset ID"),
  }),
});
