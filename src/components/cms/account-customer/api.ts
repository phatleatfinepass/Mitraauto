import { supabase } from '../../../utils/supabase/client';
import {
  normalizeAccountEventRow,
  normalizeCustomerAutoLinkResult,
  normalizeCustomerDetail,
  normalizeCustomerHistory,
  normalizeCustomerLinkSuggestion,
  normalizeCustomerRow,
  normalizeLicensePlateConflict,
  normalizeLicensePlateImportResult,
  normalizeStaffRow,
  tagsFromText,
} from './safe';
import type { CustomerDraft, CustomerLinkSuggestion, CustomerNoteVisibility, CustomerOverviewFilters, CustomerVehicleDraft, StaffDraft, StaffRole } from './types';

function normalizeCustomerOverviewFilters(filters: CustomerOverviewFilters | string | unknown): CustomerOverviewFilters {
  if (typeof filters === 'string') {
    return { search: filters, status: 'all', tag: '', includeHidden: false };
  }

  if (!filters || typeof filters !== 'object') {
    return { search: '', status: 'all', tag: '', includeHidden: false };
  }

  const source = filters as Partial<CustomerOverviewFilters>;
  return {
    search: typeof source.search === 'string' ? source.search : '',
    status: source.status ?? 'all',
    tag: typeof source.tag === 'string' ? source.tag : '',
    includeHidden: Boolean(source.includeHidden),
  };
}

export async function listCustomerOverview(filters: CustomerOverviewFilters | string | unknown) {
  const safeFilters = normalizeCustomerOverviewFilters(filters);
  const { data, error } = await supabase.rpc('cms_list_customer_overview_v2', {
    p_search: safeFilters.search.trim() || null,
    p_limit: 120,
    p_status: safeFilters.status === 'all' ? null : safeFilters.status,
    p_tag: safeFilters.tag.trim() || null,
    p_include_hidden: safeFilters.includeHidden,
  });

  if (error) throw error;
  return (Array.isArray(data) ? data : []).map(normalizeCustomerRow);
}

export async function mergeCustomers(primaryCustomerId: string, duplicateCustomerId: string) {
  const { error } = await supabase.rpc('cms_merge_customers', {
    p_primary_customer_id: primaryCustomerId,
    p_duplicate_customer_id: duplicateCustomerId,
  });

  if (error) throw error;
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

export async function addStaffAccountByEmail(email: string, role: StaffRole, displayName: string, permissions: StaffDraft['permissions']) {
  const { data, error } = await supabase.rpc('cms_add_staff_account_by_email', {
    p_email: email,
    p_role: role,
    p_display_name: displayName.trim() || null,
    p_cms_permissions: permissions,
  });

  if (error) throw error;
  return String(data ?? '');
}

export async function inviteStaffAccount(email: string, role: StaffRole, displayName: string, permissions: StaffDraft['permissions']) {
  const { data, error } = await supabase.functions.invoke('cms_account_invite', {
    method: 'POST',
    body: {
      email,
      role,
      displayName,
      permissions,
    },
  });

  if (error) throw error;
  return String((data as any)?.userId ?? '');
}

export async function listAccountEvents(targetProfileId?: string | null) {
  const { data, error } = await supabase.rpc('cms_list_account_events', {
    p_target_profile_id: targetProfileId ?? null,
    p_limit: 80,
  });

  if (error) throw error;
  return (Array.isArray(data) ? data : []).map(normalizeAccountEventRow).filter((row) => row !== null);
}

export async function getCustomerDetail(customerId: string) {
  const { data, error } = await supabase.rpc('cms_get_customer_detail', {
    p_customer_id: customerId,
  });

  if (error) throw error;
  return normalizeCustomerDetail(data);
}

export async function getCustomerHistory(customerId: string) {
  const { data, error } = await supabase.rpc('cms_get_customer_history', {
    p_customer_id: customerId,
    p_limit: 30,
  });

  if (error) throw error;
  return normalizeCustomerHistory(data);
}

export async function listCustomerLinkSuggestions(customerId: string) {
  const { data, error } = await supabase.rpc('cms_list_customer_link_suggestions', {
    p_customer_id: customerId,
    p_limit: 80,
  });

  if (error) throw error;
  return (Array.isArray(data) ? data : []).map(normalizeCustomerLinkSuggestion).filter((row) => row !== null);
}

export async function linkCustomerActivity(suggestion: CustomerLinkSuggestion) {
  const { error } = await supabase.rpc('cms_link_customer_activity', {
    p_activity_type: suggestion.activityType,
    p_activity_id: suggestion.activityId,
    p_customer_id: suggestion.customerId,
    p_customer_vehicle_id: suggestion.customerVehicleId,
    p_match_source: suggestion.matchSource || 'manual',
  });

  if (error) throw error;
}

export async function unlinkCustomerActivity(activityType: CustomerLinkSuggestion['activityType'], activityId: string) {
  const { error } = await supabase.rpc('cms_unlink_customer_activity', {
    p_activity_type: activityType,
    p_activity_id: activityId,
  });

  if (error) throw error;
}

export async function autoLinkCustomerActivities() {
  const { data, error } = await supabase.rpc('cms_auto_link_customer_activities', {
    p_limit: 500,
    p_min_confidence: 85,
  });

  if (error) throw error;
  return (Array.isArray(data) ? data : []).map(normalizeCustomerAutoLinkResult).filter((row) => row !== null);
}

export async function exportCustomerData(customerId: string) {
  const { data, error } = await supabase.rpc('cms_export_customer_data', {
    p_customer_id: customerId,
  });

  if (error) throw error;
  return data;
}

export async function anonymizeCustomer(customerId: string, reason = '') {
  const { error } = await supabase.rpc('cms_anonymize_customer', {
    p_customer_id: customerId,
    p_reason: reason.trim() || null,
  });

  if (error) throw error;
}

export async function saveCustomer(draft: CustomerDraft) {
  const { data, error } = await supabase.rpc('cms_upsert_customer', {
    p_customer_id: draft.id,
    p_full_name: draft.fullName,
    p_primary_email: draft.primaryEmail,
    p_primary_phone: draft.primaryPhone,
    p_language: draft.language,
    p_business_id: draft.businessId,
    p_vat_id: draft.vatId,
    p_address_line1: draft.addressLine1,
    p_address_line2: draft.addressLine2,
    p_postal_code: draft.postalCode,
    p_city: draft.city,
    p_country_code: draft.countryCode,
    p_status: draft.status,
    p_tags: tagsFromText(draft.tagsText),
    p_marketing_consent: draft.marketingConsent,
    p_contact_consent: draft.contactConsent,
    p_hidden: draft.hidden,
    p_customer_type: draft.customerType,
  });

  if (error) throw error;
  return String(data ?? '');
}

export async function bulkImportCustomerPlates(customerId: string, rawPlates: string, defaultVehicleName = '') {
  const plates = rawPlates
    .split(/[\n,;]+/)
    .map((plate) => plate.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 500);

  const { data, error } = await supabase.rpc('cms_bulk_import_customer_plates', {
    p_customer_id: customerId,
    p_license_plates: plates,
    p_default_vehicle_name: defaultVehicleName.trim() || null,
  });

  if (error) throw error;
  return (Array.isArray(data) ? data : []).map(normalizeLicensePlateImportResult).filter((row) => row !== null);
}

export async function listLicensePlateConflicts() {
  const { data, error } = await supabase.rpc('cms_list_license_plate_conflicts');
  if (error) throw error;
  return (Array.isArray(data) ? data : []).map(normalizeLicensePlateConflict).filter((row) => row !== null);
}

export async function setCustomerStatus(customerId: string, status: CustomerDraft['status'], hidden?: boolean) {
  const { error } = await supabase.rpc('cms_set_customer_status', {
    p_customer_id: customerId,
    p_status: status,
    p_hidden: hidden ?? null,
  });

  if (error) throw error;
}

export async function saveCustomerVehicle(draft: CustomerVehicleDraft) {
  const { data, error } = await supabase.rpc('cms_upsert_customer_vehicle', {
    p_customer_id: draft.customerId,
    p_vehicle_id: draft.id,
    p_license_plate: draft.licensePlate,
    p_vehicle_name: draft.vehicleName,
    p_vin: draft.vin,
    p_notes: draft.notes,
    p_hidden: draft.hidden,
  });

  if (error) throw error;
  return String(data ?? '');
}

export async function addCustomerNote(customerId: string, body: string, visibility: CustomerNoteVisibility) {
  const { error } = await supabase.rpc('cms_add_customer_note', {
    p_customer_id: customerId,
    p_body: body,
    p_visibility: visibility,
  });

  if (error) throw error;
}
