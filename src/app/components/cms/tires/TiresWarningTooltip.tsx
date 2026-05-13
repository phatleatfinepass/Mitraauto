import type { TiresWarningTooltipState } from './types';

interface TiresWarningTooltipProps {
  isDark: boolean;
  warningTooltip: TiresWarningTooltipState | null;
}

export function TiresWarningTooltip({ isDark, warningTooltip }: TiresWarningTooltipProps) {
  if (!warningTooltip) return null;

  return (
    <div
      className={`pointer-events-none fixed z-[120] max-w-[380px] rounded-md border px-2 py-1.5 text-xs shadow-lg ${
        isDark ? 'border-white/20 bg-black/95 text-white' : 'border-gray-700 bg-gray-900 text-white'
      }`}
      style={{ left: `${warningTooltip.x}px`, top: `${warningTooltip.y}px` }}
    >
      {warningTooltip.text}
    </div>
  );
}
