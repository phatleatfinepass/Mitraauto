import React from 'react';

interface TiresCmsPaginationProps {
  isDark: boolean;
  language: string;
  currentPage: number;
  hasNextPage: boolean;
  discoveredPageCount: number;
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
  discoveredPageCount,
  totalCount,
  startItem,
  endItem,
  onPageChange,
}: TiresCmsPaginationProps) {
  if (currentPage <= 1 && !hasNextPage) {
    return null;
  }

  const jumpMaxPage = hasNextPage ? discoveredPageCount + 1 : discoveredPageCount;
  const pageButtons = (() => {
    const pages = new Set<number>();
    pages.add(1);
    pages.add(currentPage);
    pages.add(Math.max(1, currentPage - 1));
    pages.add(Math.min(discoveredPageCount, currentPage + 1));
    pages.add(discoveredPageCount);
    return Array.from(pages)
      .filter((page) => page >= 1 && page <= discoveredPageCount)
      .sort((a, b) => a - b);
  })();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {language === 'fi'
          ? `Näytetään ${startItem}-${endItem}${totalCount > 0 ? ` / vähintään ${totalCount}` : ''}`
          : `Showing ${startItem}-${endItem}${totalCount > 0 ? ` / at least ${totalCount}` : ''}`}
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
          {language === 'fi' ? 'Edellinen' : 'Previous'}
        </button>
        {pageButtons.map((page, index) => {
          const previous = pageButtons[index - 1];
          const showGap = previous !== undefined && page - previous > 1;
          return (
            <React.Fragment key={page}>
              {showGap ? (
                <span className={`px-1 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>…</span>
              ) : null}
              <button
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
            </React.Fragment>
          );
        })}
        <span
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {language === 'fi'
            ? `Sivu ${currentPage} / ${discoveredPageCount}${hasNextPage ? '+' : ''}`
            : `Page ${currentPage} / ${discoveredPageCount}${hasNextPage ? '+' : ''}`}
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
        <label className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          <span>{language === 'fi' ? 'Siirry sivulle' : 'Jump to page'}</span>
          <input
            key={currentPage}
            type="number"
            min={1}
            max={jumpMaxPage}
            defaultValue={currentPage}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              const value = Number((event.currentTarget as HTMLInputElement).value);
              if (!Number.isFinite(value)) return;
              onPageChange(Math.max(1, Math.min(jumpMaxPage, value)));
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
