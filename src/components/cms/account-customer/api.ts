import { supabase } from '../../../utils/supabase/client';
import { normalizeCustomerRow, normalizeStaffRow } from './safe';
import type { StaffDraft } from './types';

export async function listCustomerOverview(search: string) {
  const { data, error } = await supabase.rpc('cms_list_customer_overview', {
    p_search: search.trim() || null,
    p_limit: 120,
  });

  if (error) throw error;
  return (Array.isArray(data) ? data : []).map(normalizeCustomerRow);
}

export async function listStaffAccounts() {
  const { data, error } = await supabase.rpc('cms_list_staff_accounts');
  if (error) throw error;
  return (Array.isArray(data) ? data : []).map(normalizeStaffRow).filter((row) => row !== null);
}

export async function updateStaffAccount(profileId: string, draft: StaffDraft) {
  const { error } = await supabase.rpc('cms_update_staff_account', {
    p_profile_id: profileId,
    p_role: draft.role,
    p_account_status: draft.accountStatus,
    p_account_hidden: draft.hidden,
    p_display_name: draft.displayName.trim() || null,
    p_cms_permissions: draft.permissions,
  });

  if (error) throw error;
}
