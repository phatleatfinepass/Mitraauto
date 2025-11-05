import { getSupabaseClient } from '../utils/supabase/client';

export async function tiresSearchUI(width: number, aspect: number, diameter: number) {
  const supabase = getSupabaseClient();
  return supabase.rpc('tires_search_ui', { p_width: width, p_aspect: aspect, p_diameter: diameter });
}

export async function rimsSearchUI(rimWidth: number, rimDiameter: number, pcd?: string | null) {
  const supabase = getSupabaseClient();
  return supabase.rpc('rims_search_ui', { p_width: rimWidth, p_diameter: rimDiameter, p_pcd: pcd ?? null });
}