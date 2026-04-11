import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { cn } from '../ui/utils';

interface CmsBriefingCardProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  accent?: 'orange' | 'green' | 'slate';
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const accentClasses: Record<NonNullable<CmsBriefingCardProps['accent']>, string> = {
  orange: 'border-l-[#FF6B35]',
  green: 'border-l-emerald-500',
  slate: 'border-l-slate-500',
};

function CmsBriefingCard({
  eyebrow,
  title,
  subtitle,
  meta,
  accent = 'slate',
  defaultOpen = false,
  children,
}: CmsBriefingCardProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          'overflow-hidden rounded-md border border-white/10 bg-[#15181F] shadow-none',
          'border-l-2',
          accentClasses[accent],
        )}
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-white/[0.03]"
          >
            <div className="min-w-0 space-y-1">
              {eyebrow ? (
                <p className="text-[11px] font-medium text-gray-500">{eyebrow}</p>
              ) : null}
              <p className="truncate text-sm font-semibold text-white">{title}</p>
              {subtitle ? <p className="text-sm text-gray-400">{subtitle}</p> : null}
              {meta ? <p className="text-xs text-gray-500">{meta}</p> : null}
            </div>
            <ChevronDown
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0 text-gray-500 transition-transform duration-150',
                open ? 'rotate-180' : 'rotate-0',
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="border-t border-white/10 px-4 py-4">
          {children}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export { CmsBriefingCard };
export default CmsBriefingCard;