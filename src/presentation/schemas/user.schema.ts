import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, "Name must be at least 1 character")
      .max(100, "Name is too long")
      .optional(),

    email: z.string()
      .email("Must be a valid email address")
      .optional(),

    avatarUrl: z.string()
      .url("Must be a valid URL")
      .optional(),

    spendingLimit: z.number()
      .nonnegative("Spending limit must be non-negative")
      .nullable()
      .optional(),

    panicModeEnabled: z.boolean().optional(),
  })
  .strict()
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];