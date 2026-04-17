interface IdentityOverride {
  brand?: string;
  model?: string;
  ean?: string;
  season?: string;
}

interface SizeParts {
  width: string;
  aspect: string;
  rim: string;
  load_index: string;
  speed_rating: string;
}

interface TiresIdentitySectionProps {
  baseBrand: string;
  baseDerivedEan: string | null;
  baseEan: string | null | undefined;
  baseModel: string;
  baseSeason: string | null;
  clearIdentityOverrides: () => void;
  getIdentityOverride: () => IdentityOverride | undefined;
  isDark: boolean;
  language: string;
  setIdentityField: (field: 'brand' | 'model' | 'ean' | 'size_string' | 'season' | 'load_index' | 'speed_rating', value?: string) => void;
  sizeParts: SizeParts;
  updateSizePart: (field: 'width' | 'aspect' | 'rim' | 'load_index' | 'speed_rating', value: string) => void;
}

export function TiresIdentitySection({
  baseBrand,
  baseDerivedEan,
  baseEan,
  baseModel,
  baseSeason,
  clearIdentityOverrides,
  getIdentityOverride,
  isDark,
  language,
  setIdentityField,
  sizeParts,
  updateSizePart,
}: TiresIdentitySectionProps) {
  const identityOverride = getIdentityOverride();

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {language === 'fi' ? 'Tunnisteet' : 'Identity'}
        </h3>
        <button
          type="button"
          onClick={clearIdentityOverrides}
          className={`flex items-center gap-2 text-sm ${isDark ? 'text-blue-200 hover:text-white' : 'text-blue-700 hover:text-blue-900'}`}
        >
          {language === 'fi' ? 'Palauta perustasot' : 'Reset to base'}
        </button>
      </div>

      <div className={`grid grid-cols-2 gap-4 p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
        <div>
          <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'fi' ? 'Brändi' : 'Brand'}
          </label>
          <input
            type="text"
            value={identityOverride?.brand ?? baseBrand}
            onChange={(e) => setIdentityField('brand', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>

        <div>
          <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'fi' ? 'Malli' : 'Model'}
          </label>
          <input
            type="text"
            value={identityOverride?.model ?? baseModel}
            onChange={(e) => setIdentityField('model', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>

        <div>
          <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            EAN
          </label>
          <input
            type="text"
            value={identityOverride?.ean ?? ''}
            onChange={(e) => setIdentityField('ean', e.target.value)}
            placeholder={baseEan || baseDerivedEan || 'EAN'}
            className={`w-full px-3 py-2 rounded-lg border font-mono ${
              isDark ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />
          <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {language === 'fi'
              ? 'Syötä oikea EAN korvaamaan puuttuva EAN.'
              : 'Enter real EAN to replace missing EAN.'}
          </p>
        </div>

        <div>
          <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'fi' ? 'Koko' : 'Size'}
          </label>
          <div className="grid grid-cols-5 gap-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder="205"
              value={sizeParts.width}
              onChange={(e) => updateSizePart('width', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="55"
              value={sizeParts.aspect}
              onChange={(e) => updateSizePart('aspect', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="16"
              value={sizeParts.rim}
              onChange={(e) => updateSizePart('rim', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="91"
              value={sizeParts.load_index}
              onChange={(e) => updateSizePart('load_index', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <input
              type="text"
              placeholder="V"
              value={sizeParts.speed_rating}
              onChange={(e) => updateSizePart('speed_rating', e.target.value.toUpperCase())}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
          <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {language === 'fi' ? 'Muoto: 205 / 55 R16 91 V' : 'Format: 205 / 55 R16 91 V'}
          </p>
        </div>

        <div>
          <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'fi' ? 'Kausi' : 'Season'}
          </label>
          <select
            value={identityOverride?.season ?? baseSeason ?? ''}
            onChange={(e) => setIdentityField('season', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">{language === 'fi' ? 'Perusta (ei muutosta)' : 'Use base value'}</option>
            <option value="summer">{language === 'fi' ? 'Kesä' : 'Summer'}</option>
            <option value="winter">{language === 'fi' ? 'Talvi' : 'Winter'}</option>
            <option value="all_season">{language === 'fi' ? 'Ympärivuotinen' : 'All Season'}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
