import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

function getSupabaseRuntimeOverrideHelp() {
  return [
    "window.localStorage.setItem('mitra.supabase.url', 'https://rcmmbwdebnmicrweoiyz.supabase.co')",
    "window.localStorage.setItem('mitra.supabase.anonKey', '<SUPABASE_ANON_KEY>')",
    'window.location.reload()',
  ].join('\n');
}

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  `https://${projectId}.supabase.co`;

const anonKey = publicAnonKey || 'MISSING_SUPABASE_ANON_KEY';

export const supabaseConfigError =
  !publicAnonKey
    ? [
        'Supabase is not configured for the browser.',
        'Set VITE_SUPABASE_ANON_KEY for this Vite app, or inject a runtime override in the browser:',
        getSupabaseRuntimeOverrideHelp(),
      ].join('\n')
    : null;

export function getSupabaseConfigError() {
  return supabaseConfigError;
}

export function assertSupabaseConfigured() {
  if (supabaseConfigError) {
    throw new Error(supabaseConfigError);
  }
}

export const supabase = createClient(supabaseUrl, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
  (window as any).__supabaseConfigError = supabaseConfigError;
}

export function getSupabaseClient() {
  assertSupabaseConfigured();
  return supabase;
}
