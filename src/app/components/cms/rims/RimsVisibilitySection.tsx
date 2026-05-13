import type { Dispatch, SetStateAction } from 'react';

import type { ProductCMS, RimRow } from './types';

interface RimsVisibilitySectionProps {
  isDark: boolean;
  language: string;
  selectedRim: RimRow;
  editData: Partial<ProductCMS>;
  onEditDataChange: Dispatch<SetStateAction<Partial<ProductCMS>>>;
}

export function RimsVisibilitySection({
  isDark,
  language,
  selectedRim,
  editData,
  onEditDataChange,
}: RimsVisibilitySectionProps) {
  return (
    <div>
      <h3 className={`mb-4 text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {language === 'fi' ? 'Näkyvyys' : 'Visibility'}
      </h3>
      <div className={`space-y-3 rounded-lg border p-4 ${isDark ? 'border-white/10 bg-white/5 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-700'}`}>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={Boolean(editData.is_hidden)}
            onChange={(event) => onEditDataChange((prev) => ({ ...prev, is_hidden: event.target.checked }))}
            className="h-5 w-5 rounded border-gray-300"
          />
          <span className="text-sm">{language === 'fi' ? 'Piilota kaupasta' : 'Hide from store'}</span>
        </label>
        <p className="text-xs">
          {language === 'fi'
            ? `Valittu toimittaja: ${selectedRim.supplier_code_best || '-'}, varasto: ${selectedRim.stock_qty ?? '-'}`
            : `Selected supplier: ${selectedRim.supplier_code_best || '-'}, stock: ${selectedRim.stock_qty ?? '-'}`}
        </p>
      </div>
    </div>
  );
}
