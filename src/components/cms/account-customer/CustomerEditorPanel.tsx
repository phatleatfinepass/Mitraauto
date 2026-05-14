import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BadgePercent, EyeOff, FileText, Link2, ListPlus, Plus, Save, Search, ShieldAlert, UserRound } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { CUSTOMER_STATUSES, CUSTOMER_TYPES } from './constants';
import {
  addCustomerNote,
  adjustCustomerBenefitPoints,
  bulkImportCustomerPlates,
  createCustomerPortalAccount,
  getCustomerDetail,
  linkCustomerAccountByEmail,
  lookupCustomerVehicleByPlate,
  saveCustomer,
  saveCustomerVehicle,
  sendCustomerPortalActivationLink,
  setCustomerPortalEnabled,
  setCustomerStatus,
} from './api';
import { CustomerHistoryPanel } from './CustomerHistoryPanel';
import { CustomerLinkSuggestionsPanel } from './CustomerLinkSuggestionsPanel';
import { CustomerMaintenanceReminderPanel } from './CustomerMaintenanceReminderPanel';
import { CustomerNotificationHistoryPanel } from './CustomerNotificationHistoryPanel';
import { CustomerServiceBookPanel } from './CustomerServiceBookPanel';
import { buildCustomerDraft, buildCustomerDraftFromOverview, buildVehicleDraft, formatDate } from './safe';
import { lookupVehicleTyreFitment, normalizePlate } from '../../../utils/vehicleFitmentLookup';
import type { VehicleTyreLookupResult } from '../../../utils/vehicleFitmentLookup';
import type {
  CustomerDetail,
  CustomerDraft,
  CustomerNoteVisibility,
  CustomerOverviewRow,
  CustomerStatus,
  CustomerVehiclePlateLookupRow,
  CustomerVehicleDraft,
  CustomerVehicleRow,
} from './types';

type CustomerEditorPanelProps = {
  overviewRow: CustomerOverviewRow | null;
  onSaved: (customerId?: string | null) => void;
  canWriteCustomers: boolean;
};

type CustomerDetailTab = 'detail' | 'vehicles' | 'serviceBook' | 'reminders' | 'notifications' | 'history';
type VehicleLookupDetails =
  | { source: 'cms'; vehicle: CustomerVehiclePlateLookupRow }
  | { source: 'provider'; vehicle: VehicleTyreLookupResult; localVehicle?: CustomerVehiclePlateLookupRow | null };

function consentValue(value: boolean | null) {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  return 'unknown';
}

function parseConsentValue(value: string) {
  if (value === 'yes') return true;
  if (value === 'no') return false;
  return null;
}

function displayLookupValue(value: unknown, suffix = '') {
  if (value === null || value === undefined || value === '') return '-';
  return `${value}${suffix}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function formatVehicleProviderLabel(value: string) {
  return value
    .replace(/^attributes\./i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatVehicleProviderValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (Array.isArray(value)) {
    return value
      .map((item) => formatVehicleProviderValue(item))
      .filter(Boolean)
      .join(', ');
  }
  if (isPlainObject(value)) {
    return Object.entries(value)
      .map(([key, child]) => {
        const formatted = formatVehicleProviderValue(child);
        return formatted ? `${formatVehicleProviderLabel(key)}: ${formatted}` : '';
      })
      .filter(Boolean)
      .join('; ');
  }
  return String(value).trim();
}

function collectVehicleProviderEntries(vehicle: VehicleTyreLookupResult) {
  const normalizedKeys = new Set([
    'plate',
    'country',
    'description',
    'vin',
    'make',
    'model',
    'year',
    'model_year',
    'registration_year',
    'variant',
    'trim',
    'wheel_size',
    'wheel_size_array',
    'tire_size',
    'tyre_size',
    'max_weight_kg',
    'weight_empty_kg',
    'max_speed_kmh',
    'power',
    'engine_size',
    'engine_size_cc',
  ]);
  const entries: Array<{ key: string; label: string; value: string }> = [];
  const seen = new Set<string>();

  const addEntry = (key: string, value: unknown, source = '') => {
    const normalizedKey = key.toLowerCase();
    if (normalizedKeys.has(normalizedKey) || normalizedKey.includes('plate')) return;
    const formattedValue = formatVehicleProviderValue(value);
    if (!formattedValue || formattedValue === '-' || formattedValue === '[object Object]') return;

    const dedupeKey = `${normalizedKey}:${formattedValue}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    entries.push({
      key: `${source}${key}`,
      label: formatVehicleProviderLabel(key),
      value: formattedValue,
    });
  };

  const addObject = (source: string, value: unknown) => {
    if (!isPlainObject(value)) return;
    Object.entries(value).forEach(([key, child]) => {
      if (isPlainObject(child) && (key === 'attributes' || key === 'Attributes')) {
        Object.entries(child).forEach(([attributeKey, attributeValue]) => addEntry(attributeKey, attributeValue, `${source}.attributes.`));
        return;
      }
      addEntry(key, child, `${source}.`);
    });
  };

  addObject('specifications', vehicle.specifications);
  addObject('plateDecoder', vehicle.lookups?.plateDecoder);
  addObject('vinDecoder', vehicle.lookups?.internationalVinDecoder);
  addObject('specificationLookup', vehicle.lookups?.specifications);

  return entries
    .filter((entry) => entry.value.length <= 240)
    .slice(0, 80);
}

export function CustomerEditorPanel({ overviewRow, onSaved, canWriteCustomers }: CustomerEditorPanelProps) {
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [draft, setDraft] = useState<CustomerDraft>(() => buildCustomerDraftFromOverview(null));
  const [vehicleDraft, setVehicleDraft] = useState<CustomerVehicleDraft | null>(null);
  const [vehicleLookupLoading, setVehicleLookupLoading] = useState(false);
  const [vehicleLookupMessage, setVehicleLookupMessage] = useState('');
  const [vehicleLookupDetails, setVehicleLookupDetails] = useState<VehicleLookupDetails | null>(null);
  const [lastVehicleLookupPlate, setLastVehicleLookupPlate] = useState('');
  const [initialVehicleDraft, setInitialVehicleDraft] = useState({
    licensePlate: '',
    vehicleName: '',
    vin: '',
  });
  const [noteBody, setNoteBody] = useState('');
  const [noteVisibility, setNoteVisibility] = useState<CustomerNoteVisibility>('internal');
  const [bulkPlates, setBulkPlates] = useState('');
  const [bulkVehicleName, setBulkVehicleName] = useState('');
  const [bulkResult, setBulkResult] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountActionMessage, setAccountActionMessage] = useState('');
  const [benefitDelta, setBenefitDelta] = useState('');
  const [benefitReason, setBenefitReason] = useState('');
  const [mappingRefreshKey, setMappingRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<CustomerDetailTab>('detail');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCustomerId = overviewRow?.customerId ?? null;
  const hasSavedCustomer = Boolean(draft.id);

  useEffect(() => {
    let active = true;
    setError(null);
    setDetail(null);
    setVehicleDraft(null);
    setVehicleLookupMessage('');
    setVehicleLookupDetails(null);
    setLastVehicleLookupPlate('');
    setBulkResult('');
    setAccountEmail('');
    setAccountActionMessage('');
    setBenefitDelta('');
    setBenefitReason('');
    setMappingRefreshKey(0);
    setActiveTab('detail');

    if (!overviewRow) {
      setDraft(buildCustomerDraftFromOverview(null));
      setInitialVehicleDraft({ licensePlate: '', vehicleName: '', vin: '' });
      return () => {
        active = false;
      };
    }

    setDraft(buildCustomerDraftFromOverview(overviewRow));

    if (!overviewRow.customerId) {
      return () => {
        active = false;
      };
    }

    setLoadingDetail(true);
    getCustomerDetail(overviewRow.customerId)
      .then((nextDetail) => {
        if (!active) return;
        setDetail(nextDetail);
        if (nextDetail) {
          setDraft(buildCustomerDraft(nextDetail));
          setAccountEmail(nextDetail.accountEmail || nextDetail.primaryEmail || '');
        }
      })
      .catch((err: any) => {
        if (!active) return;
        setError(err.message ?? 'Failed to load customer detail.');
      })
      .finally(() => {
        if (active) setLoadingDetail(false);
      });

    return () => {
      active = false;
    };
  }, [overviewRow]);

  const activeVehicles = useMemo(
    () => detail?.vehicles.filter((vehicle) => !vehicle.hidden) ?? [],
    [detail],
  );

  const benefitSummary = detail?.benefits ?? {
    discountPercent: overviewRow?.benefitDiscountPercent ?? 0,
    lifetimePoints: overviewRow?.benefitPoints ?? 0,
    pointsBalance: overviewRow?.benefitPoints ?? 0,
    tier: overviewRow?.benefitTier || 'bronze',
    updatedAt: null,
  };

  const saveDraft = async () => {
    if (saving || !canWriteCustomers) return;
    if (!draft.fullName.trim() && !draft.primaryEmail.trim() && !draft.primaryPhone.trim()) {
      setError('Add at least a name, email, or phone before saving.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const customerId = await saveCustomer(draft);
      if (!draft.id && initialVehicleDraft.licensePlate.trim()) {
        await saveCustomerVehicle({
          id: null,
          customerId,
          licensePlate: initialVehicleDraft.licensePlate,
          vehicleName: initialVehicleDraft.vehicleName,
          vin: initialVehicleDraft.vin,
          notes: '',
          hidden: false,
        });
      }
      const nextDetail = await getCustomerDetail(customerId);
      setDetail(nextDetail);
      if (nextDetail) setDraft(buildCustomerDraft(nextDetail));
      setInitialVehicleDraft({ licensePlate: '', vehicleName: '', vin: '' });
      onSaved(customerId);
    } catch (err: any) {
      setError(err.message ?? 'Failed to save customer.');
    } finally {
      setSaving(false);
    }
  };

  const saveVehicleDraft = async () => {
    if (!vehicleDraft || saving || !canWriteCustomers) return;
    if (!vehicleDraft.licensePlate.trim()) {
      setError('License plate is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await saveCustomerVehicle(vehicleDraft);
      const nextDetail = await getCustomerDetail(vehicleDraft.customerId);
      setDetail(nextDetail);
      setVehicleDraft(null);
      onSaved();
    } catch (err: any) {
      setError(err.message ?? 'Failed to save vehicle.');
    } finally {
      setSaving(false);
    }
  };

  const addNote = async () => {
    if (!draft.id || saving || !canWriteCustomers) return;
    if (!noteBody.trim()) {
      setError('Note body is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await addCustomerNote(draft.id, noteBody, noteVisibility);
      const nextDetail = await getCustomerDetail(draft.id);
      setDetail(nextDetail);
      setNoteBody('');
    } catch (err: any) {
      setError(err.message ?? 'Failed to add note.');
    } finally {
      setSaving(false);
    }
  };

  const quickStatus = async (status: CustomerStatus, hidden?: boolean) => {
    if (!draft.id || saving || !canWriteCustomers) return;
    setSaving(true);
    setError(null);

    try {
      await setCustomerStatus(draft.id, status, hidden);
      const nextDetail = await getCustomerDetail(draft.id);
      setDetail(nextDetail);
      if (nextDetail) setDraft(buildCustomerDraft(nextDetail));
      onSaved();
    } catch (err: any) {
      setError(err.message ?? 'Failed to update customer status.');
    } finally {
      setSaving(false);
    }
  };

  const linkAccount = async () => {
    if (!draft.id || saving || !canWriteCustomers) return;
    const email = accountEmail.trim() || draft.primaryEmail.trim();
    if (!email) {
      setError('Auth account email is required.');
      return;
    }

    setSaving(true);
    setError(null);
    setAccountActionMessage('');

    try {
      await linkCustomerAccountByEmail(draft.id, email, true);
      const nextDetail = await getCustomerDetail(draft.id);
      setDetail(nextDetail);
      if (nextDetail) {
        setDraft(buildCustomerDraft(nextDetail));
        setAccountEmail(nextDetail.accountEmail || email);
      }
      setAccountActionMessage('Customer account linked and portal access enabled.');
      onSaved(draft.id);
    } catch (err: any) {
      setError(err.message ?? 'Failed to link customer account.');
    } finally {
      setSaving(false);
    }
  };

  const createPortalAccount = async () => {
    if (!draft.id || saving || !canWriteCustomers) return;
    const email = accountEmail.trim() || draft.primaryEmail.trim();
    if (!email) {
      setError('Customer email is required before creating a portal account.');
      return;
    }

    setSaving(true);
    setError(null);
    setAccountActionMessage('');

    try {
      await createCustomerPortalAccount(draft.id, email, draft.fullName);
      const nextDetail = await getCustomerDetail(draft.id);
      setDetail(nextDetail);
      if (nextDetail) {
        setDraft(buildCustomerDraft(nextDetail));
        setAccountEmail(nextDetail.accountEmail || email);
      }
      setAccountActionMessage('Customer portal account created and activation link sent.');
      onSaved(draft.id);
    } catch (err: any) {
      setError(err.message ?? 'Failed to create customer portal account.');
    } finally {
      setSaving(false);
    }
  };

  const sendActivationLink = async () => {
    if (!draft.id || saving || !canWriteCustomers) return;
    const email = accountEmail.trim() || detail?.accountEmail || draft.primaryEmail.trim();
    if (!email) {
      setError('Customer email is required before sending an activation link.');
      return;
    }

    setSaving(true);
    setError(null);
    setAccountActionMessage('');

    try {
      await sendCustomerPortalActivationLink(draft.id, email, draft.fullName);
      const nextDetail = await getCustomerDetail(draft.id);
      setDetail(nextDetail);
      if (nextDetail) {
        setDraft(buildCustomerDraft(nextDetail));
        setAccountEmail(nextDetail.accountEmail || email);
      }
      setAccountActionMessage('Customer portal activation link sent.');
      onSaved(draft.id);
    } catch (err: any) {
      setError(err.message ?? 'Failed to send customer portal activation link.');
    } finally {
      setSaving(false);
    }
  };

  const togglePortal = async () => {
    if (!draft.id || saving || !canWriteCustomers) return;
    setSaving(true);
    setError(null);
    setAccountActionMessage('');

    try {
      await setCustomerPortalEnabled(draft.id, !detail?.portalEnabled);
      const nextDetail = await getCustomerDetail(draft.id);
      setDetail(nextDetail);
      if (nextDetail) setDraft(buildCustomerDraft(nextDetail));
      onSaved(draft.id);
    } catch (err: any) {
      setError(err.message ?? 'Failed to update customer portal access.');
    } finally {
      setSaving(false);
    }
  };

  const adjustBenefits = async () => {
    if (!draft.id || saving || !canWriteCustomers) return;
    const delta = Number.parseInt(benefitDelta, 10);
    if (!Number.isFinite(delta) || delta === 0) {
      setError('Point adjustment must be a non-zero whole number.');
      return;
    }
    if (!benefitReason.trim()) {
      setError('Point adjustment reason is required for audit history.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await adjustCustomerBenefitPoints(draft.id, delta, benefitReason);
      const nextDetail = await getCustomerDetail(draft.id);
      setDetail(nextDetail);
      setBenefitDelta('');
      setBenefitReason('');
      onSaved(draft.id);
    } catch (err: any) {
      setError(err.message ?? 'Failed to adjust customer benefit points.');
    } finally {
      setSaving(false);
    }
  };

  const startVehicleEdit = (vehicle?: CustomerVehicleRow) => {
    if (!draft.id) {
      setError('Save the customer before adding vehicles.');
      return;
    }
    if (!canWriteCustomers) {
      setError('Customer write access is required.');
      return;
    }
    setVehicleDraft(buildVehicleDraft(draft.id, vehicle ?? null));
    setVehicleLookupMessage('');
    setVehicleLookupDetails(null);
    setLastVehicleLookupPlate('');
  };

  const lookupVehicleDraftByPlate = async () => {
    if (!vehicleDraft || vehicleLookupLoading || !canWriteCustomers) return;
    const normalizedPlate = normalizePlate(vehicleDraft.licensePlate, 'FI');
    const compactPlate = normalizedPlate.replace(/[^A-Z0-9]/g, '');
    if (compactPlate.length < 2) {
      setError('License plate is required before lookup.');
      return;
    }

    setVehicleLookupLoading(true);
    setVehicleLookupMessage('');
    setVehicleLookupDetails(null);
    setError(null);

    try {
      const localVehicle = await lookupCustomerVehicleByPlate(normalizedPlate);
      if (localVehicle) {
        setVehicleDraft((current) => current ? {
          ...current,
          licensePlate: localVehicle.licensePlate || normalizedPlate,
          vehicleName: localVehicle.vehicleName || current.vehicleName,
          vin: localVehicle.vin || current.vin,
          notes: localVehicle.customerId === current.customerId && localVehicle.notes ? localVehicle.notes : current.notes,
        } : current);
      }

      const externalVehicle = await lookupVehicleTyreFitment(normalizedPlate, 'FI');
      setLastVehicleLookupPlate(normalizePlate(externalVehicle.plate || normalizedPlate, 'FI'));
      const vehicleName = [
        externalVehicle.year,
        externalVehicle.make,
        externalVehicle.model,
        externalVehicle.variant,
      ].filter(Boolean).join(' ') || externalVehicle.description || '';

      setVehicleDraft((current) => current ? {
        ...current,
        licensePlate: normalizePlate(externalVehicle.plate || normalizedPlate, 'FI'),
        vehicleName: vehicleName || current.vehicleName,
          vin: externalVehicle.vin || current.vin,
      } : current);
      if (localVehicle) {
        const owner = [localVehicle.customerName, localVehicle.customerEmail].filter(Boolean).join(' / ');
        setVehicleLookupMessage(`Found CMS vehicle${owner ? ` under ${owner}` : ''}. Technical car data loaded from the plate lookup provider/cache.`);
      } else {
        setVehicleLookupMessage('No saved CMS vehicle found. Technical car data loaded from the plate lookup provider/cache.');
      }
      setVehicleLookupDetails({ source: 'provider', vehicle: externalVehicle, localVehicle });
    } catch (err: any) {
      const message = err.message ?? 'Failed to lookup vehicle by license plate.';
      const normalizedPlateForFallback = normalizePlate(vehicleDraft.licensePlate, 'FI');
      const localVehicle = await lookupCustomerVehicleByPlate(normalizedPlateForFallback).catch(() => null);
      if (localVehicle) {
        setLastVehicleLookupPlate(normalizedPlateForFallback);
        setVehicleLookupMessage(`Found CMS vehicle, but technical car lookup failed: ${message}`);
        setVehicleLookupDetails({ source: 'cms', vehicle: localVehicle });
      } else {
        setError(message);
      }
    } finally {
      setVehicleLookupLoading(false);
    }
  };

  useEffect(() => {
    if (!vehicleDraft || activeTab !== 'vehicles' || vehicleLookupLoading || !canWriteCustomers) return;
    const normalizedPlate = normalizePlate(vehicleDraft.licensePlate, 'FI');
    const compactPlate = normalizedPlate.replace(/[^A-Z0-9]/g, '');
    if (compactPlate.length < 5 || normalizedPlate === lastVehicleLookupPlate) return;

    const timer = window.setTimeout(() => {
      void lookupVehicleDraftByPlate();
    }, 700);

    return () => window.clearTimeout(timer);
  }, [vehicleDraft?.licensePlate, activeTab, canWriteCustomers, lastVehicleLookupPlate, vehicleLookupLoading]);

  const renderVehicleLookupDetails = () => {
    if (!vehicleLookupDetails) return null;

    if (vehicleLookupDetails.source === 'cms') {
      const vehicle = vehicleLookupDetails.vehicle;
      const owner = [vehicle.customerName, vehicle.customerEmail].filter(Boolean).join(' / ');
      return (
        <div className="rounded-md border bg-muted/20 p-3 md:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h5 className="text-sm font-semibold text-foreground">Vehicle information</h5>
            <Badge variant="secondary">CMS database</Badge>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div><span className="text-muted-foreground">License plate: </span>{displayLookupValue(vehicle.licensePlate)}</div>
            <div><span className="text-muted-foreground">Vehicle name: </span>{displayLookupValue(vehicle.vehicleName)}</div>
            <div><span className="text-muted-foreground">VIN: </span>{displayLookupValue(vehicle.vin)}</div>
            <div><span className="text-muted-foreground">Owner: </span>{displayLookupValue(owner)}</div>
            <div><span className="text-muted-foreground">Phone: </span>{displayLookupValue(vehicle.customerPhone)}</div>
            <div><span className="text-muted-foreground">Customer status: </span>{displayLookupValue(vehicle.customerStatus)}</div>
            <div><span className="text-muted-foreground">Updated: </span>{formatDate(vehicle.updatedAt)}</div>
            <div><span className="text-muted-foreground">Hidden: </span>{vehicle.hidden ? 'Yes' : 'No'}</div>
            {vehicle.notes ? (
              <div className="sm:col-span-2"><span className="text-muted-foreground">Notes: </span>{vehicle.notes}</div>
            ) : null}
          </div>
        </div>
      );
    }

    const vehicle = vehicleLookupDetails.vehicle;
    const localVehicle = vehicleLookupDetails.source === 'provider' ? vehicleLookupDetails.localVehicle : null;
    const owner = localVehicle ? [localVehicle.customerName, localVehicle.customerEmail].filter(Boolean).join(' / ') : '';
    const tyreSizes = vehicle.factoryTyreSizes?.length ? vehicle.factoryTyreSizes : vehicle.factoryTyreSize ? [vehicle.factoryTyreSize] : [];
    const providerEntries = collectVehicleProviderEntries(vehicle);
    return (
      <div className="rounded-md border bg-muted/20 p-3 md:col-span-2">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h5 className="text-sm font-semibold text-foreground">Vehicle information</h5>
          <Badge variant="secondary">Plate lookup</Badge>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div><span className="text-muted-foreground">License plate: </span>{displayLookupValue(vehicle.plate)}</div>
          <div><span className="text-muted-foreground">Country: </span>{displayLookupValue(vehicle.country)}</div>
          <div><span className="text-muted-foreground">Description: </span>{displayLookupValue(vehicle.description)}</div>
          <div><span className="text-muted-foreground">VIN: </span>{displayLookupValue(vehicle.vin)}</div>
          <div><span className="text-muted-foreground">Make: </span>{displayLookupValue(vehicle.make)}</div>
          <div><span className="text-muted-foreground">Model: </span>{displayLookupValue(vehicle.model)}</div>
          <div><span className="text-muted-foreground">Year: </span>{displayLookupValue(vehicle.year)}</div>
          <div><span className="text-muted-foreground">Variant: </span>{displayLookupValue(vehicle.variant)}</div>
          <div><span className="text-muted-foreground">Factory tyre sizes: </span>{tyreSizes.length ? tyreSizes.join(', ') : '-'}</div>
          <div><span className="text-muted-foreground">Power: </span>{displayLookupValue(vehicle.powerKw, ' kW')}</div>
          <div><span className="text-muted-foreground">Engine size: </span>{displayLookupValue(vehicle.engineSizeCc, ' cc')}</div>
          <div><span className="text-muted-foreground">Empty weight: </span>{displayLookupValue(vehicle.weightEmptyKg, ' kg')}</div>
          <div><span className="text-muted-foreground">Max weight: </span>{displayLookupValue(vehicle.maxWeightKg, ' kg')}</div>
          <div><span className="text-muted-foreground">Max speed: </span>{displayLookupValue(vehicle.maxSpeedKmh, ' km/h')}</div>
          <div><span className="text-muted-foreground">Source: </span>{displayLookupValue(vehicle.source)}</div>
          {localVehicle ? (
            <>
              <div><span className="text-muted-foreground">CMS owner: </span>{displayLookupValue(owner)}</div>
              <div><span className="text-muted-foreground">CMS updated: </span>{formatDate(localVehicle.updatedAt)}</div>
            </>
          ) : null}
          {vehicle.warnings?.length ? (
            <div className="sm:col-span-2"><span className="text-muted-foreground">Warnings: </span>{vehicle.warnings.join(' ')}</div>
          ) : null}
        </div>
        {providerEntries.length ? (
          <details className="mt-4 rounded-md border bg-background/70 p-3" open>
            <summary className="cursor-pointer text-sm font-semibold text-foreground">Additional provider data</summary>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {providerEntries.map((entry) => (
                <div key={`${entry.key}-${entry.value}`} className="min-w-0">
                  <span className="text-muted-foreground">{entry.label}: </span>
                  <span className="break-words">{entry.value}</span>
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    );
  };

  const importBulkPlates = async () => {
    if (!draft.id || saving || !canWriteCustomers) return;
    if (!bulkPlates.trim()) {
      setError('Add at least one license plate to import.');
      return;
    }

    setSaving(true);
    setError(null);
    setBulkResult('');

    try {
      const results = await bulkImportCustomerPlates(draft.id, bulkPlates, bulkVehicleName);
      const conflictCount = results.filter((row) => row.conflictCustomerCount > 0).length;
      const nextDetail = await getCustomerDetail(draft.id);
      setDetail(nextDetail);
      setBulkPlates('');
      setBulkVehicleName('');
      setBulkResult(`${results.length} plates imported${conflictCount ? `, ${conflictCount} with conflicts` : ''}.`);
      onSaved(draft.id);
    } catch (err: any) {
      setError(err.message ?? 'Failed to import license plates.');
    } finally {
      setSaving(false);
    }
  };

  const handleActivityLinked = () => {
    setMappingRefreshKey((current) => current + 1);
    onSaved(draft.id);
  };

  const tabs: Array<{ id: CustomerDetailTab; label: string; disabled?: boolean }> = [
    { id: 'detail', label: 'Detail' },
    { id: 'vehicles', label: 'Vehicles', disabled: !hasSavedCustomer },
    { id: 'serviceBook', label: 'Service book', disabled: !hasSavedCustomer },
    { id: 'reminders', label: 'Reminders', disabled: !hasSavedCustomer },
    { id: 'notifications', label: 'Notifications', disabled: !hasSavedCustomer },
    { id: 'history', label: 'History', disabled: !hasSavedCustomer },
  ];

  return (
    <aside className="space-y-5 rounded-lg border bg-background p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-foreground">
            {overviewRow ? 'Customer detail' : `New ${draft.customerType} customer`}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {loadingDetail ? 'Loading saved customer data...' : hasSavedCustomer ? 'Saved customer profile.' : 'Create a customer profile. Business fields are optional.'}
          </p>
        </div>
        {draft.status ? <Badge variant={draft.status === 'blocked' || draft.status === 'deleted' ? 'destructive' : 'secondary'}>{draft.status}</Badge> : null}
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      {!canWriteCustomers ? (
        <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          Read-only customer access. Contact Super Admin if this account needs permission to create or edit customer records.
        </div>
      ) : null}

      <div className="flex gap-1 overflow-x-auto border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            onClick={() => setActiveTab(tab.id)}
            className={`h-10 whitespace-nowrap border-b-2 px-3 text-sm ${
              activeTab === tab.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            } ${tab.disabled ? 'cursor-not-allowed opacity-40 hover:text-muted-foreground' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'detail' ? (
        <>
      <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Customer portal & benefits</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={detail?.accountId ? 'secondary' : 'outline'}>
              {detail?.accountId ? 'Account linked' : 'No account'}
            </Badge>
            <Badge variant={detail?.portalEnabled ? 'secondary' : 'outline'}>
              {detail?.portalEnabled ? 'Portal on' : 'Portal off'}
            </Badge>
          </div>
        </div>

        {!hasSavedCustomer ? (
          <p className="text-sm text-muted-foreground">Save the customer before linking a login account or adjusting benefits.</p>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label>Portal account email</Label>
                <Input
                  value={accountEmail}
                  onChange={(event) => setAccountEmail(event.target.value)}
                  disabled={!canWriteCustomers}
                  placeholder={draft.primaryEmail || 'customer@example.com'}
                />
                <p className="text-xs text-muted-foreground">
                  {detail?.accountEmail ? `Linked to ${detail.accountEmail}` : 'Create a customer login account or link an existing customer auth user.'}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <Button variant="outline" onClick={createPortalAccount} disabled={saving || Boolean(detail?.accountId) || !canWriteCustomers} className="justify-start">
                  <UserRound className="mr-2 h-4 w-4" />
                  Create account
                </Button>
                <Button variant="outline" onClick={linkAccount} disabled={saving || !canWriteCustomers} className="justify-start">
                  <Link2 className="mr-2 h-4 w-4" />
                  Link account
                </Button>
                <Button variant="outline" onClick={sendActivationLink} disabled={saving || !detail?.accountId || !canWriteCustomers} className="justify-start">
                  Send activation
                </Button>
                <Button variant="outline" onClick={togglePortal} disabled={saving || !detail?.accountId || !canWriteCustomers} className="justify-start">
                  {detail?.portalEnabled ? 'Disable portal' : 'Enable portal'}
                </Button>
              </div>
            </div>
            {accountActionMessage ? (
              <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
                {accountActionMessage}
              </div>
            ) : null}

            <div className="grid gap-3 rounded-md border bg-background p-3 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <div className="text-xs text-muted-foreground">Points</div>
                <div className="text-lg font-semibold text-foreground">{benefitSummary.pointsBalance}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Tier</div>
                <div className="text-lg font-semibold capitalize text-foreground">{benefitSummary.tier}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Discount</div>
                <div className="text-lg font-semibold text-foreground">{benefitSummary.discountPercent}%</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Lifetime</div>
                <div className="text-lg font-semibold text-foreground">{benefitSummary.lifetimePoints}</div>
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-[130px_minmax(0,1fr)_auto] xl:items-end">
              <div className="space-y-2">
                <Label>Point change</Label>
                <Input
                  type="number"
                  step="1"
                  value={benefitDelta}
                  onChange={(event) => setBenefitDelta(event.target.value)}
                  placeholder="+50"
                />
              </div>
              <div className="space-y-2">
                <Label>Audit reason</Label>
                <Input
                  value={benefitReason}
                  onChange={(event) => setBenefitReason(event.target.value)}
                  placeholder="Service completed, manual correction, campaign benefit"
                />
              </div>
              <Button variant="outline" onClick={adjustBenefits} disabled={saving || !canWriteCustomers} className="justify-start">
                <BadgePercent className="mr-2 h-4 w-4" />
                Adjust points
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Contact</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={draft.fullName} onChange={(event) => setDraft((current) => ({ ...current, fullName: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={draft.primaryEmail} onChange={(event) => setDraft((current) => ({ ...current, primaryEmail: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={draft.primaryPhone} onChange={(event) => setDraft((current) => ({ ...current, primaryPhone: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Input value={draft.language} onChange={(event) => setDraft((current) => ({ ...current, language: event.target.value }))} placeholder="fi / en" />
            </div>
            <div className="space-y-2">
              <Label>Customer type</Label>
              <select
                value={draft.customerType}
                onChange={(event) => setDraft((current) => ({ ...current, customerType: event.target.value as CustomerDraft['customerType'] }))}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {CUSTOMER_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t pt-5">
          <h4 className="text-sm font-semibold text-foreground">Business details optional</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Business ID</Label>
              <Input value={draft.businessId} onChange={(event) => setDraft((current) => ({ ...current, businessId: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>VAT ID</Label>
              <Input value={draft.vatId} onChange={(event) => setDraft((current) => ({ ...current, vatId: event.target.value }))} />
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t pt-5">
          <h4 className="text-sm font-semibold text-foreground">Address</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Input value={draft.addressLine1} onChange={(event) => setDraft((current) => ({ ...current, addressLine1: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Postal code</Label>
              <Input value={draft.postalCode} onChange={(event) => setDraft((current) => ({ ...current, postalCode: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={draft.city} onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={draft.countryCode} onChange={(event) => setDraft((current) => ({ ...current, countryCode: event.target.value.toUpperCase() }))} />
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t pt-5">
          <h4 className="text-sm font-semibold text-foreground">Status & tags</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={draft.status}
                onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as CustomerStatus }))}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {CUSTOMER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <Input value={draft.tagsText} onChange={(event) => setDraft((current) => ({ ...current, tagsText: event.target.value }))} placeholder="fleet, vip, b2b" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.hidden}
            onChange={(event) => setDraft((current) => ({ ...current, hidden: event.target.checked }))}
          />
          Hide customer
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <select
            value={consentValue(draft.marketingConsent)}
            onChange={(event) => setDraft((current) => ({ ...current, marketingConsent: parseConsentValue(event.target.value) }))}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="unknown">Marketing unknown</option>
            <option value="yes">Marketing yes</option>
            <option value="no">Marketing no</option>
          </select>
          <select
            value={consentValue(draft.contactConsent)}
            onChange={(event) => setDraft((current) => ({ ...current, contactConsent: parseConsentValue(event.target.value) }))}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="unknown">Contact unknown</option>
            <option value="yes">Contact yes</option>
            <option value="no">Contact no</option>
          </select>
        </div>
      </div>

      {!draft.id ? (
        <div className="space-y-3 border-t pt-5">
          <h4 className="text-sm font-semibold text-foreground">First vehicle optional</h4>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>License plate</Label>
              <Input
                value={initialVehicleDraft.licensePlate}
                onChange={(event) => setInitialVehicleDraft((current) => ({ ...current, licensePlate: event.target.value.toUpperCase() }))}
                placeholder="ABC-123"
              />
            </div>
            <div className="space-y-2">
              <Label>Vehicle</Label>
              <Input
                value={initialVehicleDraft.vehicleName}
                onChange={(event) => setInitialVehicleDraft((current) => ({ ...current, vehicleName: event.target.value }))}
                placeholder="Toyota Corolla"
              />
            </div>
            <div className="space-y-2">
              <Label>VIN</Label>
              <Input
                value={initialVehicleDraft.vin}
                onChange={(event) => setInitialVehicleDraft((current) => ({ ...current, vin: event.target.value }))}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button onClick={saveDraft} disabled={saving || !canWriteCustomers}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save customer'}
        </Button>
        {draft.id ? (
          <>
            <Button variant="outline" onClick={() => quickStatus('hidden', true)} disabled={saving || !canWriteCustomers}>
              <EyeOff className="mr-2 h-4 w-4" />
              Hide
            </Button>
            <Button variant="outline" onClick={() => quickStatus('blocked', draft.hidden)} disabled={saving || !canWriteCustomers}>
              <ShieldAlert className="mr-2 h-4 w-4" />
              Block
            </Button>
            <Button variant="destructive" onClick={() => quickStatus('deleted', true)} disabled={saving || !canWriteCustomers}>
              Delete
            </Button>
          </>
        ) : null}
      </div>
        </>
      ) : null}

      {draft.id ? (
        <>
          {activeTab === 'vehicles' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-semibold text-foreground">Vehicles</h4>
              <Button variant="outline" size="sm" onClick={() => startVehicleEdit()} disabled={!canWriteCustomers}>
                <Plus className="mr-2 h-4 w-4" />
                Add vehicle
              </Button>
            </div>

            {activeVehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active vehicles saved.</p>
            ) : activeVehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => startVehicleEdit(vehicle)}
                className="flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left hover:bg-muted/60"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{vehicle.licensePlate}</span>
                  <span className="block truncate text-xs text-muted-foreground">{vehicle.vehicleName || vehicle.vin || 'Vehicle'}</span>
                </span>
                <Badge variant="outline">Edit</Badge>
              </button>
            ))}

            {vehicleDraft ? (
              <div className="grid gap-3 rounded-md border p-3 md:grid-cols-2">
                <div className="flex gap-2 md:col-span-2">
                  <Input
                    value={vehicleDraft.licensePlate}
                    onChange={(event) => {
                      setVehicleDraft((current) => current ? { ...current, licensePlate: event.target.value.toUpperCase() } : current);
                      setVehicleLookupMessage('');
                    }}
                    placeholder="License plate"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={lookupVehicleDraftByPlate}
                    disabled={vehicleLookupLoading || saving || !canWriteCustomers || !vehicleDraft.licensePlate.trim()}
                    className="shrink-0"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {vehicleLookupLoading ? 'Looking...' : 'Lookup plate'}
                  </Button>
                </div>
                {vehicleLookupMessage ? (
                  <p className="text-xs text-muted-foreground md:col-span-2">{vehicleLookupMessage}</p>
                ) : null}
                {renderVehicleLookupDetails()}
                <Input value={vehicleDraft.vehicleName} onChange={(event) => setVehicleDraft((current) => current ? { ...current, vehicleName: event.target.value } : current)} placeholder="Vehicle name" />
                <Input value={vehicleDraft.vin} onChange={(event) => setVehicleDraft((current) => current ? { ...current, vin: event.target.value } : current)} placeholder="VIN" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={vehicleDraft.hidden} onChange={(event) => setVehicleDraft((current) => current ? { ...current, hidden: event.target.checked } : current)} />
                  Hide vehicle
                </label>
                <Input value={vehicleDraft.notes} onChange={(event) => setVehicleDraft((current) => current ? { ...current, notes: event.target.value } : current)} placeholder="Vehicle notes" className="md:col-span-2" />
                <div className="flex gap-2 md:col-span-2">
                  <Button size="sm" onClick={saveVehicleDraft} disabled={saving || !canWriteCustomers}>Save vehicle</Button>
                  <Button size="sm" variant="ghost" onClick={() => setVehicleDraft(null)}>Cancel</Button>
                </div>
              </div>
            ) : null}

            {draft.customerType !== 'personal' ? (
              <div className="space-y-3 rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <ListPlus className="h-4 w-4 text-primary" />
                  <h5 className="text-sm font-semibold text-foreground">Bulk license plate import</h5>
                </div>
                <textarea
                  value={bulkPlates}
                  onChange={(event) => setBulkPlates(event.target.value.toUpperCase())}
                  rows={5}
                  className="min-h-[112px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="ABC-123&#10;XYZ-789&#10;FLEET-01"
                />
                <Input
                  value={bulkVehicleName}
                  onChange={(event) => setBulkVehicleName(event.target.value)}
                  placeholder="Optional default vehicle label"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={importBulkPlates} disabled={saving || !canWriteCustomers}>
                    Import plates
                  </Button>
                  {bulkResult ? <span className="text-xs text-muted-foreground">{bulkResult}</span> : null}
                </div>
              </div>
            ) : null}
          </div>
          ) : null}

          {activeTab === 'detail' ? (
          <div className="space-y-3 border-t pt-5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-foreground">Notes</h4>
            </div>

            <div className="grid gap-3">
              <textarea
                value={noteBody}
                onChange={(event) => setNoteBody(event.target.value)}
                rows={3}
                className="min-h-[84px] rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Add internal note"
              />
              <div className="flex flex-wrap gap-2">
                <select
                  value={noteVisibility}
                  onChange={(event) => setNoteVisibility(event.target.value as CustomerNoteVisibility)}
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                >
                  <option value="internal">Internal</option>
                  <option value="super_admin">Super admin</option>
                </select>
                <Button size="sm" onClick={addNote} disabled={saving || !canWriteCustomers}>Add note</Button>
              </div>
            </div>

            {detail?.notes.length ? detail.notes.map((note) => (
              <div key={note.id} className="rounded-md border px-3 py-2 text-sm">
                <div className="mb-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>{note.visibility}</span>
                  <span>{formatDate(note.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap leading-6">{note.body}</p>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No notes saved.</p>
            )}
          </div>
          ) : null}

          {activeTab === 'history' ? (
            <CustomerLinkSuggestionsPanel customerId={draft.id} onLinked={handleActivityLinked} />
          ) : null}

          {activeTab === 'serviceBook' ? (
            <CustomerServiceBookPanel customerId={draft.id} vehicles={detail?.vehicles ?? []} />
          ) : null}

          {activeTab === 'reminders' ? (
            <CustomerMaintenanceReminderPanel customerId={draft.id} vehicles={detail?.vehicles ?? []} />
          ) : null}

          {activeTab === 'notifications' ? (
            <CustomerNotificationHistoryPanel customerId={draft.id} vehicles={detail?.vehicles ?? []} />
          ) : null}

          {activeTab === 'history' ? (
            <CustomerHistoryPanel key={`${draft.id}-${mappingRefreshKey}`} customerId={draft.id} />
          ) : null}
        </>
      ) : (
        <p className="border-t pt-5 text-sm text-muted-foreground">
          Save the customer before adding vehicles or notes.
        </p>
      )}

      {selectedCustomerId && detail?.updatedAt ? (
        <p className="text-xs text-muted-foreground">Updated {formatDate(detail.updatedAt)}</p>
      ) : null}
    </aside>
  );
}
