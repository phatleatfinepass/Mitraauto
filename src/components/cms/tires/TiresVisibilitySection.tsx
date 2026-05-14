import { AlertCircle } from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';
import type { ProductCMS, TireRow } from './types';

interface TiresVisibilitySectionProps {
  editData: Partial<ProductCMS>;
  hasMissingSupplierPrice: (tire: TireRow | null) => boolean;
  isDark: boolean;
  isManualNonPassenger: boolean;
  mustHideFromStore: (tire: TireRow | null) => boolean;
  onHiddenChange: (hidden: boolean) => void;
  onManualNonPassengerChange: (checked: boolean) => void;
  selectedTire: TireRow | null;
}

export function TiresVisibilitySection({
  editData,
  hasMissingSupplierPrice,
  isDark,
  isManualNonPassenger,
  mustHideFromStore,
  onHiddenChange,
  onManualNonPassengerChange,
  selectedTire,
}: TiresVisibilitySectionProps) {
  const { t } = useLanguage();
  const forceHidden = mustHideFromStore(selectedTire);

  return (
    <div>
      <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {t('tiresVisibility.title')}
      </h3>
      {forceHidden && (
        <div className={`mb-3 flex items-start gap-2 rounded-lg border p-3 ${
          isDark ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : 'border-amber-300 bg-amber-50 text-amber-800'
        }`}>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm">
            {hasMissingSupplierPrice(selectedTire)
              ? t('tiresVisibility.missingSupplierPriceHidden')
              : t('tiresVisibility.nonPassengerHidden')}
          </p>
        </div>
      )}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={Boolean(editData.is_hidden) || forceHidden}
          disabled={forceHidden}
          onChange={(e) => onHiddenChange(e.target.checked)}
          className="w-5 h-5 rounded border-gray-300"
        />
        <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('tiresVisibility.hideFromStore')}
        </span>
      </label>
      <label className="mt-3 flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isManualNonPassenger}
          onChange={(e) => onManualNonPassengerChange(e.target.checked)}
          className="w-5 h-5 rounded border-gray-300"
        />
        <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('tiresVisibility.markNonPassenger')}
        </span>
      </label>
    </div>
  );
}
