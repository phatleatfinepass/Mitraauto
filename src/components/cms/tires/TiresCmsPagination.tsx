import React from 'react';

interface TiresCmsPaginationProps {
  isDark: boolean;
  language: string;
  currentPage: number;
  hasNextPage: boolean;
  totalCount: number;
  startItem: number;
  endItem: number;
  onPageChange: (page: number) => void;
}

export function TiresCmsPagination({
  isDark,
  language,
  currentPage,
  hasNextPage,
  totalCount,
  startItem,
  endItem,
  onPageChange,
}: TiresCmsPaginationProps) {
  if (currentPage <= 1 && !hasNextPage) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {language === 'fi'
          ? `Näytetään ${startItem}-${endItem}${totalCount > 0 ? ` / vähintään ${totalCount}` : ''}`
          : `Showing ${startItem}-${endItem}${totalCount > 0 ? ` / at least ${totalCount}` : ''}`}
      </p>
      <div className="flex items-center gap-2">
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
          {language === 'fi' ? 'Edellinen' : 'Previous'}
        </button>
        <span
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            isDark ? 'bg-white/5 text-gray-200' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {language === 'fi' ? `Sivu ${currentPage}` : `Page ${currentPage}`}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            isDark
              ? 'border-white/10 text-gray-200 hover:bg-white/10 disabled:text-gray-600 disabled:hover:bg-transparent'
              : 'border-gray-200 text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-transparent'
          }`}
        >
          {language === 'fi' ? 'Seuraava' : 'Next'}
        </button>
      </div>
    </div>
  );
}
