import React from 'react';
import { Search } from 'lucide-react';

interface TiresCmsToolbarProps {
  isDark: boolean;
  language: string;
  searchTerm: string;
  showMissingEanOnly: boolean;
  hideNonPassenger: boolean;
  supplierFilter: string;
  supplierOptions: Array<{ code: string; label: string }>;
  syncingCatalog: boolean;
  hasPendingCatalogSync: boolean;
  catalogSyncMessage: string | null;
  bulkMarkupAmount: string;
  applyingBulkMarkup: boolean;
  onSearchTermChange: (value: string) => void;
  onShowMissingEanOnlyChange: (checked: boolean) => void;
  onHideNonPassengerChange: (checked: boolean) => void;
  onSupplierFilterChange: (value: string) => void;
  onBulkMarkupAmountChange: (value: string) => void;
  onApplyBulkSupplierMarkup: () => void;
  onApplyCatalogSync: () => void;
}

export function TiresCmsToolbar({
  isDark,
  language,
  searchTerm,
  showMissingEanOnly,
  hideNonPassenger,
  supplierFilter,
  supplierOptions,
  syncingCatalog,
  hasPendingCatalogSync,
  catalogSyncMessage,
  bulkMarkupAmount,
  applyingBulkMarkup,
  onSearchTermChange,
  onShowMissingEanOnlyChange,
  onHideNonPassengerChange,
  onSupplierFilterChange,
  onBulkMarkupAmountChange,
  onApplyBulkSupplierMarkup,
  onApplyCatalogSync,
}: TiresCmsToolbarProps) {
  const selectedSupplier =
    supplierFilter !== 'all'
      ? supplierOptions.find((option) => option.code === supplierFilter) ?? {
          code: supplierFilter,
          label: supplierFilter,
        }
      : null;

  return (
    <>
      <div className={`border-b ${isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'}`}>
        <div className="px-8 py-6">
          <h1 className={`text-3xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'Renkaat CMS' : 'Tires CMS'}
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'fi'
              ? 'Hallitse renkaiden sisältöä, EU-merkintöjä, hintoja ja kuvia'
              : 'Manage tire content, EU labels, pricing, and images'}
          </p>
        </div>
      </div>

      <div className={`border-b ${isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'} px-8 py-4`}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
            <div className="relative w-full xl:max-w-md">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder={language === 'fi' ? 'Hae brändin, mallin tai EAN:n mukaan...' : 'Search by brand, model, or EAN...'}
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <label className="flex items-center gap-2">
                <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'Näytä toimittaja' : 'Show supplier'}
                </span>
                <select
                  value={supplierFilter}
                  onChange={(e) => onSupplierFilterChange(e.target.value)}
                  className={`px-3 py-2 rounded-lg border text-sm ${
                    isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">{language === 'fi' ? 'Kaikki' : 'All'}</option>
                  {supplierOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMissingEanOnly}
                  onChange={(e) => onShowMissingEanOnlyChange(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'Näytä vain puuttuva EAN' : 'Show missing EAN only'}
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideNonPassenger}
                  onChange={(e) => onHideNonPassengerChange(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'Piilota ei-henkilöautot' : 'Hide non-passenger tires'}
                </span>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {language === 'fi' ? '(nopeampi)' : '(faster)'}
                </span>
              </label>

              <button
                type="button"
                onClick={onApplyCatalogSync}
                disabled={syncingCatalog || !hasPendingCatalogSync}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-white/10 disabled:text-gray-500'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-500'
                } disabled:cursor-not-allowed`}
              >
                {syncingCatalog
                  ? (language === 'fi' ? 'Synkronoidaan...' : 'Syncing...')
                  : 'Apply Sync'}
              </button>
            </div>
          </div>

          {selectedSupplier ? (
            <div className={`rounded-lg border px-4 py-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="min-w-0 lg:min-w-[240px]">
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fi' ? 'Toimittajan massahinnoittelu' : 'Supplier bulk markup'}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fi'
                      ? `Aseta API-hinta + lisä kaikille tämän näkymän ${selectedSupplier.label}-renkaille.`
                      : 'Apply API price + markup to all tires from the same supplier in the current view.'}
                  </p>
                </div>

                <div className="flex flex-1 flex-col sm:flex-row gap-3">
                  <div
                    className={`px-3 py-2 rounded-lg border text-sm ${
                      isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {selectedSupplier.label}
                  </div>
                <input
                  type="number"
                  step="0.01"
                  value={bulkMarkupAmount}
                  onChange={(e) => onBulkMarkupAmountChange(e.target.value)}
                  placeholder={language === 'fi' ? 'Lisä €' : 'Markup €'}
                  className={`px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />

                <button
                  type="button"
                  onClick={onApplyBulkSupplierMarkup}
                  disabled={applyingBulkMarkup}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDark
                      ? 'bg-orange-500 text-white hover:bg-orange-600 disabled:bg-white/10 disabled:text-gray-500'
                      : 'bg-orange-600 text-white hover:bg-orange-700 disabled:bg-gray-200 disabled:text-gray-500'
                  } disabled:cursor-not-allowed`}
                >
                  {applyingBulkMarkup
                    ? (language === 'fi' ? 'Päivitetään...' : 'Applying...')
                    : (language === 'fi' ? 'Aseta koko toimittajalle' : 'Apply to supplier')}
                </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {catalogSyncMessage && (
          <p className={`mt-3 text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {catalogSyncMessage}
          </p>
        )}
      </div>
    </>
  );
}
