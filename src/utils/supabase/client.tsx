import { createClient, SupabaseClient } from '@supabase/supabase-js@2';
import { projectId, publicAnonKey } from './info';

// Singleton Supabase client to avoid multiple instances
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey,
      {
        auth: {
          persistSession: true,
          storageKey: 'mitra-auto-auth',
          storage: window.localStorage,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );
  }
  return supabaseClient;
}
