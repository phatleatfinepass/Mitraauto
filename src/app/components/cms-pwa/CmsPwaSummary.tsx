import React from 'react';
import { RefreshCcw } from 'lucide-react';
import type { CmsPwaTab } from './CmsPwaTabBar';
import type { CmsPwaCopy } from './copy';
import { formatBuildStampLocal } from './copy';
import { formatShortDateTime } from './data';

declare const __APP_COMMIT__: string;
declare const __APP_BUILD_ISO__: string;

interface CmsPwaSummaryProps {
  counts: Record<CmsPwaTab, number>;
  lastUpdatedAt: string | null;
  dataLoading: boolean;
  activeTab: CmsPwaTab;
  onBookingHandoff: () => void;
  handoffLoading: boolean;
  activeBookingHandoffCount: number;
  onRefresh: () => void;
  copy: CmsPwaCopy;
}

export function CmsPwaSummary({
  counts,
  lastUpdatedAt,
  dataLoading,
  activeTab,
  onBookingHandoff,
  handoffLoading,
  activeBookingHandoffCount,
  onRefresh,
  copy,
}: CmsPwaSummaryProps) {
  const cards: Array<{ tab: 'rescue' | 'booking' | 'order'; label: string; count: number }> = [
    { tab: 'rescue', label: copy.rescue, count: counts.rescue },
    { tab: 'booking', label: copy.booking, count: counts.booking },
    { tab: 'order', label: copy.order, count: counts.order },
  ];

  return (
    <section className="mt-4 rounded-2xl border border-white/10 bg-[#141922] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{copy.operationalSummary}</p>
          <p className="mt-1 text-xs text-white/55">{`${copy.versionLabel} ${__APP_COMMIT__}. ${copy.updateLabel} ${formatBuildStampLocal(__APP_BUILD_ISO__)}`}</p>
          {lastUpdatedAt ? (
            <p className="mt-1 text-[11px] text-white/45">{`${copy.refreshedLabel} ${formatShortDateTime(lastUpdatedAt)}`}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={dataLoading}
          className="inline-flex h-10 w-10 items-center justify-center text-[#FF6B35] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={copy.forceRefresh}
        >
          <RefreshCcw className={`h-5 w-5 ${dataLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {cards.map((card) => {
          const selected = activeTab === card.tab;
          return (
            <div
              key={card.tab}
              className={`rounded-xl border px-3 py-3 text-left transition ${
                selected
                  ? 'border-[#FF6B35]/50 bg-[#2A1B14] shadow-[0_12px_24px_rgba(255,107,53,0.12)]'
                  : 'border-white/8 bg-[#1B202A]'
              }`}
            >
              <p className={`text-[11px] ${selected ? 'text-[#FFD2C3]' : 'text-white/50'}`}>{card.label}</p>
              <p className="mt-1 font-mono text-xl font-semibold">{card.count}</p>
            </div>
          );
        })}
      </div>
      {activeTab === 'booking' ? (
        <div className="mt-3 space-y-2">
          {activeBookingHandoffCount > 0 ? (
            <div className="rounded-xl border border-[#FF6B35]/30 bg-[#2A1B14] px-3 py-2 text-xs text-[#FFD2C3]">
              {activeBookingHandoffCount} {activeBookingHandoffCount === 1 ? copy.handoffWaitingOne : copy.handoffWaitingMany}
            </div>
          ) : null}
          <button
            type="button"
            onClick={onBookingHandoff}
            disabled={handoffLoading || counts.booking === 0}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#FF6B35] px-4 py-3 text-sm font-semibold text-[#11141A] transition hover:bg-[#ff845a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {handoffLoading ? copy.handingOff : counts.booking > 0 ? copy.handoffNewBookings : copy.noNewBookingsToHandoff}
          </button>
        </div>
      ) : null}
    </section>
  );
}
