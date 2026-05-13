import React from 'react';
import { AlertTriangle, Search, SlidersHorizontal } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../ui/sheet';

const METADATA_OPTIONS = [
  { key: 'brand', fi: 'Brand', en: 'Brand' },
  { key: 'model', fi: 'Model', en: 'Model' },
  { key: 'ean', fi: 'EAN', en: 'EAN' },
  { key: 'size', fi: 'Size', en: 'Size' },
  { key: 'season', fi: 'Season', en: 'Season' },
  { key: 'ev_ready', fi: 'EV', en: 'EV' },
  { key: 'sound_absorber', fi: 'Sound absorber', en: 'Sound absorber' },
  { key: 'runflat', fi: 'RunFlat', en: 'RunFlat' },
  { key: 'xl', fi: 'XL', en: 'XL' },
  { key: 'studded', fi: 'Studded', en: 'Studded' },
  { key: 'threepmsf', fi: '3PMSF', en: '3PMSF' },
  { key: 'winter_approved', fi: 'M+S', en: 'M+S' },
  { key: 'ice_approved', fi: 'Ice approved', en: 'Ice approved' },
  { key: 'eu_fuel_class', fi: 'Fuel efficiency', en: 'Fuel efficiency' },
  { key: 'eu_wet_grip_class', fi: 'Wet grip', en: 'Wet grip' },
  { key: 'eu_noise_db', fi: 'Noise level (dB)', en: 'Noise level (dB)' },
  { key: 'eu_noise_class', fi: 'Noise class', en: 'Noise class' },
] as const;

const SEO_OPTIONS = [
  { key: 'title', fi: 'Title', en: 'Title' },
  { key: 'subtitle', fi: 'Subtitle', en: 'Subtitle' },
  { key: 'short_description', fi: 'Short description', en: 'Short description' },
  { key: 'long_description', fi: 'Long description', en: 'Long description' },
  { key: 'seo_slug', fi: 'SEO slug', en: 'SEO slug' },
  { key: 'seo_title', fi: 'SEO title', en: 'SEO title' },
  { key: 'seo_description', fi: 'SEO description', en: 'SEO description' },
] as const;

interface TiresCmsToolbarProps {
  isDark: boolean;
  language: string;
  hideHeader?: boolean;
  searchTerm: string;
  showNonPassengerDraft: boolean;
  missingMetadataFieldsDraft: string[];
  showMissingImagesOnlyDraft: boolean;
  showWithEprelOnlyDraft: boolean;
  missingSeoFieldsDraft: string[];
  supplierFilter: string;
  supplierDraft: string;
  supplierOptions: Array<{ code: string; label: string }>;
  syncingCatalog: boolean;
  hasPendingCatalogSync: boolean;
  catalogSyncMessage: string | null;
  catalogSyncProgress: { processed: number; total: number } | null;
  pendingConflictCount: number;
  bulkMarkupAmount: string;
  bulkMarkupPercent: string;
  bulkMarkupSupplier: string;
  bulkMarkupMatchCount: number | null;
  loadingBulkMarkupCount: boolean;
  applyingBulkMarkup: boolean;
  revertingBulkMarkup: boolean;
  bulkMarkupProgress: { mode: 'apply' | 'revert'; processed: number; total: number } | null;
  settingsDrawerOpen: boolean;
  supplierFilterDirty: boolean;
  onSearchTermChange: (value: string) => void;
  onShowNonPassengerDraftChange: (checked: boolean) => void;
  onMissingMetadataFieldsDraftChange: (values: string[]) => void;
  onShowMissingImagesOnlyDraftChange: (checked: boolean) => void;
  onShowWithEprelOnlyDraftChange: (checked: boolean) => void;
  onMissingSeoFieldsDraftChange: (values: string[]) => void;
  onSupplierDraftChange: (value: string) => void;
  onBulkMarkupSupplierChange: (value: string) => void;
  onSettingsDrawerOpenChange: (open: boolean) => void;
  onApplySupplierFilter: () => void;
  onBulkMarkupAmountChange: (value: string) => void;
  onBulkMarkupPercentChange: (value: string) => void;
  onApplyBulkSupplierMarkup: () => void;
  onRevertBulkSupplierMarkup: () => void;
  onApplyCatalogSync: () => void;
  onResolveConflict: () => void;
}

function toggleItem(values: string[], key: string) {
  return values.includes(key) ? values.filter((value) => value !== key) : [...values, key];
}

export function TiresCmsToolbar({
  isDark,
  language,
  hideHeader = false,
  searchTerm,
  showNonPassengerDraft,
  missingMetadataFieldsDraft,
  showMissingImagesOnlyDraft,
  showWithEprelOnlyDraft,
  missingSeoFieldsDraft,
  supplierFilter,
  supplierDraft,
  supplierOptions,
  syncingCatalog,
  hasPendingCatalogSync,
  catalogSyncMessage,
  catalogSyncProgress,
  pendingConflictCount,
  bulkMarkupAmount,
  bulkMarkupPercent,
  bulkMarkupSupplier,
  bulkMarkupMatchCount,
  loadingBulkMarkupCount,
  applyingBulkMarkup,
  revertingBulkMarkup,
  bulkMarkupProgress,
  settingsDrawerOpen,
  supplierFilterDirty,
  onSearchTermChange,
  onShowNonPassengerDraftChange,
  onMissingMetadataFieldsDraftChange,
  onShowMissingImagesOnlyDraftChange,
  onShowWithEprelOnlyDraftChange,
  onMissingSeoFieldsDraftChange,
  onSupplierDraftChange,
  onBulkMarkupSupplierChange,
  onSettingsDrawerOpenChange,
  onApplySupplierFilter,
  onBulkMarkupAmountChange,
  onBulkMarkupPercentChange,
  onApplyBulkSupplierMarkup,
  onRevertBulkSupplierMarkup,
  onApplyCatalogSync,
  onResolveConflict,
}: TiresCmsToolbarProps) {
  const bulkMarkupSupplierOption =
    bulkMarkupSupplier
      ? supplierOptions.find((option) => option.code === bulkMarkupSupplier) ?? {
          code: bulkMarkupSupplier,
          label: bulkMarkupSupplier,
        }
      : null;
  const canApplyBulkMarkup =
    Boolean(bulkMarkupSupplier) &&
    ((bulkMarkupAmount.trim() !== '' && Number.isFinite(Number(bulkMarkupAmount))) ||
      (bulkMarkupPercent.trim() !== '' && Number.isFinite(Number(bulkMarkupPercent)))) &&
    (bulkMarkupMatchCount ?? 0) > 0;
  const bulkAdjustmentLabel =
    bulkMarkupAmount.trim() !== ''
      ? language === 'fi'
        ? 'euromuutos'
        : 'amount'
      : bulkMarkupPercent.trim() !== ''
        ? language === 'fi'
          ? 'prosenttimuutos'
          : 'percent adjustment'
        : null;

  return (
    <>
      {!hideHeader && (
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
      )}

      <div className={`border-b ${isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'} px-8 py-4`}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
            <div className="relative w-full xl:max-w-md">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder={language === 'fi' ? 'Hae brändin, mallin, koon tai EAN:n mukaan...' : 'Search by brand, model, size, or EAN...'}
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              {pendingConflictCount > 0 && (
                <button
                  type="button"
                  onClick={onResolveConflict}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isDark
                      ? 'bg-amber-500/15 text-amber-200 hover:bg-amber-500/25'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Resolve conflict ({pendingConflictCount})
                </button>
              )}

              <button
                type="button"
                onClick={() => onSettingsDrawerOpenChange(true)}
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
        </div>

        {catalogSyncMessage && (
          <p className={`mt-3 text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {catalogSyncMessage}
          </p>
        )}

        {catalogSyncProgress ? (
          <div className="mt-3 space-y-2">
            <div className={`h-2 overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
              <div
                className="h-full rounded-full bg-blue-500 transition-[width] duration-200"
                style={{
                  width: `${catalogSyncProgress.total > 0 ? Math.min(100, (catalogSyncProgress.processed / catalogSyncProgress.total) * 100) : 0}%`,
                }}
              />
            </div>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fi'
                ? `Synkronoidaan ${catalogSyncProgress.processed} / ${catalogSyncProgress.total}`
                : `Syncing ${catalogSyncProgress.processed} / ${catalogSyncProgress.total}`}
            </p>
          </div>
        ) : null}
      </div>

      <Sheet open={settingsDrawerOpen} onOpenChange={onSettingsDrawerOpenChange}>
        <SheetContent
          side="right"
          className={`w-full sm:max-w-[520px] ${isDark ? 'border-white/10 bg-[#10131A] text-white' : 'border-gray-200 bg-white text-gray-900'}`}
        >
          <SheetHeader className={isDark ? 'border-b border-white/10' : 'border-b border-gray-200'}>
            <SheetTitle className={isDark ? 'text-white' : 'text-gray-900'}>
              {language === 'fi' ? 'Renkaiden näkymäasetukset' : 'Tires view settings'}
            </SheetTitle>
            <SheetDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              {language === 'fi'
                ? 'Rajaa nykyinen näkymä auditointia ja toimittajakohtaista hinnoittelua varten.'
                : 'Filter the current view for audit work and supplier pricing.'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
            <section className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <div className="space-y-4">
                <div>
                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fi' ? 'Näytä toimittajan mukaan' : 'Show items by supplier'}
                  </label>
                  <select
                    value={supplierDraft}
                    onChange={(e) => onSupplierDraftChange(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">{language === 'fi' ? 'Kaikki toimittajat' : 'All suppliers'}</option>
                    {supplierOptions.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showNonPassengerDraft}
                    onChange={(e) => onShowNonPassengerDraftChange(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'Näytä ei-henkilöauton renkaat' : 'Show non-passenger tires'}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fi'
                        ? 'Jos tämä on pois päältä, CMS jättää nämä tuotteet pois ja latautuu kevyemmin.'
                        : 'Turn this off to hide those items and keep the CMS lighter.'}
                    </p>
                  </div>
                </label>
              </div>
            </section>

            <section className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <div className="space-y-4">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fi' ? 'Näytä tuotteet joilta puuttuu metadataa' : 'Show items missing metadata'}
                  </p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fi'
                      ? 'Valitse tarkat tiedot, joista puuttuvat tuotteet haluat nostaa näkyviin.'
                      : 'Choose the exact metadata you want to audit as missing.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {METADATA_OPTIONS.map((option) => (
                    <label key={option.key} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={missingMetadataFieldsDraft.includes(option.key)}
                        onChange={() => onMissingMetadataFieldsDraftChange(toggleItem(missingMetadataFieldsDraft, option.key))}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {language === 'fi' ? option.fi : option.en}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </section>

            <section className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showWithEprelOnlyDraft}
                  onChange={(e) => onShowWithEprelOnlyDraftChange(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fi' ? 'Näytä tuotteet joilla on EPREL' : 'Show items with EPREL'}
                  </p>
                </div>
              </label>
            </section>

            <section className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMissingImagesOnlyDraft}
                  onChange={(e) => onShowMissingImagesOnlyDraftChange(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fi' ? 'Näytä tuotteet joilta puuttuu kuvia' : 'Show items missing images'}
                  </p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fi'
                      ? 'Nostaa näkyviin renkaat, joilta puuttuu hero-kuva ja galleriakuvat.'
                      : 'Shows tires that are missing both the hero image and gallery images.'}
                  </p>
                </div>
              </label>
            </section>

            <section className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <div className="space-y-4">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fi' ? 'Näytä tuotteet joilta puuttuu sisältöä tai SEO-tietoja' : 'Show items missing content or SEO'}
                  </p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fi'
                      ? 'Valitse mitä puuttuvia sisältö- tai SEO-kenttiä haluat tarkistaa.'
                      : 'Choose which content or SEO fields should be treated as missing.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {SEO_OPTIONS.map((option) => (
                    <label key={option.key} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={missingSeoFieldsDraft.includes(option.key)}
                        onChange={() => onMissingSeoFieldsDraftChange(toggleItem(missingSeoFieldsDraft, option.key))}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {language === 'fi' ? option.fi : option.en}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </section>

            <section className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <div className="space-y-4">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fi' ? 'Toimittajan massahinnoittelu' : 'Supplier bulk markup'}
                  </p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fi'
                      ? 'Valitse toimittaja ja anna muutos euroina tai prosentteina. Negatiivinen arvo laskee hintaa.'
                      : 'Choose a supplier and set a markup or discount. Negative values reduce the price.'}
                  </p>
                </div>

                <select
                  value={bulkMarkupSupplier}
                  onChange={(e) => onBulkMarkupSupplierChange(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">{language === 'fi' ? 'Valitse toimittaja' : 'Choose supplier'}</option>
                  {supplierOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="number"
                    step="0.01"
                    value={bulkMarkupAmount}
                    onChange={(e) => onBulkMarkupAmountChange(e.target.value)}
                    placeholder={language === 'fi' ? 'Euromuutos €' : 'Amount input €'}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />

                  <input
                    type="number"
                    step="0.01"
                    value={bulkMarkupPercent}
                    onChange={(e) => onBulkMarkupPercentChange(e.target.value)}
                    placeholder={language === 'fi' ? 'Prosenttimuutos %' : 'Percent input %'}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {loadingBulkMarkupCount
                    ? (language === 'fi' ? 'Lasketaan osuvia tuotteita...' : 'Counting matching items...')
                    : bulkMarkupSupplierOption && bulkMarkupMatchCount !== null
                      ? (language === 'fi'
                          ? `${bulkMarkupSupplierOption.label}: ${bulkMarkupMatchCount} tuotetta nykyisillä näkymäsuodattimilla.`
                          : `${bulkMarkupSupplierOption.label}: ${bulkMarkupMatchCount} items match the current view filters.`)
                      : (language === 'fi'
                          ? 'Valitse toimittaja, niin näet kuinka moneen tuotteeseen muutos kohdistuu.'
                          : 'Choose a supplier to see how many items will be updated.')}
                </p>

                {bulkMarkupProgress ? (
                  <div className="space-y-2">
                    <div className={`h-2 overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                      <div
                        className={`h-full rounded-full transition-[width] duration-200 ${
                          bulkMarkupProgress.mode === 'revert' ? 'bg-red-500' : 'bg-orange-500'
                        }`}
                        style={{
                          width: `${bulkMarkupProgress.total > 0 ? Math.min(100, (bulkMarkupProgress.processed / bulkMarkupProgress.total) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fi'
                        ? `${bulkMarkupProgress.mode === 'revert' ? 'Palautetaan' : 'Päivitetään'} ${bulkMarkupProgress.processed} / ${bulkMarkupProgress.total}`
                        : `${bulkMarkupProgress.mode === 'revert' ? 'Reverting' : 'Updating'} ${bulkMarkupProgress.processed} / ${bulkMarkupProgress.total}`}
                    </p>
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={onApplyBulkSupplierMarkup}
                    disabled={applyingBulkMarkup || !canApplyBulkMarkup}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDark
                        ? 'bg-orange-500 text-white hover:bg-orange-600 disabled:bg-white/10 disabled:text-gray-500'
                        : 'bg-orange-600 text-white hover:bg-orange-700 disabled:bg-gray-200 disabled:text-gray-500'
                    } disabled:cursor-not-allowed`}
                  >
                    {applyingBulkMarkup
                      ? (language === 'fi' ? 'Päivitetään...' : 'Applying...')
                      : bulkMarkupMatchCount !== null && bulkMarkupMatchCount > 0 && bulkAdjustmentLabel
                        ? (language === 'fi'
                            ? `Käytä tämä ${bulkAdjustmentLabel} ${bulkMarkupMatchCount} tuotteeseen`
                            : `Apply this ${bulkAdjustmentLabel} to ${bulkMarkupMatchCount} items`)
                        : (language === 'fi' ? 'Valitse toimittaja ja muutos' : 'Choose supplier and amount')}
                  </button>

                  <button
                    type="button"
                    onClick={onRevertBulkSupplierMarkup}
                    disabled={revertingBulkMarkup || !bulkMarkupSupplier || (bulkMarkupMatchCount ?? 0) === 0}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDark
                        ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-white/10 disabled:text-gray-500'
                        : 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-500'
                    } disabled:cursor-not-allowed`}
                  >
                    {revertingBulkMarkup
                      ? (language === 'fi' ? 'Palautetaan...' : 'Reverting...')
                      : (language === 'fi' ? 'Palauta hintamuutos API-hintaan' : 'Revert markup to API price')}
                  </button>
                </div>
              </div>
            </section>
          </div>

          <div className={`border-t px-4 py-4 ${isDark ? 'border-white/10 bg-[#10131A]' : 'border-gray-200 bg-white'}`}>
            <button
              type="button"
              onClick={onApplySupplierFilter}
              disabled={!supplierFilterDirty}
              className={`w-full rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-white text-[#10131A] hover:bg-gray-200 disabled:bg-white/10 disabled:text-gray-500'
                  : 'bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400'
              } disabled:cursor-not-allowed`}
            >
              {language === 'fi' ? 'Käytä asetukset' : 'Apply settings'}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
