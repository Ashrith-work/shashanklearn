import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { DEMO } from '@/demo/demo';

// In demo mode the app never calls Supabase (hooks serve mock data), so fall
// back to harmless placeholders instead of throwing on missing env.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || (DEMO ? 'https://demo.supabase.co' : '');
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || (DEMO ? 'demo-anon-key' : '');

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loud in dev so a missing .env is obvious immediately.
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env and set ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

/** Typed Supabase client singleton — import this everywhere. */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
