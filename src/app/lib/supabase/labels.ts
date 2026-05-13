import { createClient } from '@supabase/supabase-js';
import type { TyreExtraLabels, RimExtraLabels } from '../types/labels';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
// ^ For CMS/admin backend only – never expose service key in browser.
// If you call from API route, put this in the API route, not client-side.

const supabase = createClient(supabaseUrl, supabaseKey);

export async function updateTyreVariantLabels(
  variantId: string,
  labels: TyreExtraLabels
) {
  // merge existing extra_spec with new labels
  const { data: rows, error: fetchError } = await supabase
    .from('tires_variants')
    .select('extra_spec')
    .eq('id', variantId)
    .single();

  if (fetchError) throw fetchError;

  const current = (rows?.extra_spec ?? {}) as Record<string, unknown>;
  const next = { ...current, ...labels };

  const { error: updateError } = await supabase
    .from('tires_variants')
    .update({ extra_spec: next })
    .eq('id', variantId);

  if (updateError) throw updateError;
}

export async function updateRimVariantLabels(
  variantId: string,
  labels: RimExtraLabels
) {
  const { data: rows, error: fetchError } = await supabase
    .from('rims_variants')
    .select('extra_spec')
    .eq('id', variantId)
    .single();

  if (fetchError) throw fetchError;

  const current = (rows?.extra_spec ?? {}) as Record<string, unknown>;
  const next = { ...current, ...labels };

  const { error: updateError } = await supabase
    .from('rims_variants')
    .update({ extra_spec: next })
    .eq('id', variantId);

  if (updateError) throw updateError;
}