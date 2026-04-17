import type { ProductCMS } from './types';

interface TiresSeoSectionProps {
  editData: Partial<ProductCMS>;
  isDark: boolean;
  language: string;
  onEditDataChange: (updater: (prev: Partial<ProductCMS>) => Partial<ProductCMS>) => void;
}

export function TiresSeoSection({
  editData,
  isDark,
  language,
  onEditDataChange,
}: TiresSeoSectionProps) {
  return (
    <div>
      <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        SEO
      </h3>
      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'URL-tunniste' : 'SEO Slug'}
          </label>
          <input
            type="text"
            value={editData.seo_slug ?? ''}
            onChange={(e) => onEditDataChange((prev) => ({ ...prev, seo_slug: e.target.value }))}
            placeholder="tire-brand-model-size"
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark
                ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'SEO-otsikko' : 'SEO Title'}
          </label>
          <input
            type="text"
            value={editData.seo_title ?? ''}
            onChange={(e) => onEditDataChange((prev) => ({ ...prev, seo_title: e.target.value }))}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark
                ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'SEO-kuvaus' : 'SEO Description'}
          </label>
          <textarea
            rows={3}
            value={editData.seo_description ?? ''}
            onChange={(e) => onEditDataChange((prev) => ({ ...prev, seo_description: e.target.value }))}
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
