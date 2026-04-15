import React from 'react';
import { CmsPwaBriefingCard } from './CmsPwaBriefingCard';
import type { TabSection } from './types';

export function CmsPwaSectionList({ sections, emptyLabel }: { sections: TabSection[]; emptyLabel?: string }) {
  return (
    <>
      {sections.map((section) => (
        <div key={section.title}>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">{section.title}</h3>
              {section.caption ? <p className="mt-1 text-xs text-white/45">{section.caption}</p> : null}
            </div>
            <span className="text-xs font-mono text-white/35">{section.items.length}</span>
          </div>
          {section.items.length === 0 && !section.hideEmptyState ? (
            <div className="rounded-2xl border border-white/10 bg-[#141922] px-4 py-3 text-sm text-white/50">
              {emptyLabel ?? 'No items in this queue right now.'}
            </div>
          ) : section.items.length > 0 ? (
            <div className="space-y-3">
              {section.items.map((item) => (
                <CmsPwaBriefingCard key={item.id} item={item} />
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </>
  );
}
