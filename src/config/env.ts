import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),

  // Database
  DATABASE_URL: z.url('DATABASE_URL is missing or invalid'),
  DIRECT_URL: z.url('DIRECT_URL is missing or invalid'),

  // JWT — used for issuing and verifying all Vestro session tokens
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),

  // Supabase — used to verify Google OAuth tokens issued by Supabase Auth
  SUPABASE_URL: z.url('SUPABASE_URL is missing or invalid'),
  SUPABASE_SERVICE_KEY: z.string().min(1, 'SUPABASE_SERVICE_KEY is missing'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:');
  _env.error.issues.forEach((issue) => {
    console.error(`  - ${String(issue.path[0])}: ${issue.message}`);
  });
  process.exit(1);
}

export const env = _env.data;
