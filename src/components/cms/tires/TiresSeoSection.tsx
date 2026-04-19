import { Loader2, Wand2 } from 'lucide-react';
import type { ProductCMS } from './types';
import type { TiresAiCopyField } from './aiCopy';

interface TiresSeoSectionProps {
  aiError: string | null;
  aiGeneratingField: TiresAiCopyField | null;
  editData: Partial<ProductCMS>;
  isDark: boolean;
  language: string;
  onEditDataChange: (updater: (prev: Partial<ProductCMS>) => Partial<ProductCMS>) => void;
  onGenerateField: (field: 'seo_slug' | 'seo_title' | 'seo_description') => void;
}

export function TiresSeoSection({
  aiError,
  aiGeneratingField,
  editData,
  isDark,
  language,
  onEditDataChange,
  onGenerateField,
}: TiresSeoSectionProps) {
  const renderAiButton = (
    field: 'seo_slug' | 'seo_title' | 'seo_description',
  ) => {
    const isGenerating = aiGeneratingField === field;

    return (
      <button
        type="button"
        onClick={() => onGenerateField(field)}
        disabled={Boolean(aiGeneratingField)}
        className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
          isDark
            ? 'border-white/15 bg-white/5 text-gray-200 hover:bg-white/10'
            : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
        {language === 'fi' ? 'AI kirjoitus' : 'AI writing'}
      </button>
    );
  };

  return (
    <div>
      <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        SEO
      </h3>
      <div className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {language === 'fi' ? 'URL-tunniste' : 'SEO Slug'}
            </label>
            {renderAiButton('seo_slug')}
          </div>
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
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {language === 'fi' ? 'SEO-otsikko' : 'SEO Title'}
            </label>
            {renderAiButton('seo_title')}
          </div>
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
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {language === 'fi' ? 'SEO-kuvaus' : 'SEO Description'}
            </label>
            {renderAiButton('seo_description')}
          </div>
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
