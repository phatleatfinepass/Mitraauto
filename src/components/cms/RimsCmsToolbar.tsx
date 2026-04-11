import React from 'react';
import { Search } from 'lucide-react';

interface RimsCmsToolbarProps {
  isDark: boolean;
  language: string;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
}

export function RimsCmsToolbar({
  isDark,
  language,
  searchTerm,
  onSearchTermChange,
}: RimsCmsToolbarProps) {
  return (
    <>
      <div className={`border-b ${isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'}`}>
        <div className="px-8 py-6">
          <h1 className={`text-3xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'Vanteet CMS' : 'Rims CMS'}
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'fi'
              ? 'Hallitse vanteiden sisältöä, pakettihinnoittelua ja kuvia'
              : 'Manage rim content, bundle pricing, and images'}
          </p>
        </div>
      </div>

      <div className={`border-b ${isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'} px-8 py-4`}>
        <div className="relative max-w-md">
          <Search className={`absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder={language === 'fi' ? 'Hae brändin, mallin, värin tai EAN:n mukaan...' : 'Search by brand, model, color, or EAN...'}
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className={`w-full rounded-lg border py-2 pl-10 pr-4 ${
              isDark
                ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>
      </div>
    </>
  );
}
