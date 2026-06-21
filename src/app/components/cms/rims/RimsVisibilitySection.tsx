import type { Dispatch, SetStateAction } from 'react';

import { useLanguage } from '../../../i18n/LanguageContext';
import type { ProductCMS, RimRow } from './types';

interface RimsVisibilitySectionProps {
  isDark: boolean;
  selectedRim: RimRow;
  editData: Partial<ProductCMS>;
  onEditDataChange: Dispatch<SetStateAction<Partial<ProductCMS>>>;
}

export function RimsVisibilitySection({
  isDark,
  selectedRim,
  editData,
  onEditDataChange,
}: RimsVisibilitySectionProps) {
  const { t } = useLanguage();

  return (
    <div>
      <h3 className={`mb-4 text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {t('rimsVisibility.title')}
      </h3>
      <div className={`space-y-3 rounded-lg border p-4 ${isDark ? 'border-white/10 bg-white/5 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-700'}`}>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={Boolean(editData.is_hidden)}
            onChange={(event) => onEditDataChange((prev) => ({ ...prev, is_hidden: event.target.checked }))}
            className="h-5 w-5 rounded border-gray-300"
          />
          <span className="text-sm">{t('rimsVisibility.hideFromStore')}</span>
        </label>
        <p className="text-xs">
          {t('rimsVisibility.supplierStock', {
            supplier: selectedRim.supplier_code_best || '-',
            stock: selectedRim.stock_qty ?? '-',
          })}
        </p>
      </div>
    </div>
  );
}
