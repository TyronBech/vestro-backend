import { z } from 'zod';

export const executeSweepSchema = z.object({
  body: z.object({
    targetVault: z.string().min(1, "Target vault is required").max(100, "Target vault name is too long"),
    notes: z.string().max(500, "Notes are too long").optional(),
  })
});

export const createManualSweepSchema = z.object({
  body: z.object({
    amount: z.number().positive("Amount must be greater than zero"),
    coreNetworkId: z.string().uuid("Invalid Core Network ID"),
    notes: z.string().max(500, "Notes are too long").optional(),
    sweptAt: z.string().optional(),
  })
});
