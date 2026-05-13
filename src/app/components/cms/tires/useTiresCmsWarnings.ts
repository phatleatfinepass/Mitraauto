import { useState } from 'react';
import type { TireRow, TiresWarningTooltipState } from './types';

export function useTiresCmsWarnings(language: string) {
  const [warningTooltip, setWarningTooltip] = useState<TiresWarningTooltipState | null>(null);

  const getWarningReasons = (tire: TireRow) => {
    const reasons: string[] = [];

    if (tire.has_duplicate_ean_conflict) {
      reasons.push(
        language === 'fi'
          ? 'Sama EAN löytyy useasta eri tuotteesta/specistä'
          : 'Same EAN appears on multiple different variants/specs'
      );
    }
    if (tire.has_mandatory_field_conflict) {
      reasons.push(language === 'fi' ? 'Pakollisia kenttiä puuttuu' : 'Mandatory fields are missing');
    }
    if (tire.has_missing_ean) {
      reasons.push(language === 'fi' ? 'EAN puuttuu tai on väliaikainen' : 'EAN is missing or still a placeholder');
    }
    if (Boolean(tire.ean_conflict_open) && reasons.length === 0) {
      reasons.push(
        language === 'fi'
          ? 'Katalogissa on avoin konflikti tälle tuotteelle'
          : 'There is an open catalog conflict for this item'
      );
    }

    return reasons;
  };

  const getWarningTooltip = (tire: TireRow) => {
    const reasons = getWarningReasons(tire);
    if (reasons.length === 0) {
      return language === 'fi' ? 'Varoitus' : 'Warning';
    }

    const prefix = language === 'fi' ? 'Varoitus:' : 'Warning:';
    return `${prefix} ${reasons.join(' | ')}`;
  };

  const showWarningTooltip = (text: string, x: number, y: number) => {
    setWarningTooltip({ text, x: x + 12, y: y + 12 });
  };

  const hideWarningTooltip = () => {
    setWarningTooltip(null);
  };

  return {
    getWarningTooltip,
    hideWarningTooltip,
    showWarningTooltip,
    warningTooltip,
  };
}
