import { useState } from 'react';
import { Loader2, Wand2 } from 'lucide-react';
import type { ProductCMS } from './types';
import type { TiresAiGenerationState } from './aiCopy';

interface TiresContentSectionProps {
  aiError: string | null;
  aiGeneratingField: TiresAiGenerationState | null;
  aiGenerationProgress: { current: number; total: number; label: string } | null;
  editData: Partial<ProductCMS>;
  identityBrand: string;
  identityModel: string;
  identitySizeString: string;
  isDark: boolean;
  language: string;
  onEditDataChange: (updater: (prev: Partial<ProductCMS>) => Partial<ProductCMS>) => void;
  onGenerateAllFields: () => void;
}

type LocaleMode = 'fi' | 'en';

export function TiresContentSection({
  aiError,
  aiGeneratingField,
  aiGenerationProgress,
  editData,
  identityBrand,
  identityModel,
  identitySizeString,
  isDark,
  language,
  onEditDataChange,
  onGenerateAllFields,
}: TiresContentSectionProps) {
  const [localeMode, setLocaleMode] = useState<LocaleMode>('fi');
  const englishContent = (editData.spec_overrides as any)?.i18n?.en ?? {};
  const isFinnish = localeMode === 'fi';
  const labels = {
    fi: language === 'fi' ? 'Suomi' : 'Finnish',
    en: 'English',
  };

  const updateLocalizedField = (
    field: 'title' | 'subtitle' | 'short_description' | 'long_description' | 'seo_slug' | 'seo_title' | 'seo_description',
    value: string,
  ) => {
    if (isFinnish) {
      onEditDataChange((prev) => ({ ...prev, [field]: value }));
      return;
    }

    onEditDataChange((prev) => {
      const specOverrides = { ...(prev.spec_overrides || {}) } as Record<string, any>;
      const i18n = { ...(specOverrides.i18n || {}) };
      const en = { ...(i18n.en || {}) };
      en[field] = value;
      i18n.en = en;
      specOverrides.i18n = i18n;
      return {
        ...prev,
        spec_overrides: specOverrides,
      };
    });
  };

  const localizedValues = isFinnish
    ? {
        title: editData.title ?? '',
        subtitle: editData.subtitle ?? '',
        short_description: editData.short_description ?? '',
        long_description: editData.long_description ?? '',
        seo_slug: editData.seo_slug ?? '',
        seo_title: editData.seo_title ?? '',
        seo_description: editData.seo_description ?? '',
      }
    : {
        title: englishContent.title ?? '',
        subtitle: englishContent.subtitle ?? '',
        short_description: englishContent.short_description ?? '',
        long_description: englishContent.long_description ?? '',
        seo_slug: englishContent.seo_slug ?? '',
        seo_title: englishContent.seo_title ?? '',
        seo_description: englishContent.seo_description ?? '',
      };

  return (
    <div>
      <div className="mb-4">
        <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {language === 'fi' ? 'Tuotesisältö & SEO' : 'Product Content & SEO'}
        </h3>
      </div>
      <div className="space-y-4">
        {aiGeneratingField === 'all_fields' && aiGenerationProgress ? (
          <div className={`rounded-lg border px-3 py-3 ${isDark ? 'border-blue-500/20 bg-blue-500/10' : 'border-blue-200 bg-blue-50'}`}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className={isDark ? 'text-blue-100' : 'text-blue-800'}>{aiGenerationProgress.label}</span>
              <span className={isDark ? 'text-blue-200' : 'text-blue-700'}>
                {Math.min(aiGenerationProgress.total, aiGenerationProgress.current)}/{aiGenerationProgress.total}
                {' '}({Math.round((Math.min(aiGenerationProgress.total, aiGenerationProgress.current) / Math.max(1, aiGenerationProgress.total)) * 100)}%)
              </span>
            </div>
            <div className={`h-2 overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-blue-100'}`}>
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(Math.min(aiGenerationProgress.total, aiGenerationProgress.current) / Math.max(1, aiGenerationProgress.total)) * 100}%` }}
              />
            </div>
          </div>
        ) : null}
        <div className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className={`inline-flex rounded-lg p-1 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
              {(['fi', 'en'] as const).map((locale) => (
                <button
                  key={locale}
                  type="button"
                  onClick={() => setLocaleMode(locale)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    localeMode === locale
                      ? isDark
                        ? 'bg-white/15 text-white'
                        : 'bg-white text-gray-900 shadow-sm'
                      : isDark
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {labels[locale]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onGenerateAllFields}
              disabled={Boolean(aiGeneratingField)}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                isDark
                  ? 'border-white/15 bg-white/5 text-gray-200 hover:bg-white/10'
                  : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {aiGeneratingField === 'all_fields' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
              AI Fill
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {language === 'fi' ? 'Tuoteotsikko' : 'Product Title'}
              </label>
              <input
                type="text"
                value={localizedValues.title}
                onChange={(e) => updateLocalizedField('title', e.target.value)}
                placeholder={`${identityBrand} ${identityModel}`}
                className={`w-full rounded-lg border px-3 py-2 ${
                  isDark
                    ? 'border-white/20 bg-[#1C1C1E] text-white placeholder-gray-500'
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {language === 'fi' ? 'Tuotteen alaotsikko' : 'Product Subtitle'}
              </label>
              <input
                type="text"
                value={localizedValues.subtitle}
                onChange={(e) => updateLocalizedField('subtitle', e.target.value)}
                placeholder={identitySizeString || ''}
                className={`w-full rounded-lg border px-3 py-2 ${
                  isDark
                    ? 'border-white/20 bg-[#1C1C1E] text-white placeholder-gray-500'
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {language === 'fi' ? 'Tuotteen lyhyet tiedot' : 'Product Short Detail'}
              </label>
              <textarea
                rows={3}
                value={localizedValues.short_description}
                onChange={(e) => updateLocalizedField('short_description', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 ${
                  isDark
                    ? 'border-white/20 bg-[#1C1C1E] text-white placeholder-gray-500'
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {language === 'fi' ? 'Tuotekuvaus' : 'Product Description'}
              </label>
              <textarea
                rows={6}
                value={localizedValues.long_description}
                onChange={(e) => updateLocalizedField('long_description', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 ${
                  isDark
                    ? 'border-white/20 bg-[#1C1C1E] text-white placeholder-gray-500'
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                SEO Slug
              </label>
              <input
                type="text"
                value={localizedValues.seo_slug}
                onChange={(e) => updateLocalizedField('seo_slug', e.target.value)}
                placeholder="tire-brand-model-size"
                className={`w-full rounded-lg border px-3 py-2 ${
                  isDark
                    ? 'border-white/20 bg-[#1C1C1E] text-white placeholder-gray-500'
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                SEO Title
              </label>
              <input
                type="text"
                value={localizedValues.seo_title}
                onChange={(e) => updateLocalizedField('seo_title', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 ${
                  isDark
                    ? 'border-white/20 bg-[#1C1C1E] text-white placeholder-gray-500'
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                SEO Description
              </label>
              <textarea
                rows={3}
                value={localizedValues.seo_description}
                onChange={(e) => updateLocalizedField('seo_description', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 ${
                  isDark
                    ? 'border-white/20 bg-[#1C1C1E] text-white placeholder-gray-500'
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
          </div>
        </div>

        {aiError ? (
          <div
            className={`rounded-lg border px-3 py-2 text-sm ${
              isDark ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {aiError}
          </div>
        ) : null}
      </div>
    </div>
  );
}
