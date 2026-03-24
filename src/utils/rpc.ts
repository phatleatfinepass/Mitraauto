import { supabase } from './supabase/client';

export async function callRpc<T = any>(fn: string, params?: Record<string, any>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, params ?? {});
  if (error) throw error;
  return data as T;
}
