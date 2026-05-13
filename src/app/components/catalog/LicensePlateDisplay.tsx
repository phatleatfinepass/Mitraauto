import { useEffect, type ChangeEvent } from 'react';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';
import FigmaLicnesePlateMd from '../../imports/FigmaLicnesePlateMd-142-2027';
import FigmaLicnesePlateSm from '../../imports/FigmaLicnesePlateSm-142-2801';
import FigmaLicnesePlateMobile from '../../imports/FigmaLicnesePlateMobile-142-2934';

export type PlateCountryCode =
  | 'AT' | 'BE' | 'BG' | 'HR' | 'CZ'
  | 'DK' | 'EE' | 'FI' | 'FR' | 'DE'
  | 'GR' | 'HU' | 'IE' | 'IT' | 'LV'
  | 'LT' | 'LU' | 'NL' | 'NO' | 'PL'
  | 'PT' | 'RO' | 'SK' | 'SI' | 'ES' | 'SE';

export const PLATE_COUNTRY_STRIP_CODES: Record<PlateCountryCode, string> = {
  AT: 'A',
  BE: 'B',
  BG: 'BG',
  HR: 'HR',
  CZ: 'CZ',
  DK: 'DK',
  EE: 'EST',
  FI: 'FIN',
  FR: 'F',
  DE: 'D',
  GR: 'GR',
  HU: 'H',
  IE: 'IRL',
  IT: 'I',
  LV: 'LV',
  LT: 'LT',
  LU: 'L',
  NL: 'NL',
  NO: 'N',
  PL: 'PL',
  PT: 'P',
  RO: 'RO',
  SK: 'SK',
  SI: 'SLO',
  ES: 'E',
  SE: 'S',
};

type PlateFormatConfig = {
  placeholder: string;
  maxLength: number;
  format: (input: string) => string;
  widthLevel?: 'base' | 'wide' | 'xwide' | 'xxwide';
};

const cleanPlateInput = (input: string) => input.toUpperCase().replace(/[^A-Z0-9]/g, '');
const onlyLetters = (input: string) => input.replace(/[^A-Z]/g, '');
const onlyDigits = (input: string) => input.replace(/[^0-9]/g, '');

const formatPattern = (input: string, pattern: string): string => {
  const raw = cleanPlateInput(input);
  let rawIndex = 0;
  let output = '';

  const matchesToken = (value: string, token: string) => {
    if (token === 'A') return /[A-Z]/.test(value);
    if (token === '9') return /[0-9]/.test(value);
    return /[A-Z0-9]/.test(value);
  };

  const hasNextMatch = (startPatternIndex: number, startRawIndex: number) => {
    for (let patternIndex = startPatternIndex; patternIndex < pattern.length; patternIndex += 1) {
      const token = pattern[patternIndex];
      if (token !== 'A' && token !== '9' && token !== 'X') continue;
      for (let inputIndex = startRawIndex; inputIndex < raw.length; inputIndex += 1) {
        if (matchesToken(raw[inputIndex], token)) return true;
      }
      return false;
    }
    return false;
  };

  for (let patternIndex = 0; patternIndex < pattern.length; patternIndex += 1) {
    const token = pattern[patternIndex];
    if (token !== 'A' && token !== '9' && token !== 'X') {
      if (output && hasNextMatch(patternIndex + 1, rawIndex)) output += token;
      continue;
    }

    let nextMatch = '';
    while (rawIndex < raw.length) {
      const candidate = raw[rawIndex];
      rawIndex += 1;
      if (matchesToken(candidate, token)) {
        nextMatch = candidate;
        break;
      }
    }

    if (!nextMatch) break;
    output += nextMatch;
  }

  return output;
};

const joinPlateParts = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(' ');

const formatLeadingLettersDigitsTrailingLetters = (
  input: string,
  digitLimit: number,
  options: { regionLimit?: number; separatorBeforeSuffix?: 'space' | '-' } = {}
) => {
  const raw = cleanPlateInput(input);
  const leading = onlyLetters(raw.match(/^[A-Z]+/)?.[0] ?? '').slice(0, options.regionLimit ?? 3);
  const afterLeading = raw.slice(leading.length);
  const digits = onlyDigits(afterLeading).slice(0, digitLimit);
  if (!digits) return leading;
  const suffixSource = afterLeading.slice(afterLeading.search(/[0-9]/) + digits.length);
  const suffix = onlyLetters(suffixSource).slice(0, 3);
  if (!suffix) return joinPlateParts(leading, digits);
  return options.separatorBeforeSuffix === '-'
    ? `${joinPlateParts(leading, digits)}-${suffix}`
    : joinPlateParts(leading, digits, suffix);
};

const formatGermany = (input: string) => {
  const raw = cleanPlateInput(input).slice(0, 9);
  const letters = onlyLetters(raw.match(/^[A-Z]+/)?.[0] ?? '').slice(0, 5);
  const digits = onlyDigits(raw.slice(letters.length)).slice(0, 4);
  const region = letters.length > 2 ? letters.slice(0, -2) : letters;
  const serialLetters = letters.length > 2 ? letters.slice(-2) : '';
  return joinPlateParts(region, serialLetters, digits);
};

const formatNetherlands = (input: string) => {
  const raw = cleanPlateInput(input).slice(0, 6);
  const first = raw[0] ?? '';
  if (/[0-9]/.test(first)) return formatPattern(raw, '99-XXX-9');
  const second = raw[1] ?? '';
  if (/[0-9]/.test(second)) return formatPattern(raw, 'X-999-XX');
  return formatPattern(raw, 'XX-999-X');
};

const formatSweden = (input: string) => {
  const raw = cleanPlateInput(input).slice(0, 6);
  if (raw.length <= 3) return formatPattern(raw, 'AAA');
  return `${formatPattern(raw.slice(0, 3), 'AAA')} ${raw.slice(3, 6)}`;
};

const formatFinland = (input: string) => {
  const formatted = formatPattern(input, 'AAA-999');
  const raw = cleanPlateInput(input).slice(0, 6);
  const typedTrailingSeparator = /^[A-Z]{3}[-\s]$/i.test(input.trim());
  if (typedTrailingSeparator && raw.length === 3) return `${formatted}-`;
  return formatted;
};

const formatHungary = (input: string) => {
  const raw = cleanPlateInput(input).slice(0, 7);
  if (/^[A-Z]{4}/.test(raw)) return formatPattern(raw, 'AA AA-999');
  return formatPattern(raw, 'AAA-999');
};

const formatIreland = (input: string) => {
  const raw = cleanPlateInput(input).slice(0, 10);
  const year = onlyDigits(raw.slice(0, 3)).slice(0, 3);
  const afterYear = raw.slice(year.length);
  const county = onlyLetters(afterYear).slice(0, 2);
  const digits = onlyDigits(afterYear.slice(county.length)).slice(0, 5);
  if (!county) return year;
  return digits ? `${year}-${county}-${digits}` : `${year}-${county}`;
};

const formatSlovenia = (input: string) => {
  const raw = cleanPlateInput(input).slice(0, 7);
  const letters = onlyLetters(raw.match(/^[A-Z]+/)?.[0] ?? '').slice(0, 4);
  const digits = onlyDigits(raw.slice(letters.length)).slice(0, 3);
  const region = letters.slice(0, 2);
  const serialLetters = letters.slice(2, 4);
  return digits ? `${joinPlateParts(region, serialLetters)}-${digits}` : joinPlateParts(region, serialLetters);
};

const PLATE_FORMATS: Record<PlateCountryCode, PlateFormatConfig> = {
  FI: { placeholder: 'ABC-123', maxLength: 7, format: formatFinland },
  SE: { placeholder: 'ABC 123', maxLength: 7, format: formatSweden },
  EE: { placeholder: '123 ABC', maxLength: 7, format: (input) => formatPattern(input, '999 AAA') },
  NO: { placeholder: 'AB 12345', maxLength: 8, widthLevel: 'wide', format: (input) => formatPattern(input, 'AA 99999') },
  DE: { placeholder: 'B AB 1234', maxLength: 9, widthLevel: 'xwide', format: formatGermany },
  DK: { placeholder: 'AB 12 345', maxLength: 9, widthLevel: 'xwide', format: (input) => formatPattern(input, 'AA 99 999') },
  NL: { placeholder: 'X-999-XX', maxLength: 8, widthLevel: 'wide', format: formatNetherlands },
  BE: { placeholder: '1-ABC-123', maxLength: 9, widthLevel: 'xwide', format: (input) => formatPattern(input, '9-AAA-999') },
  FR: { placeholder: 'AB-123-CD', maxLength: 9, widthLevel: 'xwide', format: (input) => formatPattern(input, 'AA-999-AA') },
  ES: { placeholder: '1234 ABC', maxLength: 8, widthLevel: 'wide', format: (input) => formatPattern(input, '9999 AAA') },
  IT: { placeholder: 'AB 123 CD', maxLength: 9, widthLevel: 'xwide', format: (input) => formatPattern(input, 'AA 999 AA') },
  AT: { placeholder: 'W 12345 A', maxLength: 9, widthLevel: 'xwide', format: (input) => formatLeadingLettersDigitsTrailingLetters(input, 5, { regionLimit: 2 }) },
  PL: { placeholder: 'DW 12345', maxLength: 8, widthLevel: 'wide', format: (input) => formatLeadingLettersDigitsTrailingLetters(input, 5, { regionLimit: 3 }) },
  LT: { placeholder: 'ABC 123', maxLength: 7, format: (input) => formatPattern(input, 'AAA 999') },
  LV: { placeholder: 'AB-1234', maxLength: 7, format: (input) => formatPattern(input, 'AA-9999') },
  CZ: { placeholder: '1AB 2345', maxLength: 8, widthLevel: 'wide', format: (input) => formatPattern(input, '9AA 9999') },
  SK: { placeholder: 'AA 123AB', maxLength: 8, widthLevel: 'wide', format: (input) => formatPattern(input, 'AA 999AA') },
  HU: { placeholder: 'AA AA-123', maxLength: 9, widthLevel: 'xwide', format: formatHungary },
  RO: { placeholder: 'B 123 ABC', maxLength: 9, widthLevel: 'xwide', format: (input) => formatLeadingLettersDigitsTrailingLetters(input, 3, { regionLimit: 2 }) },
  BG: { placeholder: 'CA 1234 AB', maxLength: 10, widthLevel: 'xxwide', format: (input) => formatLeadingLettersDigitsTrailingLetters(input, 4, { regionLimit: 2 }) },
  HR: { placeholder: 'ZG 1234 AB', maxLength: 10, widthLevel: 'xxwide', format: (input) => formatLeadingLettersDigitsTrailingLetters(input, 4, { regionLimit: 2 }) },
  SI: { placeholder: 'LJ AB-123', maxLength: 9, widthLevel: 'xwide', format: formatSlovenia },
  PT: { placeholder: 'AA 12 AA', maxLength: 8, widthLevel: 'wide', format: (input) => formatPattern(input, 'AA 99 AA') },
  IE: { placeholder: '241-D-12345', maxLength: 11, widthLevel: 'xxwide', format: formatIreland },
  LU: { placeholder: 'AB 1234', maxLength: 7, format: (input) => formatPattern(input, 'AA 9999') },
  GR: { placeholder: 'ABC-1234', maxLength: 8, widthLevel: 'wide', format: (input) => formatPattern(input, 'AAA-9999') },
};

const PLATE_WIDTHS = {
  mobile: { base: 266.667, wide: 300, xwide: 330, xxwide: 360 },
  tablet: { base: 333.333, wide: 380, xwide: 430, xxwide: 480 },
  desktop: { base: 400, wide: 456, xwide: 516, xxwide: 576 },
} as const;

const PLATE_STRIP_WIDTHS = {
  mobile: 53.333,
  tablet: 66.667,
  desktop: 80,
} as const;

const PLATE_HEIGHTS = {
  mobile: 80,
  tablet: 100,
  desktop: 120,
} as const;

interface LicensePlateDisplayProps {
  value: string;
  onChange: (value: string) => void;
  country?: PlateCountryCode;
  onCountryChange?: (country: PlateCountryCode) => void;
  onCountryClick?: () => void;
  placeholder?: string;
  showHelper?: boolean;
}

export function LicensePlateDisplay({
  value,
  onChange,
  country = 'FI',
  onCountryClick,
  placeholder = 'ABC-123',
  showHelper = true,
}: LicensePlateDisplayProps) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  
  const secondaryTextClass = theme === 'dark' ? 'text-[#B0B8C4]' : 'text-[#6B7280]';
  const stripCode = PLATE_COUNTRY_STRIP_CODES[country] ?? country;
  const plateFormat = PLATE_FORMATS[country];
  const effectivePlaceholder = placeholder === 'ABC-123' ? plateFormat.placeholder : placeholder;
  const widthLevel = plateFormat.widthLevel ?? 'base';
  const isLongPlateFormat = plateFormat.maxLength > 9;
  const isNorway = country === 'NO';

  useEffect(() => {
    const formattedValue = plateFormat.format(value).slice(0, plateFormat.maxLength);
    if (formattedValue !== value) {
      onChange(formattedValue);
    }
  }, [country]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(plateFormat.format(e.target.value).slice(0, plateFormat.maxLength));
  };

  const renderStripCodeOverlay = (stripWidth: number, stripTextPx: number) => (
    <div
      className="pointer-events-none absolute bottom-0 left-0 z-20 flex h-[40%] items-center justify-center rounded-bl-[11px] bg-[#155DFC] md:rounded-bl-[12px] lg:rounded-bl-[14px]"
      style={{ width: stripWidth }}
    >
      <span
        className="font-bold leading-none text-white"
        style={{ fontSize: `clamp(13px, ${(stripTextPx / 266.667) * 100}cqw, ${stripTextPx}px)` }}
      >
        {stripCode}
      </span>
    </div>
  );
  const renderNorwayStripOverlay = (stripWidth: number, stripTextPx: number) => (
    <div
      className="pointer-events-none absolute left-0 top-0 z-20 flex flex-col items-center rounded-l-[11px] bg-[#155DFC] md:rounded-l-[12px] lg:rounded-l-[14px]"
      style={{ width: stripWidth, height: '100%' }}
    >
      <span
        className="relative mt-[13.5%] aspect-square w-[55%] overflow-hidden rounded-full"
      >
        <span className="absolute inset-0 bg-[#BA0C2F]" />
        <span className="absolute inset-y-0 bg-white" style={{ left: '31%', width: '22%' }} />
        <span className="absolute inset-x-0 bg-white" style={{ top: '39%', height: '22%' }} />
        <span className="absolute inset-y-0 bg-[#00205B]" style={{ left: '36%', width: '12%' }} />
        <span className="absolute inset-x-0 bg-[#00205B]" style={{ top: '44%', height: '12%' }} />
      </span>
      <span
        className="mt-auto mb-[8%] font-bold leading-none text-white"
        style={{ fontSize: `clamp(13px, ${(stripTextPx / 266.667) * 100}cqw, ${stripTextPx}px)` }}
      >
        N
      </span>
    </div>
  );
  const renderCountryStripTrigger = (stripWidth: number) => onCountryClick ? (
    <button
      type="button"
      tabIndex={-1}
      aria-label={language === 'fi' ? 'Valitse maa' : 'Country'}
      onClick={onCountryClick}
      className="absolute left-0 top-0 z-30 h-full cursor-default bg-transparent"
      style={{ width: stripWidth }}
    />
  ) : null;
  const renderPlate = (
    size: keyof typeof PLATE_WIDTHS,
    PlateGraphic: () => JSX.Element,
    fontPx: number,
    longFontPx: number
  ) => {
    const plateWidth = PLATE_WIDTHS[size][widthLevel];
    const stripWidth = PLATE_STRIP_WIDTHS[size];
    const plateHeight = PLATE_HEIGHTS[size];
    const formatLength = effectivePlaceholder.replace(/\s+/g, '').length;
    const fontSize = isLongPlateFormat || formatLength >= 7 ? longFontPx : fontPx;
    const minFontSize = Math.round(fontSize * 0.72);
    const paddingPx = size === 'desktop' ? 16 : size === 'tablet' ? 13 : 11;
    const minPaddingPx = Math.round(paddingPx * 0.7);
    const stripTextPx = size === 'desktop' ? 20 : size === 'tablet' ? 18 : 16;

    return (
      <div
        className="relative mx-auto max-w-full"
        style={{
          width: `min(${plateWidth}px, calc(100vw - 48px))`,
          aspectRatio: `${plateWidth} / ${plateHeight}`,
          containerType: 'inline-size',
        }}
      >
        <PlateGraphic />
        {isNorway ? renderNorwayStripOverlay(stripWidth, stripTextPx) : renderStripCodeOverlay(stripWidth, stripTextPx)}
        {renderCountryStripTrigger(stripWidth)}
        <div
          className="absolute top-0 flex items-center justify-center"
          style={{
            left: stripWidth,
            width: `calc(100% - ${stripWidth}px)`,
            height: '100%',
            padding: `clamp(${minPaddingPx}px, ${(paddingPx / plateWidth) * 100}cqw, ${paddingPx}px)`,
          }}
        >
          <input
            type="text"
            value={value}
            onChange={handleChange}
            placeholder={effectivePlaceholder}
            maxLength={plateFormat.maxLength}
            className="h-full min-w-0 w-full overflow-hidden bg-transparent text-center font-bold leading-none outline-none placeholder:text-[#6B7280]"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#000000',
              fontSize: `clamp(${minFontSize}px, ${(fontSize / plateWidth) * 100}cqw, ${fontSize}px)`,
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Desktop/Tablet - MD variant */}
      <div className="hidden md:block lg:hidden">
        {renderPlate('tablet', FigmaLicnesePlateSm, 54, 42)}
      </div>

      {/* Large Desktop - LG variant */}
      <div className="hidden lg:block">
        {renderPlate('desktop', FigmaLicnesePlateMd, 64, 50)}
      </div>

      {/* Mobile - Small variant */}
      <div className="block md:hidden">
        {renderPlate('mobile', FigmaLicnesePlateMobile, 42, 32)}
      </div>

      {showHelper ? (
        <p className={`text-center ${secondaryTextClass} text-sm mt-3`}>
          {language === 'fi' 
            ? `Kirjoita rekisteritunnus muodossa ${plateFormat.placeholder}`
            : `Enter the plate in ${plateFormat.placeholder} format`
          }
        </p>
      ) : null}
    </div>
  );
}
