import { AlertCircle } from 'lucide-react';
import type { ProductCMS, TireRow } from './types';

interface TiresVisibilitySectionProps {
  editData: Partial<ProductCMS>;
  hasMissingSupplierPrice: (tire: TireRow | null) => boolean;
  isDark: boolean;
  isManualNonPassenger: boolean;
  language: string;
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
  language,
  mustHideFromStore,
  onHiddenChange,
  onManualNonPassengerChange,
  selectedTire,
}: TiresVisibilitySectionProps) {
  const forceHidden = mustHideFromStore(selectedTire);

  return (
    <div>
      <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {language === 'fi' ? 'Näkyvyys' : 'Visibility'}
      </h3>
      {forceHidden && (
        <div className={`mb-3 flex items-start gap-2 rounded-lg border p-3 ${
          isDark ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : 'border-amber-300 bg-amber-50 text-amber-800'
        }`}>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm">
            {language === 'fi'
              ? (
                hasMissingSupplierPrice(selectedTire)
                  ? 'Toimittajahinta puuttuu. Tuote pidetään automaattisesti piilotettuna verkkokaupasta.'
                  : 'Tämä ei ole henkilöauton rengas. Tuote pidetään automaattisesti piilotettuna verkkokaupasta.'
              )
              : (
                hasMissingSupplierPrice(selectedTire)
                  ? 'Supplier price is missing. This product is automatically kept hidden from webshop.'
                  : 'This is not a passenger-car tire. The product is automatically kept hidden from webshop.'
              )}
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
          {language === 'fi' ? 'Piilota kaupasta' : 'Hide from store'}
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
          {language === 'fi' ? 'Merkitse ei-henkilöautoksi' : 'Mark as non-passenger'}
        </span>
      </label>
    </div>
  );
}
