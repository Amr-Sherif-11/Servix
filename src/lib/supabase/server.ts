import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export function createServerSupabase() {
  // Server‑side Supabase client for NextAuth adapter
  // Uses the public URL and anon key from .env.local (NEXT_PUBLIC_*)
  // In production you may replace the anon key with the service_role key
  // via a different env variable for enhanced permissions.
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
