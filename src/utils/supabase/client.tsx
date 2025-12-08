import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Singleton Supabase client to avoid multiple instances
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = `https://${projectId}.supabase.co`;
    const supabaseAnonKey = publicAnonKey;

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