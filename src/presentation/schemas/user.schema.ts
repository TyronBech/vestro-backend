// src/schemas/user.schema.ts
import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name is too long")
      .optional(),
      
    middleName: z.string()
      .min(2, "Middle name must be at least 2 characters")
      .max(50, "Middle name is too long")
      .nullable()
      .optional(),
      
    lastName: z.string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name is too long")
      .optional(),
      
    suffix: z.string()
      .min(1, "Suffix must be at least 1 character")
      .max(10, "Suffix is too long")
      .nullable()
      .optional(),
      
    // Zod has a built-in .url() checker! It will reject "my-cool-picture.jpg"
    // and only accept "https://example.com/my-cool-picture.jpg"
    avatarUrl: z.string()
      .url("Avatar must be a valid image URL")
      .optional(),
      
    currency: z.string()
      .length(3, "Currency must be a 3-letter code (e.g., PHP)")
      .optional(),
      
    // Booleans for your security toggles
    biometricsEnabled: z.boolean().optional(),
    panicModeEnabled: z.boolean().optional(),
  })
  // .strict() ensures the user can't send random data like { "hackerField": true }
  .strict() 
});

// Extract the TypeScript type for your controller
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];