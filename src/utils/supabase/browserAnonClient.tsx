import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

export const supabaseBrowserAnonUrl = `https://${projectId}.supabase.co`;

// Pure browser anonymous client for public operations (e.g., emergency requests)
// No session persistence, no auth refresh - pure anon access
export const supabaseBrowserAnon = createClient(supabaseBrowserAnonUrl, publicAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'mitra-auto-emergency-anon',
    },
  },
});

// Debug logging (dev only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔓 Browser Anon Supabase Client initialized for:', supabaseBrowserAnonUrl);
}
