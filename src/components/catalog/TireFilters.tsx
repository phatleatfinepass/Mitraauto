import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Filter, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { LicensePlateDisplay, type PlateCountryCode } from './LicensePlateDisplay';
import type { VehicleTyreLookupResult } from '../../utils/vehicleFitmentLookup';
import { lookupVehicleTyreFitment } from '../../utils/vehicleFitmentLookup';
import type { TyreFitmentRecommendation } from '../../utils/etrtoFitment';
import { requestFitmentRecommendations } from '../../utils/fitmentRecommendations';
import { supabase } from '../../utils/supabase/client';
import { COUNTRY_FLAG_DATA_URIS } from './countryFlagData';

interface TireFiltersProps {
  onFilterChange: (filters: any) => void;
  onSearch: () => void;
  onVehicleRecommendation?: (vehicle: VehicleTyreLookupResult, recommendation: TyreFitmentRecommendation) => void;
  onSearchModeChange?: (mode: 'license' | 'manual') => void;
  searchMode: 'license' | 'vehicle' | 'manual';
  filters?: {
    width: string;
    aspectRatio: string;
    diameter: string;
    season: string;
    vehicleType: string;
    brand: any[];
    runflat: boolean;
    xl: boolean;
    studded: boolean;
    inStockOnly: boolean;
    includeRetreaded: boolean;
    electricCar: boolean;
    soundAbsorber: boolean;
    ean: string;
    sortBy: string;
    search: string;
  };
}

type PlateCountryOption = {
  code: PlateCountryCode;
  name: string;
  flagSrc: string;
};

type TireFilterOptionRow = {
  option_group: string;
  option_value: string;
  label: string;
  item_count: number;
  sort_order: number;
  metadata?: Record<string, unknown> | null;
};

const TIRE_FILTER_OPTIONS_CACHE_KEY = 'mitra.tire-filter-options.v1';
const FALLBACK_WIDTH_OPTIONS = ['155', '165', '175', '185', '195', '205', '215', '225', '235', '245', '255', '265', '275', '285', '295', '305', '315', '325', '335', '345', '355'];
const FALLBACK_ASPECT_OPTIONS = ['30', '35', '40', '45', '50', '55', '60', '65', '70', '75', '80', '85'];
const FALLBACK_DIAMETER_OPTIONS = ['12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'];
const FALLBACK_VEHICLE_TYPE_OPTIONS: TireFilterOptionRow[] = [
  { option_group: 'vehicle_type', option_value: 'passenger', label: 'Passenger car', item_count: 0, sort_order: 10 },
  { option_group: 'vehicle_type', option_value: 'van_c', label: 'Van / C', item_count: 0, sort_order: 20 },
  { option_group: 'vehicle_type', option_value: 'suv_4x4', label: 'SUV / 4x4', item_count: 0, sort_order: 30 },
];

const PLATE_COUNTRY_OPTIONS: PlateCountryOption[] = [
  { code: 'AT', name: 'Austria', flagSrc: COUNTRY_FLAG_DATA_URIS.AT },
  { code: 'BE', name: 'Belgium', flagSrc: COUNTRY_FLAG_DATA_URIS.BE },
  { code: 'BG', name: 'Bulgaria', flagSrc: COUNTRY_FLAG_DATA_URIS.BG },
  { code: 'HR', name: 'Croatia', flagSrc: COUNTRY_FLAG_DATA_URIS.HR },
  { code: 'CZ', name: 'Czechia', flagSrc: COUNTRY_FLAG_DATA_URIS.CZ },
  { code: 'DK', name: 'Denmark', flagSrc: COUNTRY_FLAG_DATA_URIS.DK },
  { code: 'EE', name: 'Estonia', flagSrc: COUNTRY_FLAG_DATA_URIS.EE },
  { code: 'FI', name: 'Finland', flagSrc: COUNTRY_FLAG_DATA_URIS.FI },
  { code: 'FR', name: 'France', flagSrc: COUNTRY_FLAG_DATA_URIS.FR },
  { code: 'DE', name: 'Germany', flagSrc: COUNTRY_FLAG_DATA_URIS.DE },
  { code: 'GR', name: 'Greece', flagSrc: COUNTRY_FLAG_DATA_URIS.GR },
  { code: 'HU', name: 'Hungary', flagSrc: COUNTRY_FLAG_DATA_URIS.HU },
  { code: 'IE', name: 'Ireland', flagSrc: COUNTRY_FLAG_DATA_URIS.IE },
  { code: 'IT', name: 'Italy', flagSrc: COUNTRY_FLAG_DATA_URIS.IT },
  { code: 'LV', name: 'Latvia', flagSrc: COUNTRY_FLAG_DATA_URIS.LV },
  { code: 'LT', name: 'Lithuania', flagSrc: COUNTRY_FLAG_DATA_URIS.LT },
  { code: 'LU', name: 'Luxembourg', flagSrc: COUNTRY_FLAG_DATA_URIS.LU },
  { code: 'NL', name: 'Netherlands', flagSrc: COUNTRY_FLAG_DATA_URIS.NL },
  { code: 'NO', name: 'Norway', flagSrc: COUNTRY_FLAG_DATA_URIS.NO },
  { code: 'PT', name: 'Portugal', flagSrc: COUNTRY_FLAG_DATA_URIS.PT },
  { code: 'SK', name: 'Slovakia', flagSrc: COUNTRY_FLAG_DATA_URIS.SK },
  { code: 'SI', name: 'Slovenia', flagSrc: COUNTRY_FLAG_DATA_URIS.SI },
  { code: 'ES', name: 'Spain', flagSrc: COUNTRY_FLAG_DATA_URIS.ES },
  { code: 'PL', name: 'Poland', flagSrc: COUNTRY_FLAG_DATA_URIS.PL },
  { code: 'RO', name: 'Romania', flagSrc: COUNTRY_FLAG_DATA_URIS.RO },
  { code: 'SE', name: 'Sweden', flagSrc: COUNTRY_FLAG_DATA_URIS.SE },
];

function mergeTyreFitmentRecommendations(recommendations: TyreFitmentRecommendation[]): TyreFitmentRecommendation {
  const [primary, ...rest] = recommendations;
  const alternatives = new Map<string, TyreFitmentRecommendation['alternatives'][number]>();
  const addCandidate = (candidate: TyreFitmentRecommendation['alternatives'][number]) => {
    if (candidate.sizeKey === primary.factory.sizeKey) return;
    if (!alternatives.has(candidate.sizeKey)) {
      alternatives.set(candidate.sizeKey, candidate);
    }
  };

  for (const recommendation of rest) {
    addCandidate({ ...recommendation.factory, confidence: 'factory' });
  }

  for (const recommendation of recommendations) {
    for (const candidate of recommendation.alternatives) {
      addCandidate(candidate);
    }
  }

  return {
    factory: primary.factory,
    alternatives: Array.from(alternatives.values()).slice(0, 24),
    auditedSeriesOnly: recommendations.every((recommendation) => recommendation.auditedSeriesOnly),
    warnings: Array.from(new Set(recommendations.flatMap((recommendation) => recommendation.warnings))),
  };
}

export const DEFAULT_TIRE_FILTERS = {
  width: 'all',
  aspectRatio: 'all',
  diameter: 'all',
  season: 'all',
  vehicleType: 'all',
  brand: [],
  runflat: false,
  xl: false,
  studded: false,
  inStockOnly: false,
  includeRetreaded: false,
  electricCar: false,
  soundAbsorber: false,
  ean: '',
  sortBy: 'price_asc',
  search: '',
};

export function TireFilters({ onFilterChange, onSearch, onVehicleRecommendation, onSearchModeChange, searchMode: _searchMode, filters: externalFilters }: TireFiltersProps) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [licensePlate, setLicensePlate] = useState('');
  const [plateCountry, setPlateCountry] = useState<PlateCountryCode>('FI');
  const [filters, setFilters] = useState(DEFAULT_TIRE_FILTERS);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [widthOptions, setWidthOptions] = useState<string[]>(FALLBACK_WIDTH_OPTIONS);
  const [aspectOptions, setAspectOptions] = useState<string[]>(FALLBACK_ASPECT_OPTIONS);
  const [diameterOptions, setDiameterOptions] = useState<string[]>(FALLBACK_DIAMETER_OPTIONS);
  const [vehicleTypeOptions, setVehicleTypeOptions] = useState<TireFilterOptionRow[]>(FALLBACK_VEHICLE_TYPE_OPTIONS);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [brandSearchTerm, setBrandSearchTerm] = useState('');
  const [vehicleLookupLoading, setVehicleLookupLoading] = useState(false);
  const [vehicleLookupError, setVehicleLookupError] = useState<string | null>(null);
  const [localSearchMode, setLocalSearchMode] = useState<'license' | 'manual'>('license');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showCountryChooser, setShowCountryChooser] = useState(false);

  useEffect(() => {
    if (!externalFilters) return;
    setFilters({ ...DEFAULT_TIRE_FILTERS, ...externalFilters });
  }, [externalFilters]);

  useEffect(() => {
    let active = true;

    const applyFilterOptions = (rows: TireFilterOptionRow[]) => {
      const getValues = (group: string) =>
        rows
          .filter((row) => row.option_group === group && row.option_value)
          .sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label))
          .map((row) => row.option_value);

      const nextBrands = getValues('brand');
      const nextWidths = getValues('width');
      const nextAspects = getValues('aspect_ratio');
      const nextDiameters = getValues('diameter');
      const nextVehicleTypes = rows
        .filter((row) => row.option_group === 'vehicle_type' && row.option_value)
        .sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));

      if (nextBrands.length > 0) setBrandOptions(nextBrands);
      if (nextWidths.length > 0) setWidthOptions(nextWidths);
      if (nextAspects.length > 0) setAspectOptions(nextAspects);
      if (nextDiameters.length > 0) setDiameterOptions(nextDiameters);
      if (nextVehicleTypes.length > 0) setVehicleTypeOptions(nextVehicleTypes);
    };

    const loadFilterOptions = async () => {
      if (typeof window !== 'undefined') {
        try {
          const cached = window.sessionStorage.getItem(TIRE_FILTER_OPTIONS_CACHE_KEY);
          const cachedRows = cached ? JSON.parse(cached) : null;
          if (Array.isArray(cachedRows)) {
            applyFilterOptions(cachedRows as TireFilterOptionRow[]);
          }
        } catch {
          // Ignore malformed cache; the live RPC below will repopulate it.
        }
      }

      const { data, error } = await supabase.rpc('catalog_list_tire_filter_options_v1');
      if (!active) return;
      if (error) {
        console.warn('Failed to load tire filter options:', error);
        return;
      }

      const rows = Array.isArray(data) ? data as TireFilterOptionRow[] : [];
      applyFilterOptions(rows);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(TIRE_FILTER_OPTIONS_CACHE_KEY, JSON.stringify(rows));
      }
    };

    void loadFilterOptions();
    return () => {
      active = false;
    };
  }, []);

  const hasPlateInput = licensePlate.replace(/[^A-Z0-9]/gi, '').length >= 6;
  const handleLicensePlateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && hasPlateInput) {
      void handleVehicleLookup();
    }
  };

  const activeSearchMode = localSearchMode;
  const switchSearchMode = (mode: 'license' | 'manual') => {
    setVehicleLookupError(null);
    setShowAdvancedFilters(mode === 'manual' ? true : false);
    setShowCountryChooser(false);
    setLocalSearchMode(mode);
    onSearchModeChange?.(mode);
  };

  const handleVehicleLookup = async () => {
    if (vehicleLookupLoading) return;
    setVehicleLookupError(null);
    setVehicleLookupLoading(true);
    try {
      const vehicle = await lookupVehicleTyreFitment(licensePlate, plateCountry);
      const factoryTyreSizes = vehicle.factoryTyreSizes?.length
        ? vehicle.factoryTyreSizes
        : [vehicle.factoryTyreSize];
      const recommendationResults = await Promise.all(
        factoryTyreSizes.map((factoryTyreSize) =>
          requestFitmentRecommendations(factoryTyreSize, {
            maxWeightKg: vehicle.maxWeightKg,
            maxSpeedKmh: vehicle.maxSpeedKmh,
          }).catch((error) => {
            console.warn('Fitment recommendation failed for size:', factoryTyreSize, error);
            return null;
          })
        )
      );
      const recommendations = recommendationResults
        .map((fitment) => fitment?.tyre ?? null)
        .filter((recommendation): recommendation is TyreFitmentRecommendation => Boolean(recommendation));
      const recommendation = recommendations.length > 0
        ? mergeTyreFitmentRecommendations(recommendations)
        : null;

      if (!recommendation) {
        throw new Error(t('catalog.factorySizeMissing'));
      }

      const factoryFilters = {
        ...filters,
        width: String(recommendation.factory.widthMm),
        aspectRatio: String(recommendation.factory.aspectRatio),
        diameter: String(recommendation.factory.rimDiameterIn),
      };
      setFilters(factoryFilters);
      onFilterChange(factoryFilters);
      onVehicleRecommendation?.(vehicle, recommendation);
    } catch (error) {
      setVehicleLookupError(error instanceof Error ? error.message : String(error));
    } finally {
      setVehicleLookupLoading(false);
    }
  };

  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    if (key === 'width' || key === 'aspectRatio' || key === 'diameter') {
      delete (newFilters as any).fitmentSizes;
    }
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleBrand = (brand: string, checked: boolean) => {
    const currentBrands = Array.isArray(filters.brand) ? filters.brand : [];
    const nextBrands = checked
      ? Array.from(new Set([...currentBrands, brand]))
      : currentBrands.filter((value) => value !== brand);
    updateFilter('brand', nextBrands);
  };

  const clearFilters = () => {
    const emptyFilters = { ...DEFAULT_TIRE_FILTERS };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const clearBrands = () => updateFilter('brand', []);

  const bgClass = theme === 'dark' ? 'bg-white/5' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-white/10' : 'border-gray-200';
  const textClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const secondaryTextClass = theme === 'dark' ? 'text-[#B0B8C4]' : 'text-gray-600';
  const inputBgClass = theme === 'dark' ? 'bg-white/5' : 'bg-gray-50';
  const selectBgClass = theme === 'dark' ? 'bg-[#161A22]' : 'bg-white';
  const selectedBrands = Array.isArray(filters.brand) ? filters.brand : [];
  const filteredBrandOptions = brandOptions.filter((brand) =>
    brand.toLowerCase().includes(brandSearchTerm.trim().toLowerCase())
  );
  const countryChooserPanel = (
    <div className={`flex w-full flex-col items-center gap-8 rounded-2xl border p-6 ${
      theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-[#e5e7eb] bg-white/5'
    }`}>
      <div className="grid w-full max-w-full grid-cols-1 justify-center gap-x-11 gap-y-[22px] sm:grid-cols-2 lg:w-auto lg:grid-cols-[repeat(5,max-content)]">
        {PLATE_COUNTRY_OPTIONS.map((country) => {
          return (
            <button
              key={country.code}
              type="button"
              onClick={() => {
                setPlateCountry(country.code);
                setShowCountryChooser(false);
              }}
              className={`flex h-8 items-center gap-4 rounded-lg text-left transition hover:opacity-75 ${
                theme === 'dark' ? 'text-white' : 'text-[#101828]'
              }`}
            >
              <span className="size-8 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10 shadow-[0_1px_3px_rgba(16,24,40,0.22)]">
                <img
                  src={country.flagSrc}
                  alt=""
                  className="size-full object-cover"
                  loading="lazy"
                />
              </span>
              <span className="whitespace-nowrap text-xl font-semibold leading-7 tracking-[-0.44px]">
                {country.name}
              </span>
            </button>
          );
        })}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => setShowCountryChooser(false)}
        className={`h-[42px] rounded-lg px-10 text-sm font-semibold ${
          theme === 'dark'
            ? 'border-white/10 bg-white/5 text-[#B0B8C4] hover:bg-white/10 hover:text-white'
            : 'border-[#d1d5dc] bg-[#f3f4f6] text-[#4a5565] hover:bg-gray-100'
        }`}
      >
        {t('catalog.back')}
      </Button>
    </div>
  );
  const advancedFiltersPanel = (
    <div className={`w-full max-w-[568px] space-y-4 rounded-xl border p-4 ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-[#f9fafb]'}`}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label className={`${textClass} mb-2 block text-sm`}>
            {t('catalog.filterByBrand')}
          </Label>
          <Button
            type="button"
            variant="outline"
            onClick={() => setBrandDialogOpen(true)}
            className={`w-full justify-between ${theme === 'dark' ? 'border-white/10 bg-[#0f1319] text-white hover:bg-white/10' : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'}`}
          >
            <span className="truncate">
              {selectedBrands.length === 0
                ? t('catalog.chooseBrands')
                : selectedBrands.length === 1
                  ? selectedBrands[0]
                  : t('catalog.brandsSelected', { count: selectedBrands.length })}
            </span>
            <span className={`${secondaryTextClass} text-xs`}>
              {t('catalog.open')}
            </span>
          </Button>
          {selectedBrands.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedBrands.slice(0, 4).map((brand) => (
                <span
                  key={brand}
                  className={`rounded-md px-2 py-1 text-xs ${theme === 'dark' ? 'bg-[#FF6B35]/15 text-[#FFD2C2]' : 'bg-[#FF6B35]/10 text-[#B9481E]'}`}
                >
                  {brand}
                </span>
              ))}
              {selectedBrands.length > 4 && (
                <span className={`rounded-md px-2 py-1 text-xs ${theme === 'dark' ? 'bg-white/10 text-white/80' : 'bg-gray-100 text-gray-700'}`}>
                  +{selectedBrands.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        <div>
          <Label className={`${textClass} mb-2 block text-sm`}>
            {t('catalog.filterByVehicle')}
          </Label>
          <Select value={filters.vehicleType} onValueChange={(value) => updateFilter('vehicleType', value)}>
            <SelectTrigger className={`${inputBgClass} ${borderClass} ${textClass}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={`${selectBgClass} ${borderClass}`}>
              <SelectItem value="all" className={`${textClass} hover:bg-white/10`}>
                {t('catalog.all')}
              </SelectItem>
              {vehicleTypeOptions.map((option) => (
                <SelectItem key={option.option_value} value={option.option_value} className={`${textClass} hover:bg-white/10`}>
                  {option.option_value === 'passenger'
                    ? t('catalog.vehicleType.passenger')
                    : option.option_value === 'van_c'
                      ? t('catalog.vehicleType.vanC')
                      : option.option_value === 'suv_4x4'
                        ? t('catalog.vehicleType.suv4x4')
                        : option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div>
          <Label className={`${textClass} mb-2 block text-sm`}>
            {t('catalog.filter.season')}
          </Label>
          <Select value={filters.season} onValueChange={(value) => updateFilter('season', value)}>
            <SelectTrigger className={`${inputBgClass} ${borderClass} ${textClass}`}>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent className={`${selectBgClass} ${borderClass}`}>
              <SelectItem value="all" className={`${textClass} hover:bg-white/10`}>{t('catalog.all')}</SelectItem>
              <SelectItem value="summer" className={`${textClass} hover:bg-white/10`}>
                {t('productDetail.summer')}
              </SelectItem>
              <SelectItem value="winter" className={`${textClass} hover:bg-white/10`}>
                {t('productDetail.winter')}
              </SelectItem>
              <SelectItem value="all_season" className={`${textClass} hover:bg-white/10`}>
                {t('productDetail.allSeason')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className={`${textClass} mb-2 block text-sm`}>
            {t('catalog.sortBy')}
          </Label>
          <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
            <SelectTrigger className={`${inputBgClass} ${borderClass} ${textClass}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={`${selectBgClass} ${borderClass}`}>
              <SelectItem value="price_asc" className={`${textClass} hover:bg-white/10`}>
                {t('catalog.priceAsc')}
              </SelectItem>
              <SelectItem value="price_desc" className={`${textClass} hover:bg-white/10`}>
                {t('catalog.priceDesc')}
              </SelectItem>
              <SelectItem value="wet_grip" className={`${textClass} hover:bg-white/10`}>
                {t('productDetail.wetGrip')}
              </SelectItem>
              <SelectItem value="noise" className={`${textClass} hover:bg-white/10`}>
                {t('catalog.noise')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className={`${textClass} mb-2 block text-sm`}>
            EAN
          </Label>
          <Input
            inputMode="numeric"
            value={filters.ean}
            onChange={(event) => updateFilter('ean', event.target.value)}
            placeholder="6419440..."
            className={`${inputBgClass} ${borderClass} ${textClass}`}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={filters.runflat}
            onCheckedChange={(checked) => updateFilter('runflat', checked)}
            className="data-[state=checked]:bg-[#FF6B35]"
          />
          <Label className={`${textClass} text-sm`}>RunFlat</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={filters.xl}
            onCheckedChange={(checked) => updateFilter('xl', checked)}
            className="data-[state=checked]:bg-[#FF6B35]"
          />
          <Label className={`${textClass} text-sm`}>XL</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={filters.studded}
            onCheckedChange={(checked) => updateFilter('studded', checked)}
            className="data-[state=checked]:bg-[#FF6B35]"
          />
          <Label className={`${textClass} text-sm`}>
            {t('productDetail.studdedShort')}
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={filters.inStockOnly}
            onCheckedChange={(checked) => updateFilter('inStockOnly', checked)}
            className="data-[state=checked]:bg-[#FF6B35]"
          />
          <Label className={`${textClass} text-sm`}>
            {t('productDetail.inStock')}
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={filters.includeRetreaded}
            onCheckedChange={(checked) => updateFilter('includeRetreaded', checked)}
            className="data-[state=checked]:bg-[#FF6B35]"
          />
          <Label className={`${textClass} text-sm`}>
            {t('catalog.retreaded')}
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={filters.electricCar}
            onCheckedChange={(checked) => updateFilter('electricCar', checked)}
            className="data-[state=checked]:bg-[#FF6B35]"
          />
          <Label className={`${textClass} text-sm`}>
            {t('catalog.electricCar')}
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={filters.soundAbsorber}
            onCheckedChange={(checked) => updateFilter('soundAbsorber', checked)}
            className="data-[state=checked]:bg-[#FF6B35]"
          />
          <Label className={`${textClass} text-sm`}>
            {t('productDetail.soundAbsorber')}
          </Label>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={clearFilters}
        className={`mx-auto flex ${secondaryTextClass} hover:${textClass} hover:bg-white/10`}
      >
        {t('catalog.clearAllFilters')}
      </Button>
    </div>
  );

  return (
    <div className={`rounded-2xl border p-6 ${borderClass} ${bgClass}`}>
      <div className="flex flex-col items-center gap-8">
        {activeSearchMode === 'license' ? (
          showCountryChooser ? (
            countryChooserPanel
          ) : (
          <div className="flex w-full flex-col items-center gap-8" onKeyDown={handleLicensePlateKeyDown}>
            <div className={showAdvancedFilters
              ? "grid w-full grid-cols-1 items-start justify-center gap-8 xl:grid-cols-[1fr_568px]"
              : "flex w-full flex-col items-center justify-center gap-6 py-[37px]"
            }>
              <div className={showAdvancedFilters
                ? "flex min-h-[255px] items-center justify-center py-[37px]"
                : "flex w-full flex-col items-center justify-center gap-6"
              }>
                <div className="w-full">
                  <Label className={`${textClass} mb-6 flex h-[30px] items-center justify-center text-xl font-semibold`}>
                    {t('catalog.enterLicensePlate')}
                  </Label>
                  <LicensePlateDisplay
                    value={licensePlate}
                    onChange={setLicensePlate}
                    country={plateCountry}
                    onCountryChange={setPlateCountry}
                    onCountryClick={() => setShowCountryChooser(true)}
                    placeholder="ABC-123"
                    showHelper={false}
                  />
                  {vehicleLookupError ? (
                    <p className="mt-3 text-center text-sm text-red-500">{vehicleLookupError}</p>
                  ) : null}
                  {!showAdvancedFilters ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowAdvancedFilters(true)}
                      className="mx-auto mt-6 flex h-8 items-center gap-3 rounded-[10px] px-3 text-sm font-semibold text-[#FF6B35] hover:bg-[#FF6B35]/10 hover:text-[#FF6B35]"
                    >
                      <Filter className="size-4" />
                      {t('catalog.advancedFilters')}
                    </Button>
                  ) : null}
                </div>
              </div>
              {showAdvancedFilters ? (
                <div className="flex justify-center xl:justify-end">
                  {advancedFiltersPanel}
                </div>
              ) : null}
            </div>
            <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => showAdvancedFilters ? setShowAdvancedFilters(false) : switchSearchMode('manual')}
                className={`h-[42px] w-[168px] rounded-lg px-10 text-sm font-semibold ${
                  theme === 'dark'
                    ? 'border-white/10 bg-white/5 text-[#B0B8C4] hover:bg-white/10 hover:text-white'
                    : 'border-[#d1d5dc] bg-[#f3f4f6] text-[#4a5565] hover:bg-gray-100'
                }`}
              >
                {showAdvancedFilters
                  ? t('catalog.licensePlate')
                  : t('catalog.manualInput')}
              </Button>
              <Button
                onClick={handleVehicleLookup}
                disabled={vehicleLookupLoading || !hasPlateInput}
                className="h-[42px] min-w-[174px] rounded-lg bg-[#FF6B35] px-16 text-sm font-semibold text-white shadow-[0_0_10px_rgba(255,107,53,0.24)] hover:bg-[#E85F2F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {vehicleLookupLoading
                  ? t('catalog.searching')
                  : t('catalog.search')}
              </Button>
            </div>
          </div>
          )
        ) : (
          <>
            <div className="grid w-full grid-cols-1 items-start justify-center gap-8 xl:grid-cols-[1fr_568px]">
              <div className="flex w-full justify-center xl:justify-start">
                <div className="flex w-full max-w-[568px] flex-col gap-4 self-stretch">
                  <Label className={`${textClass} flex items-center justify-center text-xl font-semibold`}>
                    {t('catalog.enterTireSize')}
                  </Label>
                  <div className="flex w-full flex-col gap-4">
                    <div>
                      <Label className={`${textClass} mb-2 block text-xs font-semibold`}>
                        {t('productDetail.width')}
                      </Label>
                      <Select value={filters.width} onValueChange={(value) => updateFilter('width', value)}>
                        <SelectTrigger className={`h-9 ${inputBgClass} ${borderClass} ${textClass}`}>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent className={`${selectBgClass} ${borderClass}`}>
                          <SelectItem value="all" className={`${textClass} hover:bg-white/10`}>{t('catalog.all')}</SelectItem>
                          {widthOptions.map(w => (
                            <SelectItem key={w} value={w} className={`${textClass} hover:bg-white/10`}>
                              {w}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className={`${textClass} mb-2 block text-xs font-semibold`}>
                        {t('catalog.aspect')}
                      </Label>
                      <Select value={filters.aspectRatio} onValueChange={(value) => updateFilter('aspectRatio', value)}>
                        <SelectTrigger className={`h-9 ${inputBgClass} ${borderClass} ${textClass}`}>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent className={`${selectBgClass} ${borderClass}`}>
                          <SelectItem value="all" className={`${textClass} hover:bg-white/10`}>{t('catalog.all')}</SelectItem>
                          {aspectOptions.map(a => (
                            <SelectItem key={a} value={a} className={`${textClass} hover:bg-white/10`}>
                              {a}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className={`${textClass} mb-2 block text-xs font-semibold`}>
                        {t('productDetail.diameter')}
                      </Label>
                      <Select value={filters.diameter} onValueChange={(value) => updateFilter('diameter', value)}>
                        <SelectTrigger className={`h-9 ${inputBgClass} ${borderClass} ${textClass}`}>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent className={`${selectBgClass} ${borderClass}`}>
                          <SelectItem value="all" className={`${textClass} hover:bg-white/10`}>{t('catalog.all')}</SelectItem>
                          {diameterOptions.map(d => (
                            <SelectItem key={d} value={d} className={`${textClass} hover:bg-white/10`}>
                              {d}"
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center xl:justify-end">
                {advancedFiltersPanel}
              </div>
            </div>
            <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => switchSearchMode('license')}
                className={`h-[42px] w-[168px] rounded-lg px-10 text-sm font-semibold ${
                  theme === 'dark'
                    ? 'border-white/10 bg-white/5 text-[#B0B8C4] hover:bg-white/10 hover:text-white'
                    : 'border-[#d1d5dc] bg-[#f3f4f6] text-[#4a5565] hover:bg-gray-100'
                }`}
              >
                {t('catalog.licensePlate')}
              </Button>
              <Button
                onClick={onSearch}
                className="h-[42px] min-w-[174px] rounded-lg bg-[#FF6B35] px-16 text-sm font-semibold text-white shadow-[0_0_10px_rgba(255,107,53,0.24)] hover:bg-[#E85F2F]"
              >
                {t('catalog.search')}
              </Button>
            </div>
          </>
        )}
      </div>
      <Dialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen}>
        <DialogContent className={`${theme === 'dark' ? 'border-white/10 bg-[#16181D] text-white' : 'border-gray-200 bg-white text-gray-900'} max-w-[calc(100vw-2rem)] sm:max-w-xl`}>
          <DialogHeader>
            <DialogTitle>{t('catalog.chooseTireBrands')}</DialogTitle>
            <DialogDescription className={theme === 'dark' ? 'text-[#B0B8C4]' : 'text-gray-600'}>
              {t('catalog.chooseTireBrandsDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${secondaryTextClass}`} />
              <Input
                value={brandSearchTerm}
                onChange={(e) => setBrandSearchTerm(e.target.value)}
                placeholder={t('catalog.searchBrands')}
                className={`pl-10 ${inputBgClass} ${borderClass} ${textClass}`}
              />
            </div>

            <div className={`max-h-[320px] space-y-3 overflow-y-auto rounded-xl border p-3 ${theme === 'dark' ? 'border-white/10 bg-[#0f1319]' : 'border-gray-200 bg-gray-50'}`}>
              {brandOptions.length === 0 ? (
                <p className={`text-sm ${secondaryTextClass}`}>
                  {t('catalog.loadingBrands')}
                </p>
              ) : filteredBrandOptions.length === 0 ? (
                <p className={`text-sm ${secondaryTextClass}`}>
                  {t('catalog.noBrandsMatch')}
                </p>
              ) : (
                filteredBrandOptions.map((brand) => {
                  const checked = selectedBrands.includes(brand);
                  return (
                    <label key={brand} className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => toggleBrand(brand, Boolean(value))}
                        className="data-[state=checked]:bg-[#FF6B35] data-[state=checked]:border-[#FF6B35]"
                      />
                      <span className={`text-sm ${textClass}`}>{brand}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={clearBrands}
              className={theme === 'dark' ? 'text-[#B0B8C4] hover:bg-white/10 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
            >
              {t('catalog.clearBrands')}
            </Button>
            <Button
              type="button"
              onClick={() => setBrandDialogOpen(false)}
              className="bg-[#FF6B35] hover:bg-[#FF6B35]/80 text-white"
            >
              {t('catalog.done')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
