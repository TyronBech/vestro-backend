import { z } from 'zod';

export const createCreditCardSchema = z.object({
  body: z.object({
    cardName: z.string().min(1, "Card name is required").max(100, "Card name is too long"),
    creditLimit: z.number().positive("Credit limit must be positive"),
    statementCutoffDay: z.number().int().min(1).max(31, "Statement cutoff day must be 1–31"),
    paymentDueDay: z.number().int().min(1).max(31, "Payment due day must be 1–31"),
    macroAssetId: z.string().uuid("Invalid macro asset ID").nullable().optional(),
    cardBrand: z.enum(['MASTERCARD', 'VISA']).optional(),
  })
});

export const updateCreditCardSchema = z.object({
  body: z.object({
    cardName: z.string().min(1).max(100).optional(),
    creditLimit: z.number().positive().optional(),
    statementCutoffDay: z.number().int().min(1).max(31).optional(),
    paymentDueDay: z.number().int().min(1).max(31).optional(),
    macroAssetId: z.string().uuid("Invalid macro asset ID").nullable().optional(),
    cardBrand: z.enum(['MASTERCARD', 'VISA']).optional(),
  })
  .strict(),
  params: z.object({
    id: z.uuid("Invalid card ID"),
  }),
});

export const recordSpendSchema = z.object({
  body: z.object({
    amount: z.number().positive("Amount must be positive"),
  }),
  params: z.object({
    id: z.uuid("Invalid card ID"),
  }),
});

export const recordMidCyclePaymentSchema = z.object({
  body: z.object({
    amount: z.number().positive("Amount must be positive"),
  }),
  params: z.object({
    id: z.uuid("Invalid card ID"),
  }),
});
