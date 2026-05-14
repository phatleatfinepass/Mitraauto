import React from 'react';
import { useLanguage } from '../../../i18n/LanguageContext';

interface TiresCmsPaginationProps {
  isDark: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  startItem: number;
  endItem: number;
  onPageChange: (page: number) => void;
}

export function TiresCmsPagination({
  isDark,
  currentPage,
  totalPages,
  totalCount,
  startItem,
  endItem,
  onPageChange,
}: TiresCmsPaginationProps) {
  const { t } = useLanguage();

  if (totalPages <= 1) {
    return null;
  }

  const totalSuffix = totalCount > 0 ? t('tiresCmsPagination.totalSuffix', { total: totalCount }) : '';
  const pageButtons =
    totalPages <= 7
      ? Array.from({ length: totalPages }, (_, index) => index + 1)
      : [
          1,
          ...(currentPage > 3 ? ['ellipsis-left' as const] : []),
          ...Array.from(
            { length: Math.min(3, totalPages) },
            (_, index) => Math.max(2, Math.min(totalPages - 1, currentPage - 1 + index))
          ).filter((page, index, arr) => page > 1 && page < totalPages && arr.indexOf(page) === index),
          ...(currentPage < totalPages - 2 ? ['ellipsis-right' as const] : []),
          totalPages,
        ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {t('tiresCmsPagination.showing', { start: startItem, end: endItem, suffix: totalSuffix })}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            isDark
              ? 'border-white/10 text-gray-200 hover:bg-white/10 disabled:text-gray-600 disabled:hover:bg-transparent'
              : 'border-gray-200 text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-transparent'
          }`}
        >
          {t('tiresCmsPagination.previous')}
        </button>
        {pageButtons.map((page, index) =>
          typeof page === 'number' ? (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                page === currentPage
                  ? isDark
                    ? 'bg-blue-500/30 text-blue-200'
                    : 'bg-blue-100 text-blue-700'
                  : isDark
                    ? 'bg-white/5 text-gray-200 hover:bg-white/10'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={`${page}-${index}`} className={`px-1 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              …
            </span>
          )
        )}
        <span
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {t('tiresCmsPagination.page', { current: currentPage, total: totalPages })}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            isDark
              ? 'border-white/10 text-gray-200 hover:bg-white/10 disabled:text-gray-600 disabled:hover:bg-transparent'
              : 'border-gray-200 text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-transparent'
          }`}
        >
          {t('tiresCmsPagination.next')}
        </button>
        <label className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          <span>{t('tiresCmsPagination.jumpToPage')}</span>
          <input
            key={currentPage}
            type="number"
            min={1}
            max={totalPages}
            defaultValue={currentPage}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              const value = Number((event.currentTarget as HTMLInputElement).value);
              if (!Number.isFinite(value)) return;
              onPageChange(Math.max(1, Math.min(totalPages, Math.floor(value))));
            }}
            className={`w-20 px-2 py-1.5 rounded-lg border ${
              isDark ? 'bg-[#1C1C1E] border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </label>
      </div>
    </div>
  );
}
