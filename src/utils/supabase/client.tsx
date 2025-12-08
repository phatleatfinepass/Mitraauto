import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Singleton Supabase client to avoid multiple instances
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const authConfig = {
      persistSession: true,
      storageKey: 'mitra-auto-auth',
      autoRefreshToken: true,
      detectSessionInUrl: true,
    } as const;

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth:
        typeof window !== 'undefined'
          ? { ...authConfig, storage: window.localStorage }
          : authConfig,
    });
  }
  
  return supabaseClient;
}
