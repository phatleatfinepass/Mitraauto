import React from 'react';

interface RimsCmsPaginationProps {
  isDark: boolean;
  language: string;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  startItem: number;
  endItem: number;
  paginationItems: Array<number | string>;
  onPageChange: (page: number) => void;
}

export function RimsCmsPagination({
  isDark,
  language,
  currentPage,
  totalPages,
  totalCount,
  startItem,
  endItem,
  paginationItems,
  onPageChange,
}: RimsCmsPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {language === 'fi'
          ? `Näytetään ${startItem}-${endItem} / ${totalCount}`
          : `Showing ${startItem}-${endItem} of ${totalCount}`}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors ${
            isDark
              ? 'border-white/10 text-gray-200 hover:bg-white/10 disabled:text-gray-600 disabled:hover:bg-transparent'
              : 'border-gray-200 text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-transparent'
          }`}
          aria-label={language === 'fi' ? 'Ensimmäinen sivu' : 'First page'}
        >
          {language === 'fi' ? 'Ens.' : 'First'}
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            isDark
              ? 'border-white/10 text-gray-200 hover:bg-white/10 disabled:text-gray-600 disabled:hover:bg-transparent'
              : 'border-gray-200 text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-transparent'
          }`}
        >
          {language === 'fi' ? 'Edellinen' : 'Previous'}
        </button>
        {paginationItems.map((item, index) => {
          if (typeof item !== 'number') {
            return (
              <span
                key={`${item}-${index}`}
                className={`px-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
              >
                ...
              </span>
            );
          }

          return (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                item === currentPage
                  ? isDark
                    ? 'bg-blue-500/30 text-blue-200'
                    : 'bg-blue-100 text-blue-700'
                  : isDark
                    ? 'text-gray-300 hover:bg-white/10'
                    : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            isDark
              ? 'border-white/10 text-gray-200 hover:bg-white/10 disabled:text-gray-600 disabled:hover:bg-transparent'
              : 'border-gray-200 text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-transparent'
          }`}
        >
          {language === 'fi' ? 'Seuraava' : 'Next'}
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors ${
            isDark
              ? 'border-white/10 text-gray-200 hover:bg-white/10 disabled:text-gray-600 disabled:hover:bg-transparent'
              : 'border-gray-200 text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-transparent'
          }`}
          aria-label={language === 'fi' ? 'Viimeinen sivu' : 'Last page'}
        >
          {language === 'fi' ? 'Vik.' : 'Last'}
        </button>
      </div>
    </div>
  );
}
