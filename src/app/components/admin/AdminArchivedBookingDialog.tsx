import React from 'react';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Pencil, Save } from 'lucide-react';

import type { ScheduleBooking } from '../../utils/schedule';
import type { AdminBookingFormState } from './AdminSchedule.types';

interface AdminArchivedBookingDialogProps {
  archivedBookingModal: ScheduleBooking | null;
  deletingBookingId: string | null;
  editBookingForms: Record<string, AdminBookingFormState>;
  editingBookingId: string | null;
  getBookingServiceNameForCms: (serviceName?: string | null) => string;
  handleDeleteArchivedBooking: (booking: ScheduleBooking) => Promise<void> | void;
  handleEditBookingFieldChange: (bookingId: string, field: keyof AdminBookingFormState, value: string) => void;
  handleSaveBookingChanges: (booking: ScheduleBooking) => Promise<void> | void;
  handleStartEditingBooking: (booking: ScheduleBooking) => void;
  onOpenChange: (open: boolean) => void;
  onRequestRestore: (booking: ScheduleBooking) => void;
  savingBookingId: string | null;
  setEditingBookingId: React.Dispatch<React.SetStateAction<string | null>>;
  t: (key: string) => string;
  theme: string;
}

export function AdminArchivedBookingDialog({
  archivedBookingModal,
  deletingBookingId,
  editBookingForms,
  editingBookingId,
  getBookingServiceNameForCms,
  handleDeleteArchivedBooking,
  handleEditBookingFieldChange,
  handleSaveBookingChanges,
  handleStartEditingBooking,
  onOpenChange,
  onRequestRestore,
  savingBookingId,
  setEditingBookingId,
  t,
  theme,
}: AdminArchivedBookingDialogProps) {
  return (
    <Dialog open={Boolean(archivedBookingModal)} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-3xl ${theme === 'dark' ? 'border-white/10 bg-[#16181D] text-white' : ''}`}>
        <DialogHeader>
          <DialogTitle>{t('archivedBookingDetails')}</DialogTitle>
          <DialogDescription className={theme === 'dark' ? 'text-gray-400' : ''}>
            {archivedBookingModal ? `${archivedBookingModal.booking_date} ${archivedBookingModal.booking_time}` : ''}
          </DialogDescription>
        </DialogHeader>

        {archivedBookingModal && (
          <div className="space-y-5">
            <div className={`rounded-xl border p-4 ${theme === 'dark' ? 'border-white/10 bg-[#1C1C1E]' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`font-mono text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {archivedBookingModal.license_plate}
                </span>
                <Badge variant="destructive">{archivedBookingModal.status || 'cancelled'}</Badge>
              </div>
              <p className={`mt-3 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {getBookingServiceNameForCms(archivedBookingModal.service_name)}
              </p>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <div className={`rounded-md border p-4 ${theme === 'dark' ? 'border-white/10 bg-[#15171C]' : 'border-gray-200 bg-white'}`}>
                <dt className={`text-xs uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{t('customerName')}</dt>
                <dd className={`mt-2 text-base font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{archivedBookingModal.customer_name || '—'}</dd>
              </div>
              <div className={`rounded-md border p-4 ${theme === 'dark' ? 'border-white/10 bg-[#15171C]' : 'border-gray-200 bg-white'}`}>
                <dt className={`text-xs uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{t('customerPhone')}</dt>
                <dd className={`mt-2 text-base font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{archivedBookingModal.customer_phone || '—'}</dd>
              </div>
              <div className={`rounded-md border p-4 sm:col-span-2 ${theme === 'dark' ? 'border-white/10 bg-[#15171C]' : 'border-gray-200 bg-white'}`}>
                <dt className={`text-xs uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{t('customerEmail')}</dt>
                <dd className={`mt-2 break-all text-base font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{archivedBookingModal.customer_email || '—'}</dd>
              </div>
              <div className={`rounded-md border p-4 sm:col-span-2 ${theme === 'dark' ? 'border-white/10 bg-[#15171C]' : 'border-gray-200 bg-white'}`}>
                <dt className={`text-xs uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{t('notes')}</dt>
                <dd className={`mt-2 text-base ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{archivedBookingModal.notes || t('noNotes')}</dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => handleStartEditingBooking(archivedBookingModal)} className={theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}>
                <Pencil className="w-4 h-4 mr-2" />
                {t('editBooking')}
              </Button>
              <Button onClick={() => onRequestRestore(archivedBookingModal)} className="bg-emerald-600 hover:bg-emerald-700">
                {t('restoreBooking')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  const confirmed = window.confirm(t('deleteBookingConfirmDescription'));
                  if (confirmed) void handleDeleteArchivedBooking(archivedBookingModal);
                }}
                disabled={deletingBookingId === archivedBookingModal.id}
              >
                {deletingBookingId === archivedBookingModal.id ? t('deleting') : t('deleteBookingPermanently')}
              </Button>
            </div>

            {editingBookingId === archivedBookingModal.id && editBookingForms[archivedBookingModal.id] && (
              <div className={`rounded-md border p-4 ${theme === 'dark' ? 'border-white/10 bg-[#18181B]' : 'border-gray-200 bg-white'}`}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('editBooking')}</h4>
                  <Button size="sm" variant="ghost" onClick={() => setEditingBookingId(null)}>{t('cancelEditing')}</Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('licensePlate')}</label>
                    <Input value={editBookingForms[archivedBookingModal.id].license_plate} onChange={(e) => handleEditBookingFieldChange(archivedBookingModal.id, 'license_plate', e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('customerName')}</label>
                    <Input value={editBookingForms[archivedBookingModal.id].customer_name} onChange={(e) => handleEditBookingFieldChange(archivedBookingModal.id, 'customer_name', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('date')}</label>
                    <Input type="date" value={editBookingForms[archivedBookingModal.id].booking_date} onChange={(e) => handleEditBookingFieldChange(archivedBookingModal.id, 'booking_date', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('time')}</label>
                    <Input type="time" value={editBookingForms[archivedBookingModal.id].booking_time} onChange={(e) => handleEditBookingFieldChange(archivedBookingModal.id, 'booking_time', e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('customerEmail')}</label>
                    <Input type="email" value={editBookingForms[archivedBookingModal.id].customer_email} onChange={(e) => handleEditBookingFieldChange(archivedBookingModal.id, 'customer_email', e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('notes')}</label>
                    <Textarea value={editBookingForms[archivedBookingModal.id].notes} onChange={(e) => handleEditBookingFieldChange(archivedBookingModal.id, 'notes', e.target.value)} rows={3} className={theme === 'dark' ? 'bg-[#11141A] border-white/10 text-white' : ''} />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => void handleSaveBookingChanges(archivedBookingModal)} disabled={savingBookingId === archivedBookingModal.id} className="bg-[#FF6B35] hover:bg-[#FF6B35]/90">
                    <Save className="w-4 h-4 mr-2" />
                    {savingBookingId === archivedBookingModal.id ? t('saving') : t('saveChanges')}
                  </Button>
                  <Button variant="outline" onClick={() => setEditingBookingId(null)}>{t('cancel')}</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
