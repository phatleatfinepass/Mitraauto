import React from 'react';
import type { CmsPwaCopy } from './copy';

interface CmsPwaDiagnosticsSheetProps {
  open: boolean;
  copy: CmsPwaCopy;
  notificationPermission: NotificationPermission | 'unsupported';
  serviceWorkerReady: boolean;
  localSubscriptionReady: boolean;
  pushSubscribed: boolean;
  pushLastError: string;
  enablingNotifications: boolean;
  pushSupported: boolean;
  onClose: () => void;
  onEnableNotifications: () => void;
  onRerunDiagnostics: () => void;
}

export function CmsPwaDiagnosticsSheet({
  open,
  copy,
  notificationPermission,
  serviceWorkerReady,
  localSubscriptionReady,
  pushSubscribed,
  pushLastError,
  enablingNotifications,
  pushSupported,
  onClose,
  onEnableNotifications,
  onRerunDiagnostics,
}: CmsPwaDiagnosticsSheetProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/55 px-4 pb-4 pt-12">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#141922] p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white">{copy.pushDiagnostics}</p>
            <p className="mt-1 text-xs text-white/55">{copy.pushDiagnosticsBody}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70"
          >
            {copy.close}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-white/65">
          <span>{copy.permission}</span>
          <span className="text-right">{notificationPermission}</span>
          <span>{copy.serviceWorker}</span>
          <span className="text-right">{serviceWorkerReady ? copy.ready : copy.notReady}</span>
          <span>{copy.pushSupported}</span>
          <span className="text-right">{pushSupported ? copy.yes : copy.no}</span>
          <span>{copy.localSubscription}</span>
          <span className="text-right">{localSubscriptionReady ? copy.yes : copy.no}</span>
          <span>{copy.savedToBackend}</span>
          <span className="text-right">{pushSubscribed ? copy.yes : copy.no}</span>
        </div>

        {pushLastError ? (
          <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
            {pushLastError}
          </p>
        ) : null}

        <div className="mt-4 flex gap-2">
          {notificationPermission === 'default' ? (
            <button
              type="button"
              onClick={onEnableNotifications}
              disabled={enablingNotifications}
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#FF6B35] px-3 py-2 text-xs font-semibold text-[#11141A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enablingNotifications ? copy.enabling : copy.enableNotifications}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRerunDiagnostics}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white"
          >
            {copy.rerunDiagnostics}
          </button>
        </div>
      </div>
    </div>
  );
}
