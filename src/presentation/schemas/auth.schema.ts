import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  })
});

export const verify2faSchema = z.object({
  body: z.object({
    userId: z.uuid("Invalid user ID"),
    token: z.string().length(6, "Token must be 6 digits"),
  })
});

export const verifySupabaseSchema = z.object({
  body: z.object({
    supabaseToken: z.string().min(1, "Supabase token is required"),
  })
});

export const enableBiometricsSchema = z.object({
  body: z.object({
    // empty body since it's an authenticated endpoint, we just generate and return it
  })
});

export const biometricLoginSchema = z.object({
  body: z.object({
    userId: z.uuid("Invalid user ID"),
    biometricKey: z.string().min(1, "Biometric key is required"),
  })
});
