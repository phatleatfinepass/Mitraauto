import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';
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
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [licensePlate, setLicensePlate] = useState('');
  const [plateCountry, setPlateCountry] = useState<PlateCountryCode>('FI');
  const [filters, setFilters] = useState(DEFAULT_TIRE_FILTERS);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
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

    const loadBrands = async () => {
      const { data, error } = await supabase.rpc('catalog_list_tire_brands_v1');
      if (!active) return;
      if (error) {
        console.warn('Failed to load tire brands:', error);
        return;
      }

      const brands = Array.isArray(data)
        ? data
            .map((row: any) => String(row?.brand ?? '').trim())
            .filter((brand) => brand.length > 0)
        : [];
      setBrandOptions(brands);
    };

    void loadBrands();
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
        throw new Error(language === 'fi'
          ? 'Tehdaskokoa ei löytynyt ETRTO-aineistosta.'
          : 'The factory size was not found in the ETRTO dataset.');
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

  const widthOptions = ['155', '165', '175', '185', '195', '205', '215', '225', '235', '245', '255', '265', '275', '285', '295', '305', '315', '325', '335', '345', '355'];
  const aspectOptions = ['30', '35', '40', '45', '50', '55', '60', '65', '70', '75', '80', '85'];
  const diameterOptions = ['12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'];

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
        {language === 'fi' ? 'Takaisin' : 'Back'}
      </Button>
    </div>
  );
  const advancedFiltersPanel = (
    <div className={`w-full max-w-[568px] space-y-4 rounded-xl border p-4 ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-[#f9fafb]'}`}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div>
          <Label className={`${textClass} mb-2 block text-sm`}>
            {language === 'fi' ? 'Kausi' : 'Season'}
          </Label>
          <Select value={filters.season} onValueChange={(value) => updateFilter('season', value)}>
            <SelectTrigger className={`${inputBgClass} ${borderClass} ${textClass}`}>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent className={`${selectBgClass} ${borderClass}`}>
              <SelectItem value="all" className={`${textClass} hover:bg-white/10`}>All</SelectItem>
              <SelectItem value="summer" className={`${textClass} hover:bg-white/10`}>
                {language === 'fi' ? 'Kesä' : 'Summer'}
              </SelectItem>
              <SelectItem value="winter" className={`${textClass} hover:bg-white/10`}>
                {language === 'fi' ? 'Talvi' : 'Winter'}
              </SelectItem>
              <SelectItem value="all_season" className={`${textClass} hover:bg-white/10`}>
                {language === 'fi' ? 'Ympärivuotinen' : 'All Season'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className={`${textClass} mb-2 block text-sm`}>
            {language === 'fi' ? 'Järjestä' : 'Sort By'}
          </Label>
          <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
            <SelectTrigger className={`${inputBgClass} ${borderClass} ${textClass}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={`${selectBgClass} ${borderClass}`}>
              <SelectItem value="price_asc" className={`${textClass} hover:bg-white/10`}>
                {language === 'fi' ? 'Hinta ↑' : 'Price ↑'}
              </SelectItem>
              <SelectItem value="price_desc" className={`${textClass} hover:bg-white/10`}>
                {language === 'fi' ? 'Hinta ↓' : 'Price ↓'}
              </SelectItem>
              <SelectItem value="wet_grip" className={`${textClass} hover:bg-white/10`}>
                {language === 'fi' ? 'Märkäpito' : 'Wet Grip'}
              </SelectItem>
              <SelectItem value="noise" className={`${textClass} hover:bg-white/10`}>
                {language === 'fi' ? 'Melu' : 'Noise'}
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
            {language === 'fi' ? 'Nastat' : 'Studded'}
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={filters.inStockOnly}
            onCheckedChange={(checked) => updateFilter('inStockOnly', checked)}
            className="data-[state=checked]:bg-[#FF6B35]"
          />
          <Label className={`${textClass} text-sm`}>
            {language === 'fi' ? 'Varastossa' : 'In Stock'}
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={filters.includeRetreaded}
            onCheckedChange={(checked) => updateFilter('includeRetreaded', checked)}
            className="data-[state=checked]:bg-[#FF6B35]"
          />
          <Label className={`${textClass} text-sm`}>
            {language === 'fi' ? 'Pinnoitetut' : 'Retreaded'}
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={filters.electricCar}
            onCheckedChange={(checked) => updateFilter('electricCar', checked)}
            className="data-[state=checked]:bg-[#FF6B35]"
          />
          <Label className={`${textClass} text-sm`}>
            {language === 'fi' ? 'Sähköauto' : 'Electric Car'}
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={filters.soundAbsorber}
            onCheckedChange={(checked) => updateFilter('soundAbsorber', checked)}
            className="data-[state=checked]:bg-[#FF6B35]"
          />
          <Label className={`${textClass} text-sm`}>
            {language === 'fi' ? 'Äänenvaimennus' : 'Sound absorber'}
          </Label>
        </div>
      </div>

      <div>
        <Label className={`${textClass} mb-2 block text-sm`}>
          {language === 'fi' ? 'Suodata merkeittäin' : 'Filter by brand'}
        </Label>
        <Button
          type="button"
          variant="outline"
          onClick={() => setBrandDialogOpen(true)}
          className={`w-full justify-between ${theme === 'dark' ? 'border-white/10 bg-[#0f1319] text-white hover:bg-white/10' : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'}`}
        >
          <span className="truncate">
            {selectedBrands.length === 0
              ? (language === 'fi' ? 'Valitse merkit' : 'Choose brands')
              : selectedBrands.length === 1
                ? selectedBrands[0]
                : language === 'fi'
                  ? `${selectedBrands.length} merkkiä valittu`
                  : `${selectedBrands.length} brands selected`}
          </span>
          <span className={`${secondaryTextClass} text-xs`}>
            {language === 'fi' ? 'Avaa' : 'Open'}
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

      <Button
        variant="ghost"
        size="sm"
        onClick={clearFilters}
        className={`mx-auto flex ${secondaryTextClass} hover:${textClass} hover:bg-white/10`}
      >
        {language === 'fi' ? 'Tyhjennä suodattimet' : 'Clear All Filters'}
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
                    {language === 'fi' ? 'Syötä rekisteritunnus' : 'Enter License Plate'}
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
                      {language === 'fi' ? 'Lisäsuodattimet' : 'Advanced Filters'}
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
                  ? (language === 'fi' ? 'Rekisteritunnus' : 'License Plate')
                  : (language === 'fi' ? 'Manuaalinen haku' : 'Manual Input')}
              </Button>
              <Button
                onClick={handleVehicleLookup}
                disabled={vehicleLookupLoading || !hasPlateInput}
                className="h-[42px] min-w-[174px] rounded-lg bg-[#FF6B35] px-16 text-sm font-semibold text-white shadow-[0_0_10px_rgba(255,107,53,0.24)] hover:bg-[#E85F2F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {vehicleLookupLoading
                  ? (language === 'fi' ? 'Haetaan...' : 'Searching...')
                  : (language === 'fi' ? 'Hae' : 'Search')}
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
                    {language === 'fi' ? 'Syötä rengaskoko' : 'Enter Tire Size'}
                  </Label>
                  <div className="flex w-full flex-col gap-4">
                    <div>
                      <Label className={`${textClass} mb-2 block text-xs font-semibold`}>
                        {language === 'fi' ? 'Leveys' : 'Width'}
                      </Label>
                      <Select value={filters.width} onValueChange={(value) => updateFilter('width', value)}>
                        <SelectTrigger className={`h-9 ${inputBgClass} ${borderClass} ${textClass}`}>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent className={`${selectBgClass} ${borderClass}`}>
                          <SelectItem value="all" className={`${textClass} hover:bg-white/10`}>All</SelectItem>
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
                        {language === 'fi' ? 'Korkeus' : 'Aspect'}
                      </Label>
                      <Select value={filters.aspectRatio} onValueChange={(value) => updateFilter('aspectRatio', value)}>
                        <SelectTrigger className={`h-9 ${inputBgClass} ${borderClass} ${textClass}`}>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent className={`${selectBgClass} ${borderClass}`}>
                          <SelectItem value="all" className={`${textClass} hover:bg-white/10`}>All</SelectItem>
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
                        {language === 'fi' ? 'Halkaisija' : 'Diameter'}
                      </Label>
                      <Select value={filters.diameter} onValueChange={(value) => updateFilter('diameter', value)}>
                        <SelectTrigger className={`h-9 ${inputBgClass} ${borderClass} ${textClass}`}>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent className={`${selectBgClass} ${borderClass}`}>
                          <SelectItem value="all" className={`${textClass} hover:bg-white/10`}>All</SelectItem>
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
                {language === 'fi' ? 'Rekisteritunnus' : 'License Plate'}
              </Button>
              <Button
                onClick={onSearch}
                className="h-[42px] min-w-[174px] rounded-lg bg-[#FF6B35] px-16 text-sm font-semibold text-white shadow-[0_0_10px_rgba(255,107,53,0.24)] hover:bg-[#E85F2F]"
              >
                {language === 'fi' ? 'Hae' : 'Search'}
              </Button>
            </div>
          </>
        )}
      </div>
      <Dialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen}>
        <DialogContent className={`${theme === 'dark' ? 'border-white/10 bg-[#16181D] text-white' : 'border-gray-200 bg-white text-gray-900'} max-w-[calc(100vw-2rem)] sm:max-w-xl`}>
          <DialogHeader>
            <DialogTitle>{language === 'fi' ? 'Valitse rengasmerkit' : 'Choose tire brands'}</DialogTitle>
            <DialogDescription className={theme === 'dark' ? 'text-[#B0B8C4]' : 'text-gray-600'}>
              {language === 'fi'
                ? 'Valitse yksi tai useampi merkki suodattaaksesi hakutuloksia.'
                : 'Select one or more brands to narrow the search results.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${secondaryTextClass}`} />
              <Input
                value={brandSearchTerm}
                onChange={(e) => setBrandSearchTerm(e.target.value)}
                placeholder={language === 'fi' ? 'Etsi merkkiä' : 'Search brands'}
                className={`pl-10 ${inputBgClass} ${borderClass} ${textClass}`}
              />
            </div>

            <div className={`max-h-[320px] space-y-3 overflow-y-auto rounded-xl border p-3 ${theme === 'dark' ? 'border-white/10 bg-[#0f1319]' : 'border-gray-200 bg-gray-50'}`}>
              {brandOptions.length === 0 ? (
                <p className={`text-sm ${secondaryTextClass}`}>
                  {language === 'fi' ? 'Ladataan merkkejä...' : 'Loading brands...'}
                </p>
              ) : filteredBrandOptions.length === 0 ? (
                <p className={`text-sm ${secondaryTextClass}`}>
                  {language === 'fi' ? 'Ei merkkejä tällä haulla.' : 'No brands match this search.'}
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
              {language === 'fi' ? 'Tyhjennä merkit' : 'Clear brands'}
            </Button>
            <Button
              type="button"
              onClick={() => setBrandDialogOpen(false)}
              className="bg-[#FF6B35] hover:bg-[#FF6B35]/80 text-white"
            >
              {language === 'fi' ? 'Valmis' : 'Done'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
