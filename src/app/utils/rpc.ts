import { supabase } from './supabase/client';

export async function callRpc<T = unknown>(fn: string, params?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, params ?? {});
  if (error) throw error;
  return data as T;
}
