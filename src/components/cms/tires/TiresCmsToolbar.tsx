import React from 'react';
import { Search } from 'lucide-react';

interface TiresCmsToolbarProps {
  isDark: boolean;
  language: string;
  searchTerm: string;
  showMissingEanOnly: boolean;
  syncingCatalog: boolean;
  hasPendingCatalogSync: boolean;
  catalogSyncMessage: string | null;
  onSearchTermChange: (value: string) => void;
  onShowMissingEanOnlyChange: (checked: boolean) => void;
  onApplyCatalogSync: () => void;
}

export function TiresCmsToolbar({
  isDark,
  language,
  searchTerm,
  showMissingEanOnly,
  syncingCatalog,
  hasPendingCatalogSync,
  catalogSyncMessage,
  onSearchTermChange,
  onShowMissingEanOnlyChange,
  onApplyCatalogSync,
}: TiresCmsToolbarProps) {
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
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:max-w-md">
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
        {catalogSyncMessage && (
          <p className={`mt-3 text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {catalogSyncMessage}
          </p>
        )}
      </div>
    </>
  );
}