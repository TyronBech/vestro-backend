import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),

  // Database URLs
  DATABASE_URL: z.url('DATABASE_URL is missing or invalid'),
  DIRECT_URL: z.url('DIRECT_URL is missing or invalid'),

  // Supabase
  SUPABASE_URL: z.url('SUPABASE_URL is missing or invalid'),
  SUPABASE_SERVICE_KEY: z.string().min(1, 'SUPABASE_KEY is missing')
});

const _env = envSchema.safeParse(process.env);

if(!_env.success) {
  console.error('Invalid environment variables:');
  _env.error.issues.forEach((issue) => {
    console.error(` - ${String(issue.path[0])}: ${issue.message}`)
  })

  process.exit(1);
}

export const env = _env.data;
