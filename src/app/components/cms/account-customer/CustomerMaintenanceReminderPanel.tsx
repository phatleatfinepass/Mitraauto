import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, CalendarClock, Plus, Save, Trash2 } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { MAINTENANCE_REMINDER_STATUSES } from './constants';
import { deleteCustomerMaintenanceReminder, listCustomerMaintenanceReminders, saveCustomerMaintenanceReminder } from './api';
import { buildMaintenanceReminderDraft, formatDate } from './safe';
import type { CustomerMaintenanceReminder, CustomerMaintenanceReminderDraft, CustomerVehicleRow, MaintenanceReminderStatus } from './types';

type CustomerMaintenanceReminderPanelProps = {
  customerId: string;
  vehicles: CustomerVehicleRow[];
};

function statusVariant(status: MaintenanceReminderStatus): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'active') return 'default';
  if (status === 'cancelled') return 'destructive';
  if (status === 'completed') return 'secondary';
  return 'outline';
}

export function CustomerMaintenanceReminderPanel({ customerId, vehicles }: CustomerMaintenanceReminderPanelProps) {
  const [reminders, setReminders] = useState<CustomerMaintenanceReminder[]>([]);
  const [draft, setDraft] = useState<CustomerMaintenanceReminderDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const activeVehicles = useMemo(() => vehicles.filter((vehicle) => !vehicle.hidden), [vehicles]);

  const loadReminders = async () => {
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      setReminders(await listCustomerMaintenanceReminders(customerId));
    } catch (err: any) {
      setError(err.message ?? 'Failed to load maintenance reminders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setDraft(null);
    void loadReminders();
    // customerId intentionally drives reload; loadReminders captures current state only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const saveDraft = async () => {
    if (!draft || saving) return;
    setSaving(true);
    setError('');

    try {
      await saveCustomerMaintenanceReminder(draft);
      setDraft(null);
      setReminders(await listCustomerMaintenanceReminders(customerId));
    } catch (err: any) {
      setError(err.message ?? 'Failed to save maintenance reminder.');
    } finally {
      setSaving(false);
    }
  };

  const deleteReminder = async (reminder: CustomerMaintenanceReminder) => {
    if (saving) return;
    if (!window.confirm(`Delete maintenance reminder "${reminder.title}"?`)) return;
    setSaving(true);
    setError('');

    try {
      await deleteCustomerMaintenanceReminder(reminder.id, customerId);
      setReminders(await listCustomerMaintenanceReminders(customerId));
      if (draft?.id === reminder.id) setDraft(null);
    } catch (err: any) {
      setError(err.message ?? 'Failed to delete maintenance reminder.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 border-t pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-foreground">Maintenance reminders</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={loadReminders} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button size="sm" onClick={() => setDraft(buildMaintenanceReminderDraft(customerId, null))}>
            <Plus className="mr-2 h-4 w-4" />
            Add reminder
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
            <Label>Reminder type</Label>
            <Input
              value={draft.reminderType}
              onChange={(event) => setDraft((current) => current ? { ...current, reminderType: event.target.value } : current)}
              placeholder="oil_change, inspection, tire_change"
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              value={draft.status}
              onChange={(event) => setDraft((current) => current ? { ...current, status: event.target.value as MaintenanceReminderStatus } : current)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              {MAINTENANCE_REMINDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Title</Label>
            <Input
              value={draft.title}
              onChange={(event) => setDraft((current) => current ? { ...current, title: event.target.value } : current)}
              placeholder="Oil change reminder"
            />
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
          <div className="space-y-2">
            <Label>Due date</Label>
            <Input type="date" value={draft.dueDate} onChange={(event) => setDraft((current) => current ? { ...current, dueDate: event.target.value } : current)} />
          </div>
          <div className="space-y-2">
            <Label>Due mileage km</Label>
            <Input type="number" min="0" step="1" value={draft.dueMileageKm} onChange={(event) => setDraft((current) => current ? { ...current, dueMileageKm: event.target.value } : current)} />
          </div>
          <div className="space-y-2">
            <Label>Last known mileage km</Label>
            <Input type="number" min="0" step="1" value={draft.lastKnownMileageKm} onChange={(event) => setDraft((current) => current ? { ...current, lastKnownMileageKm: event.target.value } : current)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Next email time</Label>
            <Input type="datetime-local" value={draft.nextEmailAt} onChange={(event) => setDraft((current) => current ? { ...current, nextEmailAt: event.target.value } : current)} />
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.serviceCritical}
              onChange={(event) => setDraft((current) => current ? { ...current, serviceCritical: event.target.checked } : current)}
            />
            Service-critical reminder
          </label>
          <div className="flex gap-2 md:col-span-2">
            <Button size="sm" onClick={saveDraft} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save reminder'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
          </div>
        </div>
      ) : null}

      {reminders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No maintenance reminders saved.</p>
      ) : reminders.map((reminder) => {
        const vehicle = vehicles.find((item) => item.id === reminder.customerVehicleId);
        return (
          <div key={reminder.id} className="rounded-md border px-3 py-3 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{reminder.title}</span>
                  <Badge variant={statusVariant(reminder.status)} className="capitalize">{reminder.status}</Badge>
                  <Badge variant="outline">{reminder.reminderType}</Badge>
                  {reminder.serviceCritical ? <Badge variant="secondary">Service critical</Badge> : null}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span><CalendarClock className="mr-1 inline h-3 w-3" />Due {reminder.dueDate || 'not set'}</span>
                  {reminder.dueMileageKm !== null ? <span>{reminder.dueMileageKm} km target</span> : null}
                  {vehicle ? <span>{vehicle.licensePlate}</span> : null}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setDraft(buildMaintenanceReminderDraft(customerId, reminder))}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => deleteReminder(reminder)} disabled={saving}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {reminder.description ? <p className="mt-2 whitespace-pre-wrap leading-6">{reminder.description}</p> : null}
            <p className="mt-2 text-xs text-muted-foreground">
              Next email {formatDate(reminder.nextEmailAt)}. Last email {formatDate(reminder.lastEmailAt)}. Updated {formatDate(reminder.updatedAt ?? reminder.createdAt)}.
            </p>
          </div>
        );
      })}
    </div>
  );
}
