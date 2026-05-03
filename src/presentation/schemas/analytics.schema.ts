import { z } from 'zod';

export const analyticsFilterSchema = z.object({
  query: z.object({
    period: z.enum(['day', 'week', 'month', 'year']).default('month'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
});
