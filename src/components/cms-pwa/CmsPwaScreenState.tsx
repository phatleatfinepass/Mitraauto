import React from 'react';
import type { CmsPwaTab } from './CmsPwaTabBar';
import type { CmsPwaCopy } from './copy';

interface CmsPwaScreenStateProps {
  activeTab: CmsPwaTab;
  dataError: string;
  userEmail: string;
  copy: CmsPwaCopy;
}

export function CmsPwaScreenState({
  activeTab,
  dataError,
  userEmail,
  copy,
}: CmsPwaScreenStateProps) {
  return (
    <>
      <section className="mt-4">
        {dataError ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {dataError}
          </div>
        ) : null}
      </section>

      <section className="mt-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              {activeTab === 'rescue'
                ? copy.rescueQueue
                : activeTab === 'booking'
                  ? copy.bookingQueue
                  : activeTab === 'order'
                    ? copy.orderQueue
                    : copy.plannedTools}
            </h2>
          </div>
          {userEmail ? <p className="text-[11px] text-white/35">{userEmail}</p> : null}
        </div>
      </section>
    </>
  );
}
