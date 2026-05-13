import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, EyeOff, Plus, Save, Trash2 } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { SERVICE_BOOK_ENTRY_TYPES } from './constants';
import { deleteCustomerServiceBookEntry, listCustomerServiceBookEntries, saveCustomerServiceBookEntry } from './api';
import { buildServiceBookDraft, formatDate } from './safe';
import type { CustomerServiceBookDraft, CustomerServiceBookEntry, CustomerVehicleRow, ServiceBookEntryType } from './types';

type CustomerServiceBookPanelProps = {
  customerId: string;
  vehicles: CustomerVehicleRow[];
};

function partLabels(entry: CustomerServiceBookEntry) {
  return entry.parts
    .map((part) => {
      if (typeof part === 'string') return part;
      if (part && typeof part === 'object' && 'label' in part) return String((part as any).label ?? '').trim();
      return '';
    })
    .filter(Boolean);
}

export function CustomerServiceBookPanel({ customerId, vehicles }: CustomerServiceBookPanelProps) {
  const [entries, setEntries] = useState<CustomerServiceBookEntry[]>([]);
  const [draft, setDraft] = useState<CustomerServiceBookDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const activeVehicles = useMemo(() => vehicles.filter((vehicle) => !vehicle.hidden), [vehicles]);

  const loadEntries = async () => {
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      setEntries(await listCustomerServiceBookEntries(customerId));
    } catch (err: any) {
      setError(err.message ?? 'Failed to load service book entries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setDraft(null);
    void loadEntries();
    // customerId intentionally drives reload; loadEntries captures current state only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const saveDraft = async () => {
    if (!draft || saving) return;
    setSaving(true);
    setError('');

    try {
      await saveCustomerServiceBookEntry(draft);
      setDraft(null);
      setEntries(await listCustomerServiceBookEntries(customerId));
    } catch (err: any) {
      setError(err.message ?? 'Failed to save service book entry.');
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (entry: CustomerServiceBookEntry) => {
    if (saving) return;
    if (!window.confirm(`Delete service book entry "${entry.title}"?`)) return;
    setSaving(true);
    setError('');

    try {
      await deleteCustomerServiceBookEntry(entry.id, customerId);
      setEntries(await listCustomerServiceBookEntries(customerId));
      if (draft?.id === entry.id) setDraft(null);
    } catch (err: any) {
      setError(err.message ?? 'Failed to delete service book entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 border-t pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-foreground">Digital service book</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={loadEntries} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button size="sm" onClick={() => setDraft(buildServiceBookDraft(customerId, null))}>
            <Plus className="mr-2 h-4 w-4" />
            Add entry
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {draft ? (
        <div className="grid gap-3 rounded-md border bg-muted/20 p-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Type</Label>
            <select
              value={draft.entryType}
              onChange={(event) => setDraft((current) => current ? { ...current, entryType: event.target.value as ServiceBookEntryType } : current)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              {SERVICE_BOOK_ENTRY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Vehicle</Label>
            <select
              value={draft.customerVehicleId ?? ''}
              onChange={(event) => setDraft((current) => current ? { ...current, customerVehicleId: event.target.value || null } : current)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">No vehicle link</option>
              {activeVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.licensePlate} {vehicle.vehicleName ? `- ${vehicle.vehicleName}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Title</Label>
            <Input value={draft.title} onChange={(event) => setDraft((current) => current ? { ...current, title: event.target.value } : current)} placeholder="Oil change, tire change, brake inspection" />
          </div>
          <div className="space-y-2">
            <Label>Work date</Label>
            <Input type="date" value={draft.workDate} onChange={(event) => setDraft((current) => current ? { ...current, workDate: event.target.value } : current)} />
          </div>
          <div className="space-y-2">
            <Label>Mileage km</Label>
            <Input type="number" min="0" step="1" value={draft.mileageKm} onChange={(event) => setDraft((current) => current ? { ...current, mileageKm: event.target.value } : current)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <textarea
              value={draft.description}
              onChange={(event) => setDraft((current) => current ? { ...current, description: event.target.value } : current)}
              rows={3}
              className="min-h-[84px] w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Parts, one per line</Label>
            <textarea
              value={draft.partsText}
              onChange={(event) => setDraft((current) => current ? { ...current, partsText: event.target.value } : current)}
              rows={4}
              className="min-h-[104px] w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Internal staff notes</Label>
            <textarea
              value={draft.staffNotes}
              onChange={(event) => setDraft((current) => current ? { ...current, staffNotes: event.target.value } : current)}
              rows={4}
              className="min-h-[104px] w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.visibleToCustomer}
              onChange={(event) => setDraft((current) => current ? { ...current, visibleToCustomer: event.target.checked } : current)}
            />
            Visible to customer portal
          </label>
          <div className="flex gap-2 md:col-span-2">
            <Button size="sm" onClick={saveDraft} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save entry'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
          </div>
        </div>
      ) : null}

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No service book entries saved.</p>
      ) : entries.map((entry) => {
        const vehicle = vehicles.find((item) => item.id === entry.customerVehicleId);
        const parts = partLabels(entry);
        return (
          <div key={entry.id} className="rounded-md border px-3 py-3 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{entry.title}</span>
                  <Badge variant="outline" className="capitalize">{entry.entryType}</Badge>
                  {!entry.visibleToCustomer ? (
                    <Badge variant="secondary">
                      <EyeOff className="mr-1 h-3 w-3" />
                      Hidden
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {entry.workDate || 'No work date'} {entry.mileageKm !== null ? `- ${entry.mileageKm} km` : ''}
                  {vehicle ? ` - ${vehicle.licensePlate}` : ''}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setDraft(buildServiceBookDraft(customerId, entry))}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => deleteEntry(entry)} disabled={saving}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {entry.description ? <p className="mt-2 whitespace-pre-wrap leading-6">{entry.description}</p> : null}
            {parts.length ? <p className="mt-2 text-xs text-muted-foreground">Parts: {parts.join(', ')}</p> : null}
            {entry.staffNotes ? <p className="mt-2 text-xs text-muted-foreground">Staff notes: {entry.staffNotes}</p> : null}
            <p className="mt-2 text-xs text-muted-foreground">Updated {formatDate(entry.updatedAt ?? entry.createdAt)}</p>
          </div>
        );
      })}
    </div>
  );
}
