import { useState } from 'react';
import { Copy, Check, SearchCheck, RefreshCw } from 'lucide-react';
import type { TireEanAuditResult } from './eanAudit';

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
  auditError: string | null;
  auditLoading: boolean;
  auditProgress: number | null;
  auditResult: TireEanAuditResult | null;
  applyAuditResult: () => void;
  baseBrand: string;
  baseDerivedEan: string | null;
  baseEan: string | null | undefined;
  baseModel: string;
  baseSeason: string | null;
  clearIdentityOverrides: () => void;
  getIdentityOverride: () => IdentityOverride | undefined;
  isDark: boolean;
  language: string;
  onAuditByEan: () => void;
  setIdentityField: (field: 'brand' | 'model' | 'ean' | 'size_string' | 'season' | 'load_index' | 'speed_rating', value?: string) => void;
  sizeParts: SizeParts;
  updateSizePart: (field: 'width' | 'aspect' | 'rim' | 'load_index' | 'speed_rating', value: string) => void;
}

export function TiresIdentitySection({
  auditError,
  auditLoading,
  auditProgress,
  auditResult,
  applyAuditResult,
  baseBrand,
  baseDerivedEan,
  baseEan,
  baseModel,
  baseSeason,
  clearIdentityOverrides,
  getIdentityOverride,
  isDark,
  language,
  onAuditByEan,
  setIdentityField,
  sizeParts,
  updateSizePart,
}: TiresIdentitySectionProps) {
  const identityOverride = getIdentityOverride();
  const [eanCopied, setEanCopied] = useState(false);
  const isPlaceholderEan = (value?: string | null) =>
    !value || String(value).trim().length === 0 || String(value).startsWith('EANMISSING_');
  const currentBaseEan = isPlaceholderEan(baseEan)
    ? (baseDerivedEan || '')
    : (baseEan || baseDerivedEan || '');
  const hasIdentityEanOverride = Boolean(identityOverride) && Object.prototype.hasOwnProperty.call(identityOverride, 'ean');
  const effectiveEanValue = hasIdentityEanOverride ? String(identityOverride?.ean ?? '') : currentBaseEan;
  const statusClassName = (status: string) => {
    if (status === 'match') {
      return isDark ? 'bg-green-500/15 text-green-300 border-green-500/25' : 'bg-green-50 text-green-700 border-green-200';
    }
    if (status === 'mismatch') {
      return isDark ? 'bg-red-500/15 text-red-300 border-red-500/25' : 'bg-red-50 text-red-700 border-red-200';
    }
    if (status === 'missing_current') {
      return isDark ? 'bg-amber-500/15 text-amber-300 border-amber-500/25' : 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return isDark ? 'bg-white/5 text-gray-300 border-white/10' : 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const fallbackCopyText = (value: string) => {
    if (typeof document === 'undefined') {
      return false;
    }

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);

    const selection = document.getSelection();
    const originalRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    }

    document.body.removeChild(textarea);

    if (originalRange && selection) {
      selection.removeAllRanges();
      selection.addRange(originalRange);
    }

    return copied;
  };

  const handleCopyEan = async () => {
    if (!currentBaseEan) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentBaseEan);
      } else if (!fallbackCopyText(currentBaseEan)) {
        throw new Error('Clipboard copy is not supported in this browser context.');
      }
      setEanCopied(true);
      window.setTimeout(() => setEanCopied(false), 1500);
    } catch (error) {
      const fallbackWorked = fallbackCopyText(currentBaseEan);
      if (fallbackWorked) {
        setEanCopied(true);
        window.setTimeout(() => setEanCopied(false), 1500);
        return;
      }
      console.error('Failed to copy EAN', error);
    }
  };

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
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className={`block text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              EAN
            </label>
            <button
              type="button"
              onClick={handleCopyEan}
              disabled={!currentBaseEan}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                !currentBaseEan
                  ? isDark
                    ? 'cursor-not-allowed text-gray-600'
                    : 'cursor-not-allowed text-gray-400'
                  : isDark
                    ? 'bg-white/10 text-gray-200 hover:bg-white/15'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {eanCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {eanCopied
                ? (language === 'fi' ? 'Kopioitu' : 'Copied')
                : (language === 'fi' ? 'Kopioi nykyinen' : 'Copy current')}
            </button>
          </div>
          <input
            type="text"
            value={effectiveEanValue}
            onChange={(e) => setIdentityField('ean', e.target.value)}
            placeholder="EAN"
            className={`w-full px-3 py-2 rounded-lg border font-mono ${
              isDark ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />
          <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {language === 'fi'
              ? 'Syötä oikea EAN korvaamaan puuttuva EAN.'
              : 'Enter real EAN to replace missing EAN.'}
          </p>
          {currentBaseEan && (
            <p className={`mt-1 text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fi' ? 'Nykyinen EAN:' : 'Current EAN:'} {currentBaseEan}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onAuditByEan}
              disabled={auditLoading || !String(effectiveEanValue ?? '').replace(/\D/g, '')}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                auditLoading || !String(effectiveEanValue ?? '').replace(/\D/g, '')
                  ? isDark
                    ? 'cursor-not-allowed bg-white/5 text-gray-600'
                    : 'cursor-not-allowed bg-gray-100 text-gray-400'
                  : isDark
                    ? 'bg-blue-500/15 text-blue-200 hover:bg-blue-500/25'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              {auditLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <SearchCheck className="h-3.5 w-3.5" />}
              {auditLoading
                ? (language === 'fi' ? 'Haetaan EPREListä...' : 'Fetching EPREL...')
                : (language === 'fi' ? 'Hae EPREListä' : 'Fetch from EPREL')}
            </button>
            {auditResult && (
              <button
                type="button"
                onClick={applyAuditResult}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                  isDark ? 'bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <Check className="h-3.5 w-3.5" />
                {language === 'fi' ? 'Käytä EPREL-arvoja' : 'Apply EPREL values'}
              </button>
            )}
          </div>
          {auditLoading && auditProgress !== null ? (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  {language === 'fi' ? 'Auditin eteneminen' : 'Audit progress'}
                </span>
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{Math.max(0, Math.min(100, Math.round(auditProgress)))}%</span>
              </div>
              <div className={`h-2 overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, auditProgress))}%` }}
                />
              </div>
            </div>
          ) : null}
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

      {(auditError || auditResult) && (
        <div className={`mt-4 rounded-lg border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>
          {auditError && (
            <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>{auditError}</p>
          )}

          {auditResult && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fi' ? 'EPREL-yhteenveto' : 'EPREL summary'}
                  </p>
                  <p className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {auditResult.summary}
                  </p>
                  {auditResult.eprel_registration_number ? (
                    <p className={`mt-2 text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      EPREL ID: {auditResult.eprel_registration_number}
                    </p>
                  ) : null}
                </div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                  auditResult.confidence === 'high'
                    ? statusClassName('match')
                    : auditResult.confidence === 'medium'
                      ? statusClassName('missing_current')
                      : statusClassName('unknown')
                }`}>
                  {language === 'fi' ? 'Luottamus' : 'Confidence'}: {auditResult.confidence}
                </span>
              </div>

              {auditResult.source_urls.length > 0 && (
                <div>
                  <p className={`mb-2 text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fi' ? 'EPREL-lähteet' : 'EPREL sources'}
                  </p>
                  <div className="space-y-1">
                    {auditResult.source_urls.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className={`block truncate text-xs underline ${isDark ? 'text-blue-300' : 'text-blue-700'}`}
                      >
                        {url}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {auditResult.checks.length > 0 && (
                <div className="space-y-2">
                  {auditResult.checks.map((check) => (
                    <div
                      key={check.field}
                      className={`rounded-lg border p-3 ${isDark ? 'border-white/10 bg-black/10' : 'border-gray-200 bg-gray-50'}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{check.label}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClassName(check.status)}`}>
                            {check.status}
                          </span>
                          {check.review_status ? (
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                              check.review_status === 'accepted'
                                ? (isDark ? 'border-green-500/25 bg-green-500/15 text-green-300' : 'border-green-200 bg-green-50 text-green-700')
                                : check.review_status === 'rejected'
                                  ? (isDark ? 'border-red-500/25 bg-red-500/15 text-red-300' : 'border-red-200 bg-red-50 text-red-700')
                                  : check.review_status === 'kept_current'
                                    ? (isDark ? 'border-amber-500/25 bg-amber-500/15 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-700')
                                    : (isDark ? 'border-white/10 bg-white/5 text-gray-300' : 'border-gray-200 bg-gray-100 text-gray-600')
                            }`}>
                              {check.review_status}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                        <div>
                          <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                            {language === 'fi' ? 'Nykyinen' : 'Current'}:
                          </span>{' '}
                          <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{check.current_value || '—'}</span>
                        </div>
                        <div>
                          <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                            {language === 'fi' ? 'Auditoitu' : 'Audited'}:
                          </span>{' '}
                          <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{check.audited_value || '—'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
