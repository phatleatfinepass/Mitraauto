import { supabase } from '../../../utils/supabase/client';
import {
  normalizeAccountEventRow,
  normalizeCustomerAutoLinkResult,
  normalizeCustomerDetail,
  normalizeCustomerHistory,
  normalizeCustomerLinkSuggestion,
  normalizeCustomerRow,
  normalizeCustomerVehiclePlateLookup,
  normalizeLicensePlateConflict,
  normalizeLicensePlateImportResult,
  normalizeMaintenanceReminder,
  normalizeNotificationHistoryRow,
  normalizeServiceBookEntry,
  normalizeStaffRow,
  tagsFromText,
} from './safe';
import type { CustomerDraft, CustomerLinkSuggestion, CustomerMaintenanceReminderDraft, CustomerNoteVisibility, CustomerOverviewFilters, CustomerServiceBookDraft, CustomerVehicleDraft, LicensePlateConflict, StaffDraft, StaffRole } from './types';

async function getFunctionErrorMessage(error: unknown) {
  const context = error && typeof error === 'object' && 'context' in error ? (error as any).context : null;
  if (context && typeof context.json === 'function') {
    try {
      const body = await context.clone().json();
      if (body?.error) return String(body.error);
      if (body?.message) return String(body.message);
    } catch {
      // Fall through to the SDK error message.
    }
  }

  return error instanceof Error ? error.message : String(error ?? 'Request failed');
}

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

export async function mergeCustomers(
  primaryCustomerId: string,
  duplicateCustomerId: string,
  fieldSources: Record<string, 'primary' | 'duplicate'> = {},
) {
  const { error } = await supabase.rpc('cms_merge_customers_with_choices', {
    p_primary_customer_id: primaryCustomerId,
    p_duplicate_customer_id: duplicateCustomerId,
    p_field_sources: fieldSources,
  });

  if (error) throw error;
}

export async function resolveLicensePlateConflict(
  licensePlate: string,
  resolution: 'shared' | 'moved_to_customer',
  primaryCustomerId?: string | null,
) {
  const { data, error } = await supabase.rpc('cms_resolve_license_plate_conflict', {
    p_license_plate: licensePlate,
    p_resolution: resolution,
    p_primary_customer_id: primaryCustomerId ?? null,
  });

  if (error) throw error;
  return data;
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
      action: 'create',
      email,
      role,
      displayName,
      permissions,
    },
  });

  if (error) throw new Error(await getFunctionErrorMessage(error));
  if ((data as any)?.error) throw new Error(String((data as any).error));
  return String((data as any)?.userId ?? '');
}

export async function sendStaffAccountSetupLink(email: string) {
  const { data, error } = await supabase.functions.invoke('cms_account_invite', {
    method: 'POST',
    body: {
      action: 'send_setup_link',
      email,
    },
  });

  if (error) throw new Error(await getFunctionErrorMessage(error));
  if ((data as any)?.error) throw new Error(String((data as any).error));
}

export async function deleteStaffAccount(profileId: string) {
  const { data, error } = await supabase.functions.invoke('cms_account_action', {
    method: 'POST',
    body: {
      action: 'delete',
      targetProfileId: profileId,
    },
  });

  if (error) throw new Error(await getFunctionErrorMessage(error));
  if ((data as any)?.error) throw new Error(String((data as any).error));
}

export interface StaffMfaStatus {
  enabled: boolean;
  verifiedTotpCount: number;
  pendingTotpCount: number;
  factorCount: number;
  updatedAt: string | null;
}

function normalizeStaffMfaStatus(data: any): StaffMfaStatus {
  return {
    enabled: Boolean(data?.enabled),
    verifiedTotpCount: Number(data?.verifiedTotpCount ?? 0) || 0,
    pendingTotpCount: Number(data?.pendingTotpCount ?? 0) || 0,
    factorCount: Number(data?.factorCount ?? 0) || 0,
    updatedAt: typeof data?.updatedAt === 'string' ? data.updatedAt : null,
  };
}

export async function getStaffMfaStatus(profileId: string) {
  const { data, error } = await supabase.functions.invoke('cms_account_mfa', {
    method: 'POST',
    body: {
      action: 'status',
      targetProfileId: profileId,
    },
  });

  if (error) throw new Error(await getFunctionErrorMessage(error));
  if ((data as any)?.error) throw new Error(String((data as any).error));
  return normalizeStaffMfaStatus(data);
}

export async function resetStaffMfa(profileId: string) {
  const { data, error } = await supabase.functions.invoke('cms_account_mfa', {
    method: 'POST',
    body: {
      action: 'reset',
      targetProfileId: profileId,
    },
  });

  if (error) throw new Error(await getFunctionErrorMessage(error));
  if ((data as any)?.error) throw new Error(String((data as any).error));
  return normalizeStaffMfaStatus(data);
}

export async function changeCmsAccountPassword(password: string, targetProfileId?: string | null) {
  const { data, error } = await supabase.functions.invoke('cms_account_password', {
    method: 'POST',
    body: {
      password,
      targetProfileId: targetProfileId ?? null,
    },
  });

  if (error) throw new Error(await getFunctionErrorMessage(error));
  if ((data as any)?.error) throw new Error(String((data as any).error));
}

export async function requestCmsAccountRecovery(email: string) {
  const { data, error } = await supabase.functions.invoke('cms_account_recovery', {
    method: 'POST',
    body: {
      email: email.trim(),
    },
  });

  if (error) throw new Error(await getFunctionErrorMessage(error));
  if ((data as any)?.error) throw new Error(String((data as any).error));
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

export async function linkCustomerAccountByEmail(customerId: string, email: string, portalEnabled = true) {
  const { data, error } = await supabase.rpc('cms_link_customer_account_by_email', {
    p_customer_id: customerId,
    p_email: email.trim(),
    p_portal_enabled: portalEnabled,
  });

  if (error) throw error;
  return String(data ?? '');
}

export async function createCustomerPortalAccount(customerId: string, email: string, displayName = '') {
  const { data, error } = await supabase.functions.invoke('cms_customer_portal_account', {
    method: 'POST',
    body: {
      action: 'create_or_link',
      customerId,
      email: email.trim(),
      displayName: displayName.trim(),
    },
  });

  if (error) throw new Error(await getFunctionErrorMessage(error));
  if ((data as any)?.error) throw new Error(String((data as any).error));
  return String((data as any)?.userId ?? '');
}

export async function sendCustomerPortalActivationLink(customerId: string, email: string, displayName = '') {
  const { data, error } = await supabase.functions.invoke('cms_customer_portal_account', {
    method: 'POST',
    body: {
      action: 'send_activation_link',
      customerId,
      email: email.trim(),
      displayName: displayName.trim(),
    },
  });

  if (error) throw new Error(await getFunctionErrorMessage(error));
  if ((data as any)?.error) throw new Error(String((data as any).error));
}

export async function setCustomerPortalEnabled(customerId: string, portalEnabled: boolean) {
  const { error } = await supabase.rpc('cms_set_customer_portal_enabled', {
    p_customer_id: customerId,
    p_portal_enabled: portalEnabled,
  });

  if (error) throw error;
}

export async function adjustCustomerBenefitPoints(customerId: string, pointsDelta: number, reason: string) {
  const { data, error } = await supabase.rpc('cms_adjust_customer_benefit_points', {
    p_customer_id: customerId,
    p_points_delta: Math.trunc(pointsDelta),
    p_reason: reason.trim(),
    p_details: {},
  });

  if (error) throw error;
  return data;
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
  return (Array.isArray(data) ? data : [])
    .map(normalizeLicensePlateConflict)
    .filter((row): row is LicensePlateConflict => row !== null);
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

export async function lookupCustomerVehicleByPlate(licensePlate: string) {
  const { data, error } = await supabase.rpc('cms_lookup_customer_vehicle_by_plate', {
    p_license_plate: licensePlate.trim(),
  });

  if (error) throw error;
  const rows = Array.isArray(data) ? data : [];
  return normalizeCustomerVehiclePlateLookup(rows[0]);
}

function partsFromText(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((label) => ({ label }));
}

function optionalPositiveInteger(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 0 || String(parsed) !== trimmed) {
    throw new Error(`${label} must be a positive whole number.`);
  }
  return parsed;
}

function optionalTimestamp(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Next email time is not valid.');
  }
  return parsed.toISOString();
}

export async function listCustomerServiceBookEntries(customerId: string) {
  const { data, error } = await supabase
    .from('customer_service_book_entries')
    .select('*')
    .eq('customer_id', customerId)
    .order('work_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (Array.isArray(data) ? data : []).map(normalizeServiceBookEntry).filter((row) => row !== null);
}

export async function saveCustomerServiceBookEntry(draft: CustomerServiceBookDraft) {
  const mileage = draft.mileageKm.trim() ? Number.parseInt(draft.mileageKm, 10) : null;
  if (mileage !== null && (!Number.isFinite(mileage) || mileage < 0)) {
    throw new Error('Mileage must be a positive whole number.');
  }

  const title = draft.title.trim();
  if (!title) {
    throw new Error('Service book title is required.');
  }

  const { data, error } = await supabase.rpc('cms_upsert_customer_service_book_entry', {
    p_entry_id: draft.id,
    p_customer_id: draft.customerId,
    p_customer_vehicle_id: draft.customerVehicleId || null,
    p_entry_type: draft.entryType,
    p_title: title,
    p_description: draft.description.trim() || null,
    p_work_date: draft.workDate || null,
    p_mileage_km: mileage,
    p_parts: partsFromText(draft.partsText),
    p_staff_notes: draft.staffNotes.trim() || null,
    p_visible_to_customer: draft.visibleToCustomer,
  });

  if (error) throw error;
  return String(data ?? draft.id ?? '');
}

export async function deleteCustomerServiceBookEntry(entryId: string, customerId: string) {
  const { error } = await supabase.rpc('cms_delete_customer_service_book_entry', {
    p_entry_id: entryId,
    p_customer_id: customerId,
  });

  if (error) throw error;
}

export async function listCustomerMaintenanceReminders(customerId: string) {
  const { data, error } = await supabase
    .from('customer_maintenance_reminders')
    .select('*')
    .eq('customer_id', customerId)
    .order('status', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (Array.isArray(data) ? data : []).map(normalizeMaintenanceReminder).filter((row) => row !== null);
}

export async function saveCustomerMaintenanceReminder(draft: CustomerMaintenanceReminderDraft) {
  const dueMileageKm = optionalPositiveInteger(draft.dueMileageKm, 'Due mileage');
  const lastKnownMileageKm = optionalPositiveInteger(draft.lastKnownMileageKm, 'Last known mileage');
  const nextEmailAt = optionalTimestamp(draft.nextEmailAt);
  const title = draft.title.trim();
  const reminderType = draft.reminderType.trim() || 'maintenance';

  if (!title) {
    throw new Error('Reminder title is required.');
  }

  if (!draft.dueDate && dueMileageKm === null && nextEmailAt === null) {
    throw new Error('Set a due date, due mileage, or next email time.');
  }

  const { data, error } = await supabase.rpc('cms_upsert_customer_maintenance_reminder', {
    p_reminder_id: draft.id,
    p_customer_id: draft.customerId,
    p_customer_vehicle_id: draft.customerVehicleId || null,
    p_reminder_type: reminderType,
    p_title: title,
    p_description: draft.description.trim() || null,
    p_due_date: draft.dueDate || null,
    p_due_mileage_km: dueMileageKm,
    p_last_known_mileage_km: lastKnownMileageKm,
    p_status: draft.status,
    p_service_critical: draft.serviceCritical,
    p_next_email_at: nextEmailAt,
  });

  if (error) throw error;
  return String(data ?? draft.id ?? '');
}

export async function deleteCustomerMaintenanceReminder(reminderId: string, customerId: string) {
  const { error } = await supabase.rpc('cms_delete_customer_maintenance_reminder', {
    p_reminder_id: reminderId,
    p_customer_id: customerId,
  });

  if (error) throw error;
}

export async function listCustomerNotificationHistory(customerId: string) {
  const { data, error } = await supabase
    .from('customer_notification_history')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(80);

  if (error) throw error;
  return (Array.isArray(data) ? data : []).map(normalizeNotificationHistoryRow).filter((row) => row !== null);
}

export async function addCustomerNote(customerId: string, body: string, visibility: CustomerNoteVisibility) {
  const { error } = await supabase.rpc('cms_add_customer_note', {
    p_customer_id: customerId,
    p_body: body,
    p_visibility: visibility,
  });

  if (error) throw error;
}
