import type { ProductCMS } from './types';

interface TiresContentSectionProps {
  editData: Partial<ProductCMS>;
  identityBrand: string;
  identityModel: string;
  identitySizeString: string;
  isDark: boolean;
  language: string;
  onEditDataChange: (updater: (prev: Partial<ProductCMS>) => Partial<ProductCMS>) => void;
}

export function TiresContentSection({
  editData,
  identityBrand,
  identityModel,
  identitySizeString,
  isDark,
  language,
  onEditDataChange,
}: TiresContentSectionProps) {
  return (
    <div>
      <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {language === 'fi' ? 'Sisältö' : 'Content'}
      </h3>
      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'Otsikko' : 'Title'}
          </label>
          <input
            type="text"
            value={editData.title ?? ''}
            onChange={(e) => onEditDataChange((prev) => ({ ...prev, title: e.target.value }))}
            placeholder={`${identityBrand} ${identityModel}`}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark
                ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'Alaotsikko' : 'Subtitle'}
          </label>
          <input
            type="text"
            value={editData.subtitle ?? ''}
            onChange={(e) => onEditDataChange((prev) => ({ ...prev, subtitle: e.target.value }))}
            placeholder={identitySizeString || ''}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark
                ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'Lyhyt kuvaus' : 'Short Description'}
          </label>
          <textarea
            rows={3}
            value={editData.short_description ?? ''}
            onChange={(e) => onEditDataChange((prev) => ({ ...prev, short_description: e.target.value }))}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark
                ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'Pitkä kuvaus' : 'Long Description'}
          </label>
          <textarea
            rows={6}
            value={editData.long_description ?? ''}
            onChange={(e) => onEditDataChange((prev) => ({ ...prev, long_description: e.target.value }))}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark
                ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
