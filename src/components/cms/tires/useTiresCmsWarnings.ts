import { useState } from 'react';
import { useLanguage } from '../../../i18n/LanguageContext';
import type { TireRow, TiresWarningTooltipState } from './types';

export function useTiresCmsWarnings() {
  const { t } = useLanguage();
  const [warningTooltip, setWarningTooltip] = useState<TiresWarningTooltipState | null>(null);

  const getWarningReasons = (tire: TireRow) => {
    const reasons: string[] = [];

    if (tire.has_duplicate_ean_conflict) {
      reasons.push(t('tiresWarnings.duplicateEan'));
    }
    if (tire.has_mandatory_field_conflict) {
      reasons.push(t('tiresWarnings.mandatoryFieldsMissing'));
    }
    if (tire.has_missing_ean) {
      reasons.push(t('tiresWarnings.missingEan'));
    }
    if (Boolean(tire.ean_conflict_open) && reasons.length === 0) {
      reasons.push(t('tiresWarnings.openConflict'));
    }

    return reasons;
  };

  const getWarningTooltip = (tire: TireRow) => {
    const reasons = getWarningReasons(tire);
    if (reasons.length === 0) {
      return t('tiresWarnings.warning');
    }

    const prefix = t('tiresWarnings.warningPrefix');
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
