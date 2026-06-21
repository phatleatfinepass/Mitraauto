import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../ui/button';

interface RimCatalogLayoutProps {
  language: string;
  theme: string;
  searchMode: 'license' | 'manual';
  onSearchModeChange: (mode: 'license' | 'manual') => void;
  filters: React.ReactNode;
  hasSearched: boolean;
  totalCount: number;
  errorMessage: string | null;
  loading: boolean;
  productsGridRef: React.RefObject<HTMLDivElement | null>;
  content: React.ReactNode;
  emptyBeforeSearch: React.ReactNode;
  emptyAfterSearch: React.ReactNode;
  pagination: React.ReactNode;
  onClearSearch: () => void;
}

export function RimCatalogLayout({
  theme,
  searchMode,
  onSearchModeChange,
  filters,
  hasSearched,
  totalCount,
  errorMessage,
  loading,
  productsGridRef,
  content,
  emptyBeforeSearch,
  emptyAfterSearch,
  pagination,
  onClearSearch,
}: RimCatalogLayoutProps) {
  const isDark = theme === 'dark';
  const { t } = useLanguage();

  return (
    <div className="container mx-auto max-w-7xl px-6 lg:px-8 py-10">
      <div className={`border rounded-xl ${isDark ? 'border-white/10 bg-[#11161d]' : 'border-gray-200 bg-white'}`}>
        <div className={`border-b px-6 py-6 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <h1 className={`text-3xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('catalog.rimsTitle')}
              </h1>
              <p className={`max-w-2xl text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('catalog.rimsSubtitle')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={() => onSearchModeChange('license')}
                variant={searchMode === 'license' ? 'default' : 'outline'}
                className={searchMode === 'license'
                  ? 'bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white'
                  : isDark
                    ? 'border-white/10 bg-transparent text-gray-200 hover:bg-white/5'
                    : ''}
              >
                {t('catalog.byVehicle')}
              </Button>
              <Button
                type="button"
                onClick={() => onSearchModeChange('manual')}
                variant={searchMode === 'manual' ? 'default' : 'outline'}
                className={searchMode === 'manual'
                  ? 'bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white'
                  : isDark
                    ? 'border-white/10 bg-transparent text-gray-200 hover:bg-white/5'
                    : ''}
              >
                {t('catalog.byDimensions')}
              </Button>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          {filters}

          <div className="mt-8 space-y-6">
            {hasSearched && (
              <div
                ref={productsGridRef}
                className={`flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between ${isDark ? 'border-white/10' : 'border-gray-200'}`}
              >
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                    {t('catalog.rimsFound', { count: totalCount })}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    {t('catalog.rimRefineHint')}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={onClearSearch}
                  className={isDark ? 'border-white/10 text-gray-200 hover:bg-white/5' : ''}
                >
                  {t('catalog.clearSearch')}
                </Button>
              </div>
            )}

            {errorMessage && (
              <div className={`text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                {errorMessage}
              </div>
            )}

            {!hasSearched && emptyBeforeSearch}
            {hasSearched && content}
            {hasSearched && !loading && totalCount === 0 && emptyAfterSearch}
            {hasSearched && pagination}
          </div>
        </div>
      </div>
    </div>
  );
}
