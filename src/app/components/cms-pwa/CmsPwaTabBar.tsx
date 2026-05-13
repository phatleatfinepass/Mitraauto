import React from 'react';
import { CalendarDays, LifeBuoy, Package, Wrench } from 'lucide-react';

export type CmsPwaTab = 'rescue' | 'booking' | 'order' | 'tools';

interface CmsPwaTabBarProps {
  activeTab: CmsPwaTab;
  counts: Record<CmsPwaTab, number>;
  onSelect: (tab: CmsPwaTab) => void;
}

const tabs: Array<{
  id: CmsPwaTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'rescue', label: 'Rescue', icon: LifeBuoy },
  { id: 'booking', label: 'Booking', icon: CalendarDays },
  { id: 'order', label: 'Order', icon: Package },
  { id: 'tools', label: 'Future Tools', icon: Wrench },
];

export function CmsPwaTabBar({ activeTab, counts, onSelect }: CmsPwaTabBarProps) {
  return (
    <nav
      aria-label="Mobile operations tabs"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#11141A]/96 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-3 backdrop-blur"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const count = counts[tab.id];

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-[11px] font-medium transition ${
                isActive
                  ? 'border-[#FF6B35]/50 bg-[#FF6B35]/10 text-white'
                  : 'border-transparent bg-white/[0.03] text-white/60'
              }`}
            >
              <div className="relative">
                <tab.icon className={`h-4 w-4 ${isActive ? 'text-[#FF6B35]' : 'text-white/70'}`} />
                {count > 0 ? (
                  <span className="absolute -right-3 -top-2 min-w-4 rounded-full bg-[#FF6B35] px-1 text-[10px] leading-4 text-[#11141A]">
                    {count > 9 ? '9+' : count}
                  </span>
                ) : null}
              </div>
              <span className="leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
