import { z } from 'zod';

export const createGoalSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    targetAmount: z.number().positive("Target amount must be positive"),
    deadline: z.string().optional().nullable(),
  })
});
