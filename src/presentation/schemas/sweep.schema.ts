import { z } from 'zod';

export const executeSweepSchema = z.object({
  body: z.object({
    targetVault: z.string().min(1, "Target vault is required").max(50, "Target vault name is too long"),
    notes: z.string().max(500, "Notes are too long").optional(),
  })
});
