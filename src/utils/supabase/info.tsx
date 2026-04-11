const defaultProjectId = 'rcmmbwdebnmicrweoiyz';
const defaultPublicAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbW1id2RlYm5taWNyd2VvaXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDE5NTQsImV4cCI6MjA3NTUxNzk1NH0.pRp2w18uYHhs99gNCU1sf1GOaFtRzdJqa63Z4aDukhg';

declare global {
  interface Window {
    __MITRA_SUPABASE__?: {
      url?: string;
      anonKey?: string;
      projectId?: string;
    };
  }
}

function readRuntimeConfig() {
  if (typeof window === 'undefined') {
    return {
      url: '',
      anonKey: '',
      projectId: '',
    };
  }

  const fromWindow = window.__MITRA_SUPABASE__ ?? {};

  return {
    url: String(
      fromWindow.url ??
        window.localStorage.getItem('mitra.supabase.url') ??
        ''
    ).trim(),
    anonKey: String(
      fromWindow.anonKey ??
        window.localStorage.getItem('mitra.supabase.anonKey') ??
        ''
    ).trim(),
    projectId: String(
      fromWindow.projectId ??
        window.localStorage.getItem('mitra.supabase.projectId') ??
        ''
    ).trim(),
  };
}

const runtimeConfig = readRuntimeConfig();

export const projectId =
  runtimeConfig.projectId ||
  import.meta.env.VITE_SUPABASE_PROJECT_ID ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID ||
  defaultProjectId;

export const publicAnonKey =
  runtimeConfig.anonKey ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  defaultPublicAnonKey;

export const supabaseEnv = {
  url:
    runtimeConfig.url ||
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    '',
  anonKey: publicAnonKey,
  projectId,
};

export function getSupabaseRuntimeOverrideHelp() {
  return [
    "window.localStorage.setItem('mitra.supabase.url', 'https://rcmmbwdebnmicrweoiyz.supabase.co')",
    "window.localStorage.setItem('mitra.supabase.anonKey', '<SUPABASE_ANON_KEY>')",
    'window.location.reload()',
  ].join('\n');
}
