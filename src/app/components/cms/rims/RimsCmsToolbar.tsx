import { useState } from 'react';
import { Filter, Search, SlidersHorizontal } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../ui/sheet';

interface RimsCmsToolbarProps {
  isDark: boolean;
  language: string;
  hideHeader?: boolean;
  searchTerm: string;
  supplierFilter: string;
  showMissingPriceOnly: boolean;
  showMissingImagesOnly: boolean;
  showMissingSeoOnly: boolean;
  showMissingSpecsOnly: boolean;
  statusFilter: string;
  syncing: boolean;
  hasPendingCatalogSync: boolean;
  catalogSyncMessage: string | null;
  onSearchTermChange: (value: string) => void;
  onSupplierFilterChange: (value: string) => void;
  onShowMissingPriceOnlyChange: (value: boolean) => void;
  onShowMissingImagesOnlyChange: (value: boolean) => void;
  onShowMissingSeoOnlyChange: (value: boolean) => void;
  onShowMissingSpecsOnlyChange: (value: boolean) => void;
  onStatusFilterChange: (value: string) => void;
  onApplySync: () => void;
}

export function RimsCmsToolbar({
  isDark,
  language,
  hideHeader = false,
  searchTerm,
  supplierFilter,
  showMissingPriceOnly,
  showMissingImagesOnly,
  showMissingSeoOnly,
  showMissingSpecsOnly,
  statusFilter,
  syncing,
  hasPendingCatalogSync,
  catalogSyncMessage,
  onSearchTermChange,
  onSupplierFilterChange,
  onShowMissingPriceOnlyChange,
  onShowMissingImagesOnlyChange,
  onShowMissingSeoOnlyChange,
  onShowMissingSpecsOnlyChange,
  onStatusFilterChange,
  onApplySync,
}: RimsCmsToolbarProps) {
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const inputClass = `rounded-lg border px-3 py-2 text-sm ${
    isDark
      ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  }`;
  const checkboxLabelClass = `flex items-center gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <>
      {!hideHeader && (
        <div className={`border-b ${isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'}`}>
          <div className="px-8 py-6">
            <h1 className={`mb-2 text-3xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {language === 'fi' ? 'Vanteet CMS' : 'Rims CMS'}
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fi'
                ? 'Valittu voittajataso, CMS-ohitukset ja verkkokaupan julkaisu'
                : 'Selected winner layer, CMS overrides, and webshop publishing'}
            </p>
          </div>
        </div>
      )}

      <div className={`border-b px-8 py-4 ${isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 items-start justify-between xl:flex-row xl:items-center">
            <div className="relative w-full xl:max-w-md">
              <Search className={`absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder={language === 'fi' ? 'Hae brändi, malli, koko, PCD, väri tai EAN...' : 'Search brand, model, size, PCD, color, or EAN...'}
                value={searchTerm}
                onChange={(event) => onSearchTermChange(event.target.value)}
                className={`w-full rounded-lg border py-2 pl-10 pr-4 ${
                  isDark
                    ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setSettingsDrawerOpen(true)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-white/10 text-white hover:bg-white/15'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {language === 'fi' ? 'Näkymän asetukset' : 'View settings'}
              </button>

              <button
                type="button"
                onClick={onApplySync}
                disabled={syncing || !hasPendingCatalogSync}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-white/10 disabled:text-gray-500'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-500'
                } disabled:cursor-not-allowed`}
              >
                {syncing ? (language === 'fi' ? 'Synkronoidaan...' : 'Syncing...') : 'Apply Sync'}
              </button>
            </div>
          </div>
        </div>

        {catalogSyncMessage && (
          <p className={`mt-3 text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {catalogSyncMessage}
          </p>
        )}
      </div>

      <Sheet open={settingsDrawerOpen} onOpenChange={setSettingsDrawerOpen}>
        <SheetContent
          side="right"
          className={`w-full sm:max-w-[520px] ${isDark ? 'border-white/10 bg-[#10131A] text-white' : 'border-gray-200 bg-white text-gray-900'}`}
        >
          <SheetHeader className={isDark ? 'border-b border-white/10' : 'border-b border-gray-200'}>
            <SheetTitle className={isDark ? 'text-white' : 'text-gray-900'}>
              {language === 'fi' ? 'Vanteiden näkymäasetukset' : 'Rims view settings'}
            </SheetTitle>
            <SheetDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              {language === 'fi'
                ? 'Rajaa nykyinen näkymä valmiustarkistusta ja verkkokaupan julkaisua varten.'
                : 'Filter the current view for readiness review and webshop publishing.'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
            <section className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <div className="space-y-4">
                <div>
                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fi' ? 'Näytä toimittajan mukaan' : 'Show items by supplier'}
                  </label>
                  <select value={supplierFilter} onChange={(event) => onSupplierFilterChange(event.target.value)} className={`${inputClass} w-full`}>
                    <option value="all">{language === 'fi' ? 'Kaikki toimittajat' : 'All suppliers'}</option>
                    <option value="RD">RD</option>
                    <option value="VT">VT</option>
                  </select>
                </div>

                <div>
                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fi' ? 'Näytä tilan mukaan' : 'Show items by status'}
                  </label>
                  <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)} className={`${inputClass} w-full`}>
                    <option value="all">{language === 'fi' ? 'Kaikki tilat' : 'All statuses'}</option>
                    <option value="visible">{language === 'fi' ? 'Näkyvät' : 'Visible'}</option>
                    <option value="hidden">{language === 'fi' ? 'Piilotetut' : 'Hidden'}</option>
                    <option value="manual_not_sellable">{language === 'fi' ? 'No-no manuaalinen' : 'Manual no-no'}</option>
                    <option value="missing_price">{language === 'fi' ? 'Hinta puuttuu' : 'Missing price'}</option>
                    <option value="missing_image">{language === 'fi' ? 'Kuva puuttuu' : 'Missing image'}</option>
                  </select>
                </div>
              </div>
            </section>

            <section className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <div className="mb-4 inline-flex items-center gap-2 text-sm font-medium">
                <Filter className="h-4 w-4" />
                {language === 'fi' ? 'Audit-suodattimet' : 'Audit filters'}
              </div>
              <div className="space-y-3">
                <label className={checkboxLabelClass}>
                  <input type="checkbox" checked={showMissingPriceOnly} onChange={(event) => onShowMissingPriceOnlyChange(event.target.checked)} />
                  {language === 'fi' ? 'Hinta puuttuu' : 'Missing price'}
                </label>
                <label className={checkboxLabelClass}>
                  <input type="checkbox" checked={showMissingImagesOnly} onChange={(event) => onShowMissingImagesOnlyChange(event.target.checked)} />
                  {language === 'fi' ? 'Kuva puuttuu' : 'Missing image'}
                </label>
                <label className={checkboxLabelClass}>
                  <input type="checkbox" checked={showMissingSeoOnly} onChange={(event) => onShowMissingSeoOnlyChange(event.target.checked)} />
                  {language === 'fi' ? 'SEO puuttuu' : 'Missing SEO'}
                </label>
                <label className={checkboxLabelClass}>
                  <input type="checkbox" checked={showMissingSpecsOnly} onChange={(event) => onShowMissingSpecsOnlyChange(event.target.checked)} />
                  {language === 'fi' ? 'Tekniset tiedot puuttuvat' : 'Missing specs'}
                </label>
              </div>
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
