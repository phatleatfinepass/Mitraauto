const defaultProjectId = 'rcmmbwdebnmicrweoiyz';

export const projectId =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID ||
  defaultProjectId;

export const publicAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

