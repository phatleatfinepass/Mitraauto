import type { ReactNode } from 'react';
import { useState } from 'react';
import { Check, Copy, ExternalLink, RefreshCw, SearchCheck } from 'lucide-react';
import { TYRE_LABEL_SECTION_TITLE, type TyreLabelSectionData } from '../../../utils/tyreLabel';
import type { TireEanAuditResult, TireEanAuditCheck } from './eanAudit';
import type { TireRow } from './types';

type TireBadgeKey =
  | 'ev_ready'
  | 'runflat'
  | 'xl'
  | 'studded'
  | 'threepmsf'
  | 'winter_approved'
  | 'ice_approved';

type TyreLabelGroup = 'identity' | 'eu_label' | 'compliance';

interface IdentityOverride {
  brand?: string;
  model?: string;
  ean?: string;
  season?: string;
}

interface EuOverride {
  fuel_class?: string;
  wet_grip_class?: string;
  noise_db?: number;
  noise_class?: string;
}

interface SizeParts {
  width: string;
  aspect: string;
  rim: string;
  load_index: string;
  speed_rating: string;
}

interface TiresTyreLabelSectionProps {
  applyAuditResult: () => void;
  auditError: string | null;
  auditLoading: boolean;
  auditProgress: number | null;
  auditResult: TireEanAuditResult | null;
  baseBrand: string;
  baseDerivedEan: string | null;
  baseEan: string | null | undefined;
  baseModel: string;
  baseSeason: string | null;
  clearEUOverrides: () => void;
  clearFeatureOverrides: () => void;
  clearIdentityOverrides: () => void;
  euFuelWetOptions: string[];
  euNoiseClassOptions: string[];
  getEffectiveFeatureValue: (field: TireBadgeKey) => boolean;
  getEuOverride: () => EuOverride | undefined;
  getIdentityOverride: () => IdentityOverride | undefined;
  hasEuOverride: boolean;
  isDark: boolean;
  language: string;
  onAuditByEan: () => void;
  onSetEuField: (field: string, value: any) => void;
  onTyreLabelFieldChange: (group: TyreLabelGroup, field: string, value?: string) => void;
  selectedTire: TireRow;
  setFeatureField: (field: TireBadgeKey, value: boolean) => void;
  setIdentityField: (field: 'brand' | 'model' | 'ean' | 'size_string' | 'season' | 'load_index' | 'speed_rating', value?: string) => void;
  sizeParts: SizeParts;
  tyreLabelSection: TyreLabelSectionData;
  updateSizePart: (field: 'width' | 'aspect' | 'rim' | 'load_index' | 'speed_rating', value: string) => void;
}

const TIRE_BADGES: Array<{ key: TireBadgeKey; labelFi: string; labelEn: string; regulated?: boolean }> = [
  { key: 'ev_ready', labelFi: 'EV', labelEn: 'EV' },
  { key: 'runflat', labelFi: 'RunFlat', labelEn: 'RunFlat' },
  { key: 'xl', labelFi: 'XL', labelEn: 'XL' },
  { key: 'studded', labelFi: 'Nastat', labelEn: 'Studded' },
  { key: 'threepmsf', labelFi: '3PMSF', labelEn: '3PMSF', regulated: true },
  { key: 'winter_approved', labelFi: 'M+S', labelEn: 'M+S' },
  { key: 'ice_approved', labelFi: 'Jää', labelEn: 'Ice approved', regulated: true },
];

const EU_GRADES = ['A', 'B', 'C', 'D', 'E'] as const;

function RegulationNote({ isDark, text }: { isDark: boolean; text: string }) {
  return <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{text}</p>;
}

function FieldLabel({ children, isDark }: { children: string; isDark: boolean }) {
  return <label className={`mb-1 block text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{children}</label>;
}

function TextInput({
  isDark,
  onChange,
  placeholder,
  type = 'text',
  value,
}: {
  isDark: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={`w-full rounded-lg border px-3 py-2 ${
        isDark ? 'border-white/20 bg-[#1C1C1E] text-white placeholder-gray-500' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
      }`}
    />
  );
}

function SelectInput({
  children,
  isDark,
  onChange,
  value,
}: {
  children: ReactNode;
  isDark: boolean;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`w-full rounded-lg border px-3 py-2 ${
        isDark ? 'border-white/20 bg-[#1C1C1E] text-white' : 'border-gray-300 bg-white text-gray-900'
      }`}
    >
      {children}
    </select>
  );
}

function statusClassName(isDark: boolean, status: string) {
  if (status === 'match') {
    return isDark ? 'border-green-500/25 bg-green-500/15 text-green-300' : 'border-green-200 bg-green-50 text-green-700';
  }
  if (status === 'mismatch') {
    return isDark ? 'border-red-500/25 bg-red-500/15 text-red-300' : 'border-red-200 bg-red-50 text-red-700';
  }
  if (status === 'missing_current') {
    return isDark ? 'border-amber-500/25 bg-amber-500/15 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-700';
  }
  return isDark ? 'border-white/10 bg-white/5 text-gray-300' : 'border-gray-200 bg-gray-100 text-gray-600';
}

function gradeTone(isDark: boolean, grade: string | null | undefined, active: boolean) {
  if (!active) {
    return isDark ? 'border-white/10 bg-white/5 text-gray-500' : 'border-gray-200 bg-gray-100 text-gray-400';
  }

  switch ((grade ?? '').toUpperCase()) {
    case 'A':
      return isDark ? 'border-green-500/30 bg-green-500/15 text-green-300' : 'border-green-200 bg-green-50 text-green-700';
    case 'B':
      return isDark ? 'border-lime-500/30 bg-lime-500/15 text-lime-300' : 'border-lime-200 bg-lime-50 text-lime-700';
    case 'C':
      return isDark ? 'border-yellow-500/30 bg-yellow-500/15 text-yellow-300' : 'border-yellow-200 bg-yellow-50 text-yellow-700';
    case 'D':
      return isDark ? 'border-orange-500/30 bg-orange-500/15 text-orange-300' : 'border-orange-200 bg-orange-50 text-orange-700';
    case 'E':
      return isDark ? 'border-red-500/30 bg-red-500/15 text-red-300' : 'border-red-200 bg-red-50 text-red-700';
    default:
      return isDark ? 'border-white/10 bg-white/5 text-gray-300' : 'border-gray-200 bg-white text-gray-700';
  }
}

function AuditChecks({
  checks,
  isDark,
  language,
}: {
  checks: TireEanAuditCheck[];
  isDark: boolean;
  language: string;
}) {
  if (checks.length === 0) return null;

  return (
    <div className="space-y-2">
      {checks.map((check) => (
        <div key={check.field} className={`rounded-lg border p-3 ${isDark ? 'border-white/10 bg-black/10' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{check.label}</p>
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClassName(isDark, check.status)}`}>
              {check.status}
            </span>
          </div>
          <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                {language === 'fi' ? 'Nykyinen' : 'Current'}:
              </span>{' '}
              <span className={isDark ? 'text-gray-200' : 'text-gray-700'}>{check.current_value || '—'}</span>
            </div>
            <div>
              <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                {language === 'fi' ? 'Auditoitu' : 'Audited'}:
              </span>{' '}
              <span className={isDark ? 'text-gray-200' : 'text-gray-700'}>{check.audited_value || '—'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TiresTyreLabelSection({
  applyAuditResult,
  auditError,
  auditLoading,
  auditProgress,
  auditResult,
  baseBrand,
  baseDerivedEan,
  baseEan,
  baseModel,
  baseSeason,
  clearEUOverrides,
  clearFeatureOverrides,
  clearIdentityOverrides,
  euFuelWetOptions,
  euNoiseClassOptions,
  getEffectiveFeatureValue,
  getEuOverride,
  getIdentityOverride,
  hasEuOverride,
  isDark,
  language,
  onAuditByEan,
  onSetEuField,
  onTyreLabelFieldChange,
  selectedTire,
  setFeatureField,
  setIdentityField,
  sizeParts,
  tyreLabelSection,
  updateSizePart,
}: TiresTyreLabelSectionProps) {
  const identityOverride = getIdentityOverride();
  const euOverride = getEuOverride();
  const [eanCopied, setEanCopied] = useState(false);
  const currentBaseEan = baseEan || baseDerivedEan || '';
  const currentEanDigits = String(identityOverride?.ean ?? currentBaseEan ?? '').replace(/\D/g, '');

  const fallbackCopyText = (value: string) => {
    if (typeof document === 'undefined') return false;
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    }
    document.body.removeChild(textarea);
    return copied;
  };

  const handleCopyEan = async () => {
    if (!currentBaseEan) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentBaseEan);
      } else if (!fallbackCopyText(currentBaseEan)) {
        throw new Error('Clipboard copy is not supported.');
      }
      setEanCopied(true);
      window.setTimeout(() => setEanCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy EAN', error);
    }
  };

  const identityFields = [
    { key: 'supplier_name', label: language === 'fi' ? 'Toimittaja / Supplier' : 'Supplier', value: tyreLabelSection.identity.supplier_name ?? '', placeholder: baseBrand },
    { key: 'supplier_trademark', label: language === 'fi' ? 'Tavaramerkki' : 'Supplier trademark', value: tyreLabelSection.identity.supplier_trademark ?? '', placeholder: baseBrand },
    { key: 'commercial_name', label: language === 'fi' ? 'Kaupallinen nimi' : 'Commercial name', value: tyreLabelSection.identity.commercial_name ?? '', placeholder: baseModel },
    { key: 'tyre_type_identifier', label: language === 'fi' ? 'Tyypin tunniste' : 'Tyre type identifier', value: tyreLabelSection.identity.tyre_type_identifier ?? '', placeholder: '1542013' },
    { key: 'tyre_class', label: language === 'fi' ? 'Rengasluokka' : 'Tyre class', value: tyreLabelSection.identity.tyre_class ?? '', placeholder: 'C1' },
    { key: 'load_version', label: language === 'fi' ? 'Load version' : 'Load version', value: tyreLabelSection.identity.load_version ?? '', placeholder: 'XL' },
  ];

  const complianceFields = [
    { group: 'eu_label' as const, key: 'eprel_registration_number', label: 'EPREL', value: tyreLabelSection.eu_label.eprel_registration_number ?? '', placeholder: '704060' },
    { group: 'eu_label' as const, key: 'eprel_qr_url', label: language === 'fi' ? 'EPREL QR URL' : 'EPREL QR URL', value: tyreLabelSection.eu_label.eprel_qr_url ?? '', placeholder: 'https://eprel.ec.europa.eu/qr/704060' },
    { group: 'eu_label' as const, key: 'eprel_sheet_url', label: language === 'fi' ? 'EPREL fiche' : 'EPREL fiche', value: tyreLabelSection.eu_label.eprel_sheet_url ?? '', placeholder: 'https://eprel.ec.europa.eu/fiches/tyres/Fiche_704060_EN.pdf' },
    { group: 'compliance' as const, key: 'production_start', label: language === 'fi' ? 'Tuotannon aloitus' : 'Production start', value: tyreLabelSection.compliance.production_start ?? '', placeholder: '12/23' },
    { group: 'compliance' as const, key: 'production_end', label: language === 'fi' ? 'Tuotannon loppu' : 'Production end', value: tyreLabelSection.compliance.production_end ?? '', placeholder: '-' },
    { group: 'compliance' as const, key: 'market_start', label: language === 'fi' ? 'EU-markkinoille' : 'Placed on Union market', value: tyreLabelSection.compliance.market_start ?? '', placeholder: '23/03/2023' },
    { group: 'compliance' as const, key: 'supplier_website', label: language === 'fi' ? 'Toimittajan sivusto' : 'Supplier website', value: tyreLabelSection.compliance.supplier_website ?? '', placeholder: 'https://...' },
    { group: 'compliance' as const, key: 'data_source', label: language === 'fi' ? 'Tietolähde' : 'Data source', value: tyreLabelSection.compliance.data_source ?? '', placeholder: 'eprel' },
    { group: 'compliance' as const, key: 'data_source_url', label: language === 'fi' ? 'Lähdelinkki' : 'Source URL', value: tyreLabelSection.compliance.data_source_url ?? '', placeholder: 'https://...' },
    { group: 'compliance' as const, key: 'last_verified_at', label: language === 'fi' ? 'Vahvistettu' : 'Last verified', value: tyreLabelSection.compliance.last_verified_at ?? '', placeholder: '2026-04-20' },
  ];

  return (
    <section className={`rounded-2xl border p-6 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-white'}`}>
      <div className="mb-6">
        <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{TYRE_LABEL_SECTION_TITLE}</h3>
        <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {language === 'fi'
            ? 'Yhdistää tunnistetiedot, EU-rengasmerkinnän, renkaan badget sekä EPREL-yhteensopivuuden.'
            : 'Combines identity, regulated EU tyre label data, supplementary badges, and EPREL compliance metadata.'}
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className={`text-sm font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Identity</h4>
              <RegulationNote
                isDark={isDark}
                text={
                  language === 'fi'
                    ? 'Tuotteen oikeudelliset ja tunnistavat tiedot. Säilytä nämä tarkkoina EPREL- tai valmistajatietoon nähden.'
                    : 'Legal and identifying tyre metadata. Keep these aligned with EPREL or manufacturer documentation.'
                }
              />
            </div>
            <button type="button" onClick={clearIdentityOverrides} className={`text-sm ${isDark ? 'text-blue-200 hover:text-white' : 'text-blue-700 hover:text-blue-900'}`}>
              {language === 'fi' ? 'Palauta identity-ohitukset' : 'Reset identity overrides'}
            </button>
          </div>

          <div className={`grid gap-4 rounded-xl p-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'} md:grid-cols-2`}>
            <div>
              <FieldLabel isDark={isDark}>{language === 'fi' ? 'Brändi' : 'Brand'}</FieldLabel>
              <TextInput isDark={isDark} value={identityOverride?.brand ?? baseBrand} onChange={(value) => setIdentityField('brand', value)} />
            </div>
            <div>
              <FieldLabel isDark={isDark}>{language === 'fi' ? 'Malli' : 'Model'}</FieldLabel>
              <TextInput isDark={isDark} value={identityOverride?.model ?? baseModel} onChange={(value) => setIdentityField('model', value)} />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <FieldLabel isDark={isDark}>EAN</FieldLabel>
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
                  {eanCopied ? (language === 'fi' ? 'Kopioitu' : 'Copied') : (language === 'fi' ? 'Kopioi nykyinen' : 'Copy current')}
                </button>
              </div>
              <TextInput isDark={isDark} value={identityOverride?.ean ?? ''} placeholder={currentBaseEan || 'EAN'} onChange={(value) => setIdentityField('ean', value)} />
              {currentBaseEan ? (
                <p className={`mt-1 text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'fi' ? 'Nykyinen EAN:' : 'Current EAN:'} {currentBaseEan}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onAuditByEan}
                  disabled={auditLoading || !currentEanDigits}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                    auditLoading || !currentEanDigits
                      ? isDark
                        ? 'cursor-not-allowed bg-white/5 text-gray-600'
                        : 'cursor-not-allowed bg-gray-100 text-gray-400'
                      : isDark
                        ? 'bg-blue-500/15 text-blue-200 hover:bg-blue-500/25'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {auditLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <SearchCheck className="h-3.5 w-3.5" />}
                  {auditLoading ? (language === 'fi' ? 'Auditointi...' : 'Auditing...') : 'EAN Audit'}
                </button>
                {auditResult ? (
                  <button
                    type="button"
                    onClick={applyAuditResult}
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                      isDark ? 'bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                    {language === 'fi' ? 'Käytä auditin arvoja' : 'Apply audit values'}
                  </button>
                ) : null}
              </div>
              {auditLoading && auditProgress !== null ? (
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{language === 'fi' ? 'Auditin eteneminen' : 'Audit progress'}</span>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{Math.round(Math.max(0, Math.min(100, auditProgress)))}%</span>
                  </div>
                  <div className={`h-2 overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                    <div className="h-full rounded-full bg-blue-500 transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, auditProgress))}%` }} />
                  </div>
                </div>
              ) : null}
            </div>
            <div>
              <FieldLabel isDark={isDark}>{language === 'fi' ? 'Kausi' : 'Season'}</FieldLabel>
              <SelectInput isDark={isDark} value={identityOverride?.season ?? baseSeason ?? ''} onChange={(value) => setIdentityField('season', value)}>
                <option value="">{language === 'fi' ? 'Perusta (ei muutosta)' : 'Use base value'}</option>
                <option value="summer">{language === 'fi' ? 'Kesä' : 'Summer'}</option>
                <option value="winter">{language === 'fi' ? 'Talvi' : 'Winter'}</option>
                <option value="all_season">{language === 'fi' ? 'Ympärivuotinen' : 'All Season'}</option>
              </SelectInput>
            </div>
            <div className="md:col-span-2">
              <FieldLabel isDark={isDark}>{language === 'fi' ? 'Koko' : 'Size'}</FieldLabel>
              <div className="grid grid-cols-5 gap-2">
                <TextInput isDark={isDark} value={sizeParts.width} placeholder="205" onChange={(value) => updateSizePart('width', value)} />
                <TextInput isDark={isDark} value={sizeParts.aspect} placeholder="55" onChange={(value) => updateSizePart('aspect', value)} />
                <TextInput isDark={isDark} value={sizeParts.rim} placeholder="16" onChange={(value) => updateSizePart('rim', value)} />
                <TextInput isDark={isDark} value={sizeParts.load_index} placeholder="91" onChange={(value) => updateSizePart('load_index', value)} />
                <TextInput isDark={isDark} value={sizeParts.speed_rating} placeholder="V" onChange={(value) => updateSizePart('speed_rating', value.toUpperCase())} />
              </div>
              <RegulationNote isDark={isDark} text={language === 'fi' ? 'Muoto: 205 / 55 R16 91 V' : 'Format: 205 / 55 R16 91 V'} />
            </div>
            {identityFields.map((field) => (
              <div key={field.key}>
                <FieldLabel isDark={isDark}>{field.label}</FieldLabel>
                <TextInput isDark={isDark} value={field.value} placeholder={field.placeholder} onChange={(value) => onTyreLabelFieldChange('identity', field.key, value)} />
              </div>
            ))}
          </div>

          {(auditError || auditResult) ? (
            <div className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>
              {auditError ? <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>{auditError}</p> : null}
              {auditResult ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{language === 'fi' ? 'EAN-auditin yhteenveto' : 'EAN audit summary'}</p>
                      <p className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{auditResult.summary}</p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                      auditResult.confidence === 'high'
                        ? statusClassName(isDark, 'match')
                        : auditResult.confidence === 'medium'
                          ? statusClassName(isDark, 'missing_current')
                          : statusClassName(isDark, 'unknown')
                    }`}>
                      {language === 'fi' ? 'Luottamus' : 'Confidence'}: {auditResult.confidence}
                    </span>
                  </div>
                  {auditResult.source_urls.length > 0 ? (
                    <div className="space-y-1">
                      {auditResult.source_urls.map((url) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer" className={`block truncate text-xs underline ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                          {url}
                        </a>
                      ))}
                    </div>
                  ) : null}
                  <AuditChecks checks={auditResult.checks} isDark={isDark} language={language} />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className={`text-sm font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>EU Label</h4>
              <RegulationNote
                isDark={isDark}
                text={
                  language === 'fi'
                    ? 'Säilytä tässä vain EU 2020/740 -säädellyt label-arvot ja EPREL-yhteydet.'
                    : 'Keep only Regulation (EU) 2020/740 label values and EPREL references here.'
                }
              />
            </div>
            <button type="button" onClick={clearEUOverrides} className={`text-sm ${isDark ? 'text-blue-200 hover:text-white' : 'text-blue-700 hover:text-blue-900'}`}>
              {language === 'fi' ? 'Palauta EU-ohitukset' : 'Reset EU overrides'}
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-black/10' : 'border-gray-200 bg-gray-50'}`}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel isDark={isDark}>{language === 'fi' ? 'Polttoainetehokkuus' : 'Fuel efficiency'}</FieldLabel>
                  <div className={`mb-2 rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-white/5 text-gray-300' : 'bg-white text-gray-700'}`}>{language === 'fi' ? 'Perustaso:' : 'Base:'} <span className="font-mono font-semibold">{selectedTire.eu_fuel_class || '—'}</span></div>
                  <SelectInput isDark={isDark} value={euOverride?.fuel_class || ''} onChange={(value) => onSetEuField('fuel_class', value || undefined)}>
                    <option value="">{language === 'fi' ? '— Käytä perustasoa —' : '— Use base value —'}</option>
                    {euFuelWetOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </SelectInput>
                </div>
                <div>
                  <FieldLabel isDark={isDark}>{language === 'fi' ? 'Märkäpito' : 'Wet grip'}</FieldLabel>
                  <div className={`mb-2 rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-white/5 text-gray-300' : 'bg-white text-gray-700'}`}>{language === 'fi' ? 'Perustaso:' : 'Base:'} <span className="font-mono font-semibold">{selectedTire.eu_wet_grip_class || '—'}</span></div>
                  <SelectInput isDark={isDark} value={euOverride?.wet_grip_class || ''} onChange={(value) => onSetEuField('wet_grip_class', value || undefined)}>
                    <option value="">{language === 'fi' ? '— Käytä perustasoa —' : '— Use base value —'}</option>
                    {euFuelWetOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </SelectInput>
                </div>
                <div>
                  <FieldLabel isDark={isDark}>{language === 'fi' ? 'Melutaso (dB)' : 'Noise level (dB)'}</FieldLabel>
                  <div className={`mb-2 rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-white/5 text-gray-300' : 'bg-white text-gray-700'}`}>{language === 'fi' ? 'Perustaso:' : 'Base:'} <span className="font-mono font-semibold">{selectedTire.eu_noise_db ? `${selectedTire.eu_noise_db} dB` : '—'}</span></div>
                  <TextInput isDark={isDark} type="number" value={euOverride?.noise_db === undefined ? '' : String(euOverride?.noise_db)} placeholder={language === 'fi' ? 'Käytä perustasoa' : 'Use base value'} onChange={(value) => onSetEuField('noise_db', value ? Number.parseInt(value, 10) : undefined)} />
                </div>
                <div>
                  <FieldLabel isDark={isDark}>{language === 'fi' ? 'Meluluokka' : 'Noise class'}</FieldLabel>
                  <div className={`mb-2 rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-white/5 text-gray-300' : 'bg-white text-gray-700'}`}>{language === 'fi' ? 'Perustaso:' : 'Base:'} <span className="font-mono font-semibold">{selectedTire.eu_noise_class || '—'}</span></div>
                  <SelectInput isDark={isDark} value={euOverride?.noise_class || ''} onChange={(value) => onSetEuField('noise_class', value || undefined)}>
                    <option value="">{language === 'fi' ? '— Käytä perustasoa —' : '— Use base value —'}</option>
                    {euNoiseClassOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </SelectInput>
                </div>
              </div>
            </div>

            <div className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-white'}`}>
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{language === 'fi' ? 'Reguloitu label-preview' : 'Regulated label preview'}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{language === 'fi' ? 'Polttoaine, märkäpito, ulkoinen melu, lumi/jää ja EPREL.' : 'Fuel, wet grip, external noise, snow/ice, and EPREL.'}</p>
                </div>
                {hasEuOverride ? <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${isDark ? 'bg-blue-500/15 text-blue-200' : 'bg-blue-50 text-blue-700'}`}>Override active</span> : null}
              </div>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className={`mb-2 text-xs uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Fuel</p>
                    <div className="space-y-1">
                      {EU_GRADES.map((grade) => <div key={`fuel-${grade}`} className={`rounded-md border px-3 py-1.5 text-sm font-medium ${gradeTone(isDark, tyreLabelSection.eu_label.fuel_efficiency_class, tyreLabelSection.eu_label.fuel_efficiency_class === grade)}`}>{grade}</div>)}
                    </div>
                  </div>
                  <div>
                    <p className={`mb-2 text-xs uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Wet grip</p>
                    <div className="space-y-1">
                      {EU_GRADES.map((grade) => <div key={`wet-${grade}`} className={`rounded-md border px-3 py-1.5 text-sm font-medium ${gradeTone(isDark, tyreLabelSection.eu_label.wet_grip_class, tyreLabelSection.eu_label.wet_grip_class === grade)}`}>{grade}</div>)}
                    </div>
                  </div>
                </div>
                <div className={`rounded-lg border px-3 py-3 ${isDark ? 'border-white/10 bg-black/10' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{language === 'fi' ? 'External rolling noise' : 'External rolling noise'}</span>
                    <span className={`font-mono text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{tyreLabelSection.eu_label.external_noise_db ? `${tyreLabelSection.eu_label.external_noise_db} dB` : '—'}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {['A', 'B', 'C'].map((noiseClass) => <span key={noiseClass} className={`inline-flex min-w-10 items-center justify-center rounded-full border px-2 py-1 text-xs font-semibold ${gradeTone(isDark, tyreLabelSection.eu_label.external_noise_class, tyreLabelSection.eu_label.external_noise_class === noiseClass)}`}>{noiseClass}</span>)}
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className={`rounded-lg border px-3 py-2 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="text-xs uppercase tracking-wide text-gray-500">Snow</div>
                    <div className={`mt-1 text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{tyreLabelSection.eu_label.severe_snow ? '3PMSF' : '—'}</div>
                  </div>
                  <div className={`rounded-lg border px-3 py-2 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="text-xs uppercase tracking-wide text-gray-500">Ice</div>
                    <div className={`mt-1 text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{tyreLabelSection.eu_label.severe_ice ? 'Ice approved' : '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className={`text-sm font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Tyre Badges</h4>
              <RegulationNote
                isDark={isDark}
                text={
                  language === 'fi'
                    ? 'Pidä kaupalliset feature-badget erillään säädellystä EU-labelista.'
                    : 'Keep merchandising feature badges distinct from the regulated EU label.'
                }
              />
            </div>
            <button type="button" onClick={clearFeatureOverrides} className={`text-sm ${isDark ? 'text-blue-200 hover:text-white' : 'text-blue-700 hover:text-blue-900'}`}>
              {language === 'fi' ? 'Palauta badge-ohitukset' : 'Reset badge overrides'}
            </button>
          </div>

          <div className={`grid grid-cols-2 gap-3 rounded-xl p-4 md:grid-cols-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            {TIRE_BADGES.map((feature) => (
              <label key={feature.key} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${isDark ? 'border-white/10 bg-black/10' : 'border-gray-200 bg-white'}`}>
                <input type="checkbox" checked={getEffectiveFeatureValue(feature.key)} onChange={(event) => setFeatureField(feature.key, event.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{language === 'fi' ? feature.labelFi : feature.labelEn}</span>
                {feature.regulated ? <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ${isDark ? 'bg-blue-500/15 text-blue-200' : 'bg-blue-50 text-blue-700'}`}>EU</span> : null}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <h4 className={`text-sm font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>EPREL & Compliance</h4>
            <RegulationNote
              isDark={isDark}
              text={
                language === 'fi'
                  ? 'Vaiheen 2 tavoite: tee EPREL-lähde ja tuotantometatiedot suoraan muokattaviksi.'
                  : 'Phase 2 objective: make EPREL source and production metadata directly editable.'
              }
            />
          </div>
          <div className={`grid gap-4 rounded-xl p-4 md:grid-cols-2 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            {complianceFields.map((field) => (
              <div key={`${field.group}-${field.key}`}>
                <FieldLabel isDark={isDark}>{field.label}</FieldLabel>
                <TextInput isDark={isDark} value={field.value} placeholder={field.placeholder} onChange={(value) => onTyreLabelFieldChange(field.group, field.key, value)} />
              </div>
            ))}
            <div>
              <FieldLabel isDark={isDark}>{language === 'fi' ? 'Yhteyshenkilö' : 'Supplier contact'}</FieldLabel>
              <TextInput isDark={isDark} value={tyreLabelSection.compliance.supplier_contact_name ?? ''} placeholder="Customer care" onChange={(value) => onTyreLabelFieldChange('compliance', 'supplier_contact_name', value)} />
            </div>
            <div>
              <FieldLabel isDark={isDark}>{language === 'fi' ? 'Yhteyssähköposti' : 'Contact email'}</FieldLabel>
              <TextInput isDark={isDark} value={tyreLabelSection.compliance.supplier_contact_email ?? ''} placeholder="support@example.com" onChange={(value) => onTyreLabelFieldChange('compliance', 'supplier_contact_email', value)} />
            </div>
            <div>
              <FieldLabel isDark={isDark}>{language === 'fi' ? 'Puhelin' : 'Contact phone'}</FieldLabel>
              <TextInput isDark={isDark} value={tyreLabelSection.compliance.supplier_contact_phone ?? ''} placeholder="+358..." onChange={(value) => onTyreLabelFieldChange('compliance', 'supplier_contact_phone', value)} />
            </div>
          </div>
          {(tyreLabelSection.eu_label.eprel_qr_url || tyreLabelSection.eu_label.eprel_sheet_url) ? (
            <div className={`flex flex-wrap gap-3 rounded-xl border p-4 ${isDark ? 'border-white/10 bg-black/10' : 'border-gray-200 bg-white'}`}>
              {tyreLabelSection.eu_label.eprel_qr_url ? (
                <a href={tyreLabelSection.eu_label.eprel_qr_url} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                  <ExternalLink className="h-4 w-4" />
                  {language === 'fi' ? 'Avaa EPREL QR' : 'Open EPREL QR'}
                </a>
              ) : null}
              {tyreLabelSection.eu_label.eprel_sheet_url ? (
                <a href={tyreLabelSection.eu_label.eprel_sheet_url} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${isDark ? 'bg-blue-500/15 text-blue-200 hover:bg-blue-500/25' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                  <ExternalLink className="h-4 w-4" />
                  {language === 'fi' ? 'Avaa EPREL fiche' : 'Open EPREL fiche'}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
