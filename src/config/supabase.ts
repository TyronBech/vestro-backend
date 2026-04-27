import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl?.trim()) {
  throw new Error('Missing required environment variable: SUPABASE_URL');
}

if (!supabaseKey?.trim()) {
  throw new Error('Missing required environment variable: SUPABASE_SERVICE_KEY');
}

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
