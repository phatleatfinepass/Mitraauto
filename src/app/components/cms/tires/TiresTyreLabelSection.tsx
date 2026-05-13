import type { ReactNode } from 'react';
import { useState } from 'react';
import { Check, Copy, ExternalLink, RefreshCw, SearchCheck } from 'lucide-react';
import { TYRE_LABEL_SECTION_TITLE, type TyreLabelSectionData } from '../../../utils/tyreLabel';
import type { TireEanAuditResult, TireEanAuditCheck, TireEprelIdSuggestion } from './eanAudit';
import type { TireRow } from './types';

type TireBadgeKey =
  | 'ev_ready'
  | 'sound_absorber'
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
  auditSuggestion: TireEprelIdSuggestion | null;
  auditSuggestionError: string | null;
  auditSuggestionLoading: boolean;
  baseBrand: string;
  baseDerivedEan: string | null;
  baseEan: string | null | undefined;
  baseEprelRegistrationNumber: string | null;
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
  onSuggestEprelId: () => void;
  onSetAuditReviewStatus: (field: string, status: 'accepted' | 'rejected' | 'kept_current') => void;
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
  { key: 'sound_absorber', labelFi: 'Äänenvaimennus', labelEn: 'Sound absorber' },
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

function parseManualEprelRegistration(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const directDigits = trimmed.match(/^\d+$/);
  if (directDigits) return directDigits[0];

  const patterns = [
    /\/qr\/(\d+)/i,
    /\/screen\/product\/tyres\/(\d+)/i,
    /Fiche_(\d+)_/i,
    /registration(?:Number)?[=/:](\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

function eprelStatusTone(
  isDark: boolean,
  status: TireEanAuditResult['match_status'] | null | undefined,
) {
  switch (status) {
    case 'matched':
      return isDark ? 'border-green-500/25 bg-green-500/15 text-green-300' : 'border-green-200 bg-green-50 text-green-700';
    case 'no_match':
    case 'wrong_product_group':
    case 'blocked':
    case 'unverified':
      return isDark ? 'border-amber-500/25 bg-amber-500/15 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-700';
    case 'multiple_matches':
      return isDark ? 'border-orange-500/25 bg-orange-500/15 text-orange-300' : 'border-orange-200 bg-orange-50 text-orange-700';
    case 'error':
      return isDark ? 'border-red-500/25 bg-red-500/15 text-red-300' : 'border-red-200 bg-red-50 text-red-700';
    default:
      return isDark ? 'border-white/10 bg-white/5 text-gray-300' : 'border-gray-200 bg-gray-100 text-gray-700';
  }
}

function AuditChecks({
  checks,
  isDark,
  language,
  onSetReviewStatus,
}: {
  checks: TireEanAuditCheck[];
  isDark: boolean;
  language: string;
  onSetReviewStatus: (field: string, status: 'accepted' | 'rejected' | 'kept_current') => void;
}) {
  if (checks.length === 0) return null;

  return (
    <div className="space-y-2">
      {checks.map((check) => (
        <div key={check.field} className={`rounded-lg border p-3 ${isDark ? 'border-white/10 bg-black/10' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{check.label}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClassName(isDark, check.status)}`}>
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
              <span className={isDark ? 'text-gray-200' : 'text-gray-700'}>{check.current_value || '—'}</span>
            </div>
            <div>
              <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                {language === 'fi' ? 'Auditoitu' : 'Audited'}:
              </span>{' '}
              <span className={isDark ? 'text-gray-200' : 'text-gray-700'}>{check.audited_value || '—'}</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSetReviewStatus(check.field, 'accepted')}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                isDark ? 'bg-green-500/15 text-green-200 hover:bg-green-500/25' : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              {language === 'fi' ? 'Hyväksy' : 'Accept'}
            </button>
            <button
              type="button"
              onClick={() => onSetReviewStatus(check.field, 'rejected')}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                isDark ? 'bg-red-500/15 text-red-200 hover:bg-red-500/25' : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              {language === 'fi' ? 'Hylkää' : 'Reject'}
            </button>
            <button
              type="button"
              onClick={() => onSetReviewStatus(check.field, 'kept_current')}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                isDark ? 'bg-amber-500/15 text-amber-200 hover:bg-amber-500/25' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              {language === 'fi' ? 'Pidä nykyinen' : 'Keep current'}
            </button>
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
  auditSuggestion,
  auditSuggestionError,
  auditSuggestionLoading,
  baseBrand,
  baseDerivedEan,
  baseEan,
  baseEprelRegistrationNumber,
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
  onSuggestEprelId,
  onSetAuditReviewStatus,
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
  const currentEprelRegistrationNumber =
    parseManualEprelRegistration(
      tyreLabelSection.eu_label.eprel_registration_number ??
        baseEprelRegistrationNumber ??
        tyreLabelSection.eu_label.eprel_qr_url ??
        '',
    ) ?? null;
  const reviewCounts = auditResult?.checks.reduce(
    (acc, check) => {
      const status = check.review_status ?? 'pending';
      acc[status] += 1;
      return acc;
    },
    {
      pending: 0,
      accepted: 0,
      rejected: 0,
      kept_current: 0,
    } as Record<'pending' | 'accepted' | 'rejected' | 'kept_current', number>
  ) ?? {
    pending: 0,
    accepted: 0,
    rejected: 0,
    kept_current: 0,
  };

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
        try {
          await navigator.clipboard.writeText(currentBaseEan);
        } catch {
          if (!fallbackCopyText(currentBaseEan)) {
            throw new Error('Clipboard copy is not supported.');
          }
        }
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
    { group: 'eu_label' as const, key: 'eprel_sheet_url', label: language === 'fi' ? 'EPREL fiche' : 'EPREL fiche', value: tyreLabelSection.eu_label.eprel_sheet_url ?? '', placeholder: 'https://eprel.ec.europa.eu/fiches/tyres/Fiche_704060_EN.pdf' },
    { group: 'compliance' as const, key: 'production_start', label: language === 'fi' ? 'Tuotannon aloitus' : 'Production start', value: tyreLabelSection.compliance.production_start ?? '', placeholder: '12/23' },
    { group: 'compliance' as const, key: 'production_end', label: language === 'fi' ? 'Tuotannon loppu' : 'Production end', value: tyreLabelSection.compliance.production_end ?? '', placeholder: language === 'fi' ? 'Ei' : 'No' },
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
              <div
                className={`mt-3 gap-2 ${
                  auditResult?.match_status === 'no_match'
                    ? 'grid grid-cols-2'
                    : 'flex flex-wrap'
                }`}
              >
                <button
                  type="button"
                  onClick={onAuditByEan}
                  disabled={auditLoading || (!currentEprelRegistrationNumber && !currentEanDigits)}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                    auditLoading || (!currentEprelRegistrationNumber && !currentEanDigits)
                      ? isDark
                        ? 'cursor-not-allowed bg-white/5 text-gray-600'
                        : 'cursor-not-allowed bg-gray-100 text-gray-400'
                      : isDark
                        ? 'bg-blue-500/15 text-blue-200 hover:bg-blue-500/25'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {auditLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <SearchCheck className="h-3.5 w-3.5" />}
                  {auditLoading ? (language === 'fi' ? 'Haetaan EPREListä...' : 'Fetching EPREL...') : (language === 'fi' ? 'Hae EPREListä' : 'Fetch from EPREL')}
                </button>
                {currentEprelRegistrationNumber ? (
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-mono ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    EPREL {currentEprelRegistrationNumber}
                  </span>
                ) : null}
                {auditResult && (auditResult.match_status === 'matched' || auditResult.match_status === 'unverified') ? (
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
                ) : null}
                {auditResult?.match_status === 'no_match' ? (
                  <button
                    type="button"
                    onClick={onSuggestEprelId}
                    disabled={auditLoading || auditSuggestionLoading}
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                      auditLoading || auditSuggestionLoading
                        ? isDark
                          ? 'cursor-not-allowed bg-white/5 text-gray-600'
                          : 'cursor-not-allowed bg-gray-100 text-gray-400'
                        : isDark
                        ? 'bg-amber-500/15 text-amber-200 hover:bg-amber-500/25'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    <SearchCheck className={`h-3.5 w-3.5 ${auditSuggestionLoading ? 'animate-spin' : ''}`} />
                    {auditSuggestionLoading
                      ? (language === 'fi' ? 'Ehdotetaan EPREL ID:tä...' : 'Suggesting EPREL ID...')
                      : (language === 'fi' ? 'Ehdota EPREL ID' : 'Suggest EPREL ID')}
                  </button>
                ) : null}
              </div>
              {auditError ? (
                <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${isDark ? 'border-red-500/25 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
                  {auditError}
                </div>
              ) : null}
              {auditResult ? (
                <div className={`mt-3 rounded-lg border px-3 py-2 ${eprelStatusTone(isDark, auditResult.match_status)}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                      EPREL {auditResult.match_status?.replace('_', ' ') ?? 'status'}
                    </span>
                    {auditResult.eprel_registration_number ? (
                      <span className="text-[11px] font-mono">
                        ID: {auditResult.eprel_registration_number}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs">{auditResult.summary}</p>
                </div>
              ) : null}
              {auditResult ? (
                <p className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {reviewCounts.pending > 0
                    ? (
                      language === 'fi'
                        ? `${reviewCounts.pending} kenttää odottaa päätöstä. Käytä EPREL-arvoja hyväksyy vain avoimet kentät, eikä koske hylättyihin tai "pidä nykyinen" -kenttiin.`
                        : `${reviewCounts.pending} fields are still pending. Apply EPREL values only accepts unresolved fields and leaves rejected or kept-current fields untouched.`
                    )
                    : (
                      language === 'fi'
                        ? 'Kaikilla EPREL-kentillä on nyt review-tila.'
                        : 'All EPREL fields now have an explicit review state.'
                    )}
                </p>
              ) : null}
              {auditSuggestionError ? (
                <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${isDark ? 'border-red-500/25 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
                  {auditSuggestionError}
                </div>
              ) : null}
              {auditSuggestion ? (
                <div className={`mt-3 rounded-lg border p-3 ${isDark ? 'border-white/10 bg-black/10' : 'border-gray-200 bg-gray-50'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {language === 'fi' ? 'AI EPREL ID -ehdotus' : 'AI EPREL ID suggestion'}
                  </p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{auditSuggestion.summary}</p>
                  <p className={`mt-1 text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fi' ? 'Luottamus' : 'Confidence'}: {auditSuggestion.confidence}
                  </p>
                  {auditSuggestion.suggested_registration_number ? (
                    <div className="mt-2">
                      <span className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-mono ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                        EPREL {auditSuggestion.suggested_registration_number}
                      </span>
                    </div>
                  ) : null}
                  {auditSuggestion.candidates.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {auditSuggestion.candidates.map((candidate) => (
                        <div
                          key={`ai-${candidate.registration_number}`}
                          className={`rounded-md border px-3 py-2 text-xs ${isDark ? 'border-white/10 bg-white/[0.03] text-gray-200' : 'border-gray-200 bg-white text-gray-700'}`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-mono">{candidate.registration_number}</span>
                            <span className={`rounded-md px-2.5 py-1 text-[11px] font-mono ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                              ID {candidate.registration_number}
                            </span>
                          </div>
                          <div className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{candidate.reason}</div>
                          <div className={`mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{candidate.source_hint}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
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
            {selectedTire.manufacture_year ? (
              <div>
                <FieldLabel isDark={isDark}>{language === 'fi' ? 'DOT-vuosi' : 'DOT year'}</FieldLabel>
                <div className={`rounded-lg border px-3 py-2 text-sm ${
                  isDark ? 'border-white/20 bg-white/5 text-white' : 'border-gray-300 bg-gray-50 text-gray-900'
                }`}>
                  {selectedTire.manufacture_year}
                </div>
                <RegulationNote isDark={isDark} text={language === 'fi' ? 'Normalisoitu toimittajan DOT-kentästä.' : 'Normalized from the supplier DOT field.'} />
              </div>
            ) : null}
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
              {auditResult ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{language === 'fi' ? 'EPREL-yhteenveto' : 'EPREL summary'}</p>
                      <p className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{auditResult.summary}</p>
                      {auditResult.fallback_mode === 'search' ? (
                        <p className={`mt-2 text-xs ${isDark ? 'text-amber-200' : 'text-amber-700'}`}>
                          {language === 'fi'
                            ? 'GTIN-haku epäonnistui. Tämä tulos tuli EPREL fallback-hausta käyttäen brandia, mallia ja kokoa.'
                            : 'GTIN lookup failed. This result came from EPREL fallback search using brand, model, and size.'}
                        </p>
                      ) : null}
                      {auditResult.eprel_registration_number ? (
                        <p className={`mt-2 text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          EPREL ID: {auditResult.eprel_registration_number}
                        </p>
                      ) : null}
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
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-medium ${
                      isDark ? 'border-white/10 bg-white/5 text-gray-300' : 'border-gray-200 bg-gray-100 text-gray-700'
                    }`}>
                      {language === 'fi' ? 'Pending' : 'Pending'}: {reviewCounts.pending}
                    </span>
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-medium ${
                      isDark ? 'border-green-500/25 bg-green-500/15 text-green-300' : 'border-green-200 bg-green-50 text-green-700'
                    }`}>
                      {language === 'fi' ? 'Hyväksytty' : 'Accepted'}: {reviewCounts.accepted}
                    </span>
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-medium ${
                      isDark ? 'border-red-500/25 bg-red-500/15 text-red-300' : 'border-red-200 bg-red-50 text-red-700'
                    }`}>
                      {language === 'fi' ? 'Hylätty' : 'Rejected'}: {reviewCounts.rejected}
                    </span>
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-medium ${
                      isDark ? 'border-amber-500/25 bg-amber-500/15 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}>
                      {language === 'fi' ? 'Pidä nykyinen' : 'Kept current'}: {reviewCounts.kept_current}
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
                  {auditResult.candidates && auditResult.candidates.length > 0 ? (
                    <div className={`rounded-lg border p-3 ${isDark ? 'border-white/10 bg-black/10' : 'border-gray-200 bg-gray-50'}`}>
                      <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {language === 'fi' ? 'Fallback-ehdokkaat' : 'Fallback candidates'}
                      </p>
                      <div className="mt-2 space-y-2">
                        {auditResult.candidates.map((candidate) => (
                          <div
                            key={candidate.registration_number}
                            className={`rounded-md border px-3 py-2 text-xs ${isDark ? 'border-white/10 bg-white/[0.03] text-gray-200' : 'border-gray-200 bg-white text-gray-700'}`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-medium">
                                {[candidate.brand, candidate.model, candidate.size_string].filter(Boolean).join(' / ') || candidate.registration_number}
                              </span>
                              <span className="font-mono">ID {candidate.registration_number}</span>
                            </div>
                            <div className={`mt-1 flex flex-wrap gap-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              <span>{language === 'fi' ? 'Pisteet' : 'Score'}: {candidate.score}</span>
                              {candidate.tyre_class ? <span>{candidate.tyre_class}</span> : null}
                              {candidate.match_reasons.length > 0 ? <span>{candidate.match_reasons.join(', ')}</span> : null}
                            </div>
                            <div className="mt-2">
                              <span className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-mono ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                                ID {candidate.registration_number}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <AuditChecks checks={auditResult.checks} isDark={isDark} language={language} onSetReviewStatus={onSetAuditReviewStatus} />
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
          {tyreLabelSection.eu_label.eprel_sheet_url ? (
            <div className={`flex flex-wrap gap-3 rounded-xl border p-4 ${isDark ? 'border-white/10 bg-black/10' : 'border-gray-200 bg-white'}`}>
              <a href={tyreLabelSection.eu_label.eprel_sheet_url} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${isDark ? 'bg-blue-500/15 text-blue-200 hover:bg-blue-500/25' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                <ExternalLink className="h-4 w-4" />
                {language === 'fi' ? 'Avaa EPREL fiche' : 'Open EPREL fiche'}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
