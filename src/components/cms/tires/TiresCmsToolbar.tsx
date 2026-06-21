import React from 'react';
import { AlertTriangle, Search, SlidersHorizontal } from 'lucide-react';

import { useLanguage } from '../../../i18n/LanguageContext';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../ui/sheet';

const METADATA_OPTIONS = [
  { key: 'brand', labelKey: 'tiresCmsToolbar.option.brand' },
  { key: 'model', labelKey: 'tiresCmsToolbar.option.model' },
  { key: 'ean', labelKey: 'tiresCmsToolbar.option.ean' },
  { key: 'size', labelKey: 'tiresCmsToolbar.option.size' },
  { key: 'season', labelKey: 'tiresCmsToolbar.option.season' },
  { key: 'ev_ready', labelKey: 'tiresCmsToolbar.option.evReady' },
  { key: 'sound_absorber', labelKey: 'tiresCmsToolbar.option.soundAbsorber' },
  { key: 'runflat', labelKey: 'tiresCmsToolbar.option.runflat' },
  { key: 'xl', labelKey: 'tiresCmsToolbar.option.xl' },
  { key: 'studded', labelKey: 'tiresCmsToolbar.option.studded' },
  { key: 'threepmsf', labelKey: 'tiresCmsToolbar.option.threepmsf' },
  { key: 'winter_approved', labelKey: 'tiresCmsToolbar.option.winterApproved' },
  { key: 'ice_approved', labelKey: 'tiresCmsToolbar.option.iceApproved' },
  { key: 'eu_fuel_class', labelKey: 'tiresCmsToolbar.option.fuelEfficiency' },
  { key: 'eu_wet_grip_class', labelKey: 'tiresCmsToolbar.option.wetGrip' },
  { key: 'eu_noise_db', labelKey: 'tiresCmsToolbar.option.noiseLevelDb' },
  { key: 'eu_noise_class', labelKey: 'tiresCmsToolbar.option.noiseClass' },
] as const;

const SEO_OPTIONS = [
  { key: 'title', labelKey: 'tiresCmsToolbar.option.title' },
  { key: 'subtitle', labelKey: 'tiresCmsToolbar.option.subtitle' },
  { key: 'short_description', labelKey: 'tiresCmsToolbar.option.shortDescription' },
  { key: 'long_description', labelKey: 'tiresCmsToolbar.option.longDescription' },
  { key: 'seo_slug', labelKey: 'tiresCmsToolbar.option.seoSlug' },
  { key: 'seo_title', labelKey: 'tiresCmsToolbar.option.seoTitle' },
  { key: 'seo_description', labelKey: 'tiresCmsToolbar.option.seoDescription' },
] as const;

interface TiresCmsToolbarProps {
  isDark: boolean;
  hideHeader?: boolean;
  searchTerm: string;
  showNonPassengerDraft: boolean;
  missingMetadataFieldsDraft: string[];
  showMissingImagesOnlyDraft: boolean;
  showWithEprelOnlyDraft: boolean;
  missingSeoFieldsDraft: string[];
  supplierFilter: string;
  supplierDraft: string;
  tireSegmentDraft: string;
  supplierOptions: Array<{ code: string; label: string }>;
  syncingCatalog: boolean;
  hasPendingCatalogSync: boolean;
  catalogSyncMessage: string | null;
  catalogSyncProgress: { processed: number; total: number } | null;
  cachedItemCount: number;
  totalCount: number;
  preloading: boolean;
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
  onTireSegmentDraftChange: (value: string) => void;
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
  hideHeader = false,
  searchTerm,
  showNonPassengerDraft,
  missingMetadataFieldsDraft,
  showMissingImagesOnlyDraft,
  showWithEprelOnlyDraft,
  missingSeoFieldsDraft,
  supplierFilter,
  supplierDraft,
  tireSegmentDraft,
  supplierOptions,
  syncingCatalog,
  hasPendingCatalogSync,
  catalogSyncMessage,
  catalogSyncProgress,
  cachedItemCount,
  totalCount,
  preloading,
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
  onTireSegmentDraftChange,
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
  const { t } = useLanguage();
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
      ? t('tiresCmsToolbar.amountAdjustment')
      : bulkMarkupPercent.trim() !== ''
        ? t('tiresCmsToolbar.percentAdjustment')
        : null;

  return (
    <>
      {!hideHeader && (
        <div className={`border-b ${isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'}`}>
          <div className="px-8 py-6">
            <h1 className={`text-3xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('tiresCmsToolbar.title')}
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('tiresCmsToolbar.subtitle')}
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
                placeholder={t('tiresCmsToolbar.searchPlaceholder')}
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
              <button
                type="button"
                onClick={onResolveConflict}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pendingConflictCount > 0
                    ? isDark
                      ? 'bg-amber-500/15 text-amber-200 hover:bg-amber-500/25'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : isDark
                      ? 'bg-white/10 text-white hover:bg-white/15'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                {pendingConflictCount > 0
                  ? t('tiresCmsToolbar.resolveConflict', { count: pendingConflictCount })
                  : t('tiresCmsToolbar.reviewConflicts')}
              </button>

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
                {t('tiresCmsToolbar.viewSettings')}
              </button>

              <button
                type="button"
                onClick={onApplyCatalogSync}
                disabled={syncingCatalog || !hasPendingCatalogSync}
                title={t('tiresCmsToolbar.publishHint')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-white/10 disabled:text-gray-500'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-500'
                } disabled:cursor-not-allowed`}
              >
                {syncingCatalog
                  ? t('tiresCmsToolbar.syncing')
                  : t('tiresCmsToolbar.applySync')}
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
              {t('tiresCmsToolbar.syncingProgress', {
                processed: catalogSyncProgress.processed,
                total: catalogSyncProgress.total,
              })}
            </p>
          </div>
        ) : null}

        {totalCount > 0 && cachedItemCount < totalCount ? (
          <div className="mt-3 space-y-2">
            <div className={`h-2 overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
              <div
                className="h-full rounded-full bg-emerald-500 transition-[width] duration-200"
                style={{
                  width: `${Math.max(2, Math.min(100, (cachedItemCount / totalCount) * 100))}%`,
                }}
              />
            </div>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {preloading
                ? t('tiresCmsToolbar.indexingProgress', { indexed: cachedItemCount, total: totalCount })
                : t('tiresCmsToolbar.indexedProgress', { indexed: cachedItemCount, total: totalCount })}
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
              {t('tiresCmsToolbar.settingsTitle')}
            </SheetTitle>
            <SheetDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              {t('tiresCmsToolbar.settingsDescription')}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
            <section className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <div className="space-y-4">
                <div>
                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('tiresCmsToolbar.showBySupplier')}
                  </label>
                  <select
                    value={supplierDraft}
                    onChange={(e) => onSupplierDraftChange(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">{t('tiresCmsToolbar.allSuppliers')}</option>
                    {supplierOptions.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('tiresCmsToolbar.showByVehicleType')}
                  </label>
                  <select
                    value={tireSegmentDraft}
                    onChange={(e) => onTireSegmentDraftChange(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">{t('tiresCmsToolbar.allVehicleTypes')}</option>
                    <option value="passenger">{t('tiresCmsTable.segment.passenger')}</option>
                    <option value="van_c">{t('tiresCmsTable.segment.vanC')}</option>
                    <option value="suv_4x4">{t('tiresCmsTable.segment.suv4x4')}</option>
                    <option value="excluded_heavy">{t('tiresCmsTable.segment.excludedHeavy')}</option>
                    <option value="excluded_motorcycle">{t('tiresCmsTable.segment.excludedMotorcycle')}</option>
                    <option value="excluded_agri_industrial">{t('tiresCmsTable.segment.excludedAgriIndustrial')}</option>
                    <option value="other">{t('tiresCmsTable.segment.other')}</option>
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
                      {t('tiresCmsToolbar.showNonPassenger')}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t('tiresCmsToolbar.showNonPassengerHint')}
                    </p>
                  </div>
                </label>
              </div>
            </section>

            <section className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <div className="space-y-4">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('tiresCmsToolbar.missingMetadata')}
                  </p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('tiresCmsToolbar.missingMetadataHint')}
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
                        {t(option.labelKey)}
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
                    {t('tiresCmsToolbar.showWithEprel')}
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
                    {t('tiresCmsToolbar.showMissingImages')}
                  </p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('tiresCmsToolbar.showMissingImagesHint')}
                  </p>
                </div>
              </label>
            </section>

            <section className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <div className="space-y-4">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('tiresCmsToolbar.missingContentSeo')}
                  </p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('tiresCmsToolbar.missingContentSeoHint')}
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
                        {t(option.labelKey)}
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
                    {t('tiresCmsToolbar.bulkMarkup')}
                  </p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('tiresCmsToolbar.bulkMarkupHint')}
                  </p>
                </div>

                <select
                  value={bulkMarkupSupplier}
                  onChange={(e) => onBulkMarkupSupplierChange(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">{t('tiresCmsToolbar.chooseSupplier')}</option>
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
                    placeholder={t('tiresCmsToolbar.amountInput')}
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
                    placeholder={t('tiresCmsToolbar.percentInput')}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {loadingBulkMarkupCount
                    ? t('tiresCmsToolbar.countingItems')
                    : bulkMarkupSupplierOption && bulkMarkupMatchCount !== null
                      ? t('tiresCmsToolbar.matchingItems', {
                          supplier: bulkMarkupSupplierOption.label,
                          count: bulkMarkupMatchCount,
                        })
                      : t('tiresCmsToolbar.chooseSupplierForCount')}
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
                      {t(
                        bulkMarkupProgress.mode === 'revert'
                          ? 'tiresCmsToolbar.revertingProgress'
                          : 'tiresCmsToolbar.updatingProgress',
                        {
                          processed: bulkMarkupProgress.processed,
                          total: bulkMarkupProgress.total,
                        },
                      )}
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
                      ? t('tiresCmsToolbar.applying')
                      : bulkMarkupMatchCount !== null && bulkMarkupMatchCount > 0 && bulkAdjustmentLabel
                        ? t('tiresCmsToolbar.applyBulkMarkup', {
                            adjustment: bulkAdjustmentLabel,
                            count: bulkMarkupMatchCount,
                          })
                        : t('tiresCmsToolbar.chooseSupplierAndAmount')}
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
                      ? t('tiresCmsToolbar.reverting')
                      : t('tiresCmsToolbar.revertToApiPrice')}
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
              {t('tiresCmsToolbar.applySettings')}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
