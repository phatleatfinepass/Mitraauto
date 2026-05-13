import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '../ui/button';
import { LicensePlateDisplay } from './LicensePlateDisplay';
import { lookupVehicleTyreFitment } from '../../utils/vehicleFitmentLookup';
import { requestFitmentRecommendations } from '../../utils/fitmentRecommendations';
import { supabase } from '../../utils/supabase/client';

interface RimFiltersProps {
  onFilterChange: (filters: any) => void;
  onSearch: (filtersOverride?: any) => void;
  searchMode: 'license' | 'vehicle' | 'manual';
}

type RimPcdOption = {
  value: string;
  label: string;
  count?: number;
};

export const DEFAULT_RIM_FILTERS = {
  rimDiameter: 'all',
  rimWidth: 'all',
  rimWidths: undefined as number[] | undefined,
  brand: 'all',
  pcd: 'all',
  etOffset: '',
  cb: '',
  color: 'all',
  material: 'all',
  boltsIncluded: undefined as boolean | undefined,
  inStockOnly: false,
  sortBy: 'price_asc',
  search: '',
};

export function RimFilters({ onFilterChange, onSearch, searchMode }: RimFiltersProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [licensePlate, setLicensePlate] = useState('');
  const [filters, setFilters] = useState(DEFAULT_RIM_FILTERS);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [diameterOptions, setDiameterOptions] = useState<string[]>([]);
  const [widthOptions, setWidthOptions] = useState<string[]>([]);
  const [pcdOptions, setPcdOptions] = useState<RimPcdOption[]>([]);
  const [vehicleLookupLoading, setVehicleLookupLoading] = useState(false);
  const [vehicleLookupError, setVehicleLookupError] = useState<string | null>(null);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const loadFilterOptions = async () => {
      const { data, error } = await supabase.rpc('catalog_list_rim_filter_options_v1');
      if (!active) return;
      if (error) {
        console.warn('Failed to load rim filter options:', error);
        return;
      }

      const payload = data && typeof data === 'object' ? data as any : {};
      const brands = Array.isArray(payload.brands)
        ? payload.brands.map((brand: unknown) => String(brand ?? '').trim()).filter(Boolean)
        : [];
      const diameters = Array.isArray(payload.diameters)
        ? payload.diameters.map((value: unknown) => String(value ?? '').trim()).filter(Boolean)
        : [];
      const widths = Array.isArray(payload.widths)
        ? payload.widths.map((value: unknown) => String(value ?? '').trim()).filter(Boolean)
        : [];
      const pcds = Array.isArray(payload.pcds)
        ? payload.pcds
            .map((option: any) => ({
              value: String(option?.value ?? '').trim(),
              label: String(option?.label ?? option?.value ?? '').trim(),
              count: Number(option?.count),
            }))
            .filter((option: RimPcdOption) => option.value.length > 0 && option.label.length > 0)
        : [];

      setBrandOptions(brands);
      setDiameterOptions(diameters);
      setWidthOptions(widths);
      setPcdOptions(pcds);
    };

    void loadFilterOptions();
    return () => {
      active = false;
    };
  }, []);

  // Auto-search when license plate is complete or on Enter.
  useEffect(() => {
    const compactPlate = licensePlate.replace(/[^A-Z0-9]/gi, '');
    if (searchMode === 'license' && compactPlate.length >= 6) {
      void handleVehicleLookup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [licensePlate, searchMode]);

  const handleLicensePlateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && licensePlate.length >= 6) {
      void handleVehicleLookup();
    }
  };

  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleVehicleLookup = async () => {
    if (vehicleLookupLoading) return;
    const compactPlate = licensePlate.replace(/[^A-Z0-9]/gi, '');
    if (compactPlate.length < 6) return;

    setVehicleLookupError(null);
    setVehicleLookupLoading(true);
    try {
      const vehicle = await lookupVehicleTyreFitment(licensePlate, 'FI');
      const factoryTyreSize = vehicle.factoryTyreSizes?.[0] || vehicle.factoryTyreSize;
      const fitment = await requestFitmentRecommendations(factoryTyreSize, {
        maxWeightKg: vehicle.maxWeightKg,
        maxSpeedKmh: vehicle.maxSpeedKmh,
      }, vehicle.rimMounting ?? undefined);
      const rim = fitment.rim;
      if (!rim) {
        throw new Error(language === 'fi'
          ? 'Ajoneuvon vannemitoitusta ei voitu laskea.'
          : 'Could not calculate rim fitment for this vehicle.');
      }

      const preferredWidth = rim.factory.preferredRimWidthIn ?? rim.factory.approvedRimWidthsIn[0] ?? null;
      const vehicleFilters = {
        ...filters,
        rimDiameter: String(rim.catalogFilters.factoryRimDiameterIn),
        rimWidth: preferredWidth ? String(preferredWidth) : 'all',
        rimWidths: rim.catalogFilters.factoryApprovedWidthsIn,
        pcd: rim.catalogFilters.pcd ?? 'all',
        cb: rim.catalogFilters.centerBoreMinMm != null ? String(rim.catalogFilters.centerBoreMinMm) : '',
        etOffset: rim.mounting.factoryOffsetMm != null ? String(rim.mounting.factoryOffsetMm) : '',
      };

      setFilters(vehicleFilters);
      onFilterChange(vehicleFilters);
      onSearch(vehicleFilters);
    } catch (error) {
      setVehicleLookupError(error instanceof Error ? error.message : String(error));
    } finally {
      setVehicleLookupLoading(false);
    }
  };

  const clearFilters = () => {
    const emptyFilters = { ...DEFAULT_RIM_FILTERS };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const bgClass = theme === 'dark' ? 'bg-[#161A22]' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-white/10' : 'border-gray-200';
  const textClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const secondaryTextClass = theme === 'dark' ? 'text-[#B0B8C4]' : 'text-gray-600';
  const inputBgClass = theme === 'dark' ? 'bg-white/5' : 'bg-gray-50';
  const selectBgClass = theme === 'dark' ? 'bg-[#161A22]' : 'bg-white';

  return (
    <div className={`rounded-xl p-5 border ${borderClass} ${bgClass}`}>
      {/* License Plate Search */}
      {searchMode === 'license' && (
        <div className="space-y-4" onKeyDown={handleLicensePlateKeyDown}>
          <div>
            <Label className={`${textClass} mb-4 block text-center text-lg`}>
              {language === 'fi' ? 'Syötä rekisteritunnus' : 'Enter License Plate'}
            </Label>
            <LicensePlateDisplay
              value={licensePlate}
              onChange={setLicensePlate}
              placeholder="ABC-123"
            />
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                onClick={() => void handleVehicleLookup()}
                disabled={vehicleLookupLoading || licensePlate.replace(/[^A-Z0-9]/gi, '').length < 6}
                className="bg-[#FF6B35] text-white hover:bg-[#FF6B35]/90 disabled:opacity-50"
              >
                {vehicleLookupLoading
                  ? (language === 'fi' ? 'Haetaan...' : 'Searching...')
                  : (language === 'fi' ? 'Hae vannekoko' : 'Find rim size')}
              </Button>
            </div>
            {vehicleLookupError && (
              <p className="mt-3 text-center text-sm text-red-500">{vehicleLookupError}</p>
            )}
          </div>
        </div>
      )}

      {/* Manual Entry */}
      {searchMode === 'manual' && (
        <>
          {/* Simple Main Filters - Search, Diameter, Width, PCD, Brand */}
          <div>
            <Label className={`${textClass} text-sm mb-3 block`}>
              {language === 'fi' ? 'Vanteen haku' : 'Rim search'}
            </Label>
            <div className="mb-4">
              <Label className={`${textClass} mb-2 block text-xs`}>
                {language === 'fi' ? 'Haku' : 'Search'}
              </Label>
              <div className="relative">
                <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${secondaryTextClass}`} />
                <Input
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  placeholder={language === 'fi' ? 'Merkki, malli, EAN, PCD...' : 'Brand, model, EAN, PCD...'}
                  className={`${inputBgClass} ${borderClass} ${textClass} pl-9 placeholder:${secondaryTextClass}/50`}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Diameter */}
              <div>
                <Label className={`${textClass} mb-2 block text-xs`}>
                  {language === 'fi' ? 'Halkaisija' : 'Diameter'}
                </Label>
                <Select value={filters.rimDiameter} onValueChange={(value) => updateFilter('rimDiameter', value)}>
                  <SelectTrigger className={`${inputBgClass} ${borderClass} ${textClass}`}>
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

              {/* Width */}
              <div>
                <Label className={`${textClass} mb-2 block text-xs`}>
                  {language === 'fi' ? 'Leveys' : 'Width'}
                </Label>
                <Select value={filters.rimWidth} onValueChange={(value) => updateFilter('rimWidth', value)}>
                  <SelectTrigger className={`${inputBgClass} ${borderClass} ${textClass}`}>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent className={`${selectBgClass} ${borderClass}`}>
                    <SelectItem value="all" className={`${textClass} hover:bg-white/10`}>All</SelectItem>
                    {widthOptions.map(w => (
                      <SelectItem key={w} value={w} className={`${textClass} hover:bg-white/10`}>
                        {w}"
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PCD */}
              <div>
                <Label className={`${textClass} mb-2 block text-xs`}>
                  PCD
                </Label>
                <Select value={filters.pcd} onValueChange={(value) => updateFilter('pcd', value)}>
                  <SelectTrigger className={`${inputBgClass} ${borderClass} ${textClass}`}>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent className={`${selectBgClass} ${borderClass}`}>
                    <SelectItem value="all" className={`${textClass} hover:bg-white/10`}>All</SelectItem>
                    {pcdOptions.map(p => (
                      <SelectItem key={p.value} value={p.value} className={`${textClass} hover:bg-white/10`}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Brand */}
              <div>
                <Label className={`${textClass} mb-2 block text-xs`}>
                  {language === 'fi' ? 'Merkki' : 'Brand'}
                </Label>
                <Select value={filters.brand} onValueChange={(value) => updateFilter('brand', value)}>
                  <SelectTrigger className={`${inputBgClass} ${borderClass} ${textClass}`}>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent className={`${selectBgClass} ${borderClass}`}>
                    <SelectItem value="all" className={`${textClass} hover:bg-white/10`}>All</SelectItem>
                    {brandOptions.map((brand) => (
                      <SelectItem key={brand} value={brand} className={`${textClass} hover:bg-white/10`}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => onSearch()}
              className="flex-1 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white"
            >
              {language === 'fi' ? 'Hae vanteet' : 'Search rims'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSettingsDrawerOpen(true)}
              className={`shrink-0 ${
                theme === 'dark'
                  ? 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                  : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              {language === 'fi' ? 'Näkymän asetukset' : 'View settings'}
            </Button>
          </div>

          <Sheet open={settingsDrawerOpen} onOpenChange={setSettingsDrawerOpen}>
            <SheetContent
              side="right"
              className={`w-full sm:max-w-[520px] ${
                theme === 'dark' ? 'border-white/10 bg-[#10131A] text-white' : 'border-gray-200 bg-white text-gray-900'
              }`}
            >
              <SheetHeader className={theme === 'dark' ? 'border-b border-white/10' : 'border-b border-gray-200'}>
                <SheetTitle className={textClass}>
                  {language === 'fi' ? 'Vanteiden näkymäasetukset' : 'Rims view settings'}
                </SheetTitle>
                <SheetDescription className={secondaryTextClass}>
                  {language === 'fi'
                    ? 'Rajaa vannetuloksia teknisten mittojen, saatavuuden ja järjestyksen mukaan.'
                    : 'Refine rim results by technical fitment, availability, and ordering.'}
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
                <section className={`rounded-xl border p-4 ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label className={`${textClass} mb-2 block text-sm`}>
                        {language === 'fi' ? 'ET (offset)' : 'ET Offset'}
                      </Label>
                      <Input
                        type="number"
                        value={filters.etOffset}
                        onChange={(e) => updateFilter('etOffset', e.target.value)}
                        placeholder="35"
                        className={`${inputBgClass} ${borderClass} ${textClass} placeholder:${secondaryTextClass}/50`}
                      />
                    </div>
                    <div>
                      <Label className={`${textClass} mb-2 block text-sm`}>
                        {language === 'fi' ? 'CB (keskireikä)' : 'CB (center bore)'}
                      </Label>
                      <Input
                        type="number"
                        value={filters.cb}
                        onChange={(e) => updateFilter('cb', e.target.value)}
                        placeholder="66.6"
                        step="0.1"
                        className={`${inputBgClass} ${borderClass} ${textClass} placeholder:${secondaryTextClass}/50`}
                      />
                    </div>
                  </div>
                </section>

                <section className={`rounded-xl border p-4 ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="space-y-4">
                    <div>
                      <Label className={`${textClass} mb-2 block text-sm`}>
                        {language === 'fi' ? 'Järjestä' : 'Sort by'}
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
                          <SelectItem value="brand_asc" className={`${textClass} hover:bg-white/10`}>
                            {language === 'fi' ? 'Merkki A-Ö' : 'Brand A-Z'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <label className="flex items-center gap-3">
                      <Switch
                        checked={filters.inStockOnly}
                        onCheckedChange={(checked) => updateFilter('inStockOnly', checked)}
                        className="data-[state=checked]:bg-[#FF6B35]"
                      />
                      <span className={`${textClass} text-sm`}>
                        {language === 'fi' ? 'Vain varastossa' : 'In stock only'}
                      </span>
                    </label>
                  </div>
                </section>
              </div>

              <div className={`border-t px-4 py-4 ${theme === 'dark' ? 'border-white/10 bg-[#10131A]' : 'border-gray-200 bg-white'}`}>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className={`${secondaryTextClass} hover:${textClass} hover:bg-white/10`}
                  >
                    {language === 'fi' ? 'Tyhjennä' : 'Clear'}
                  </Button>
                  <Button
                    onClick={() => {
                      setSettingsDrawerOpen(false);
                      onSearch(filters);
                    }}
                    className="flex-1 bg-[#FF6B35] text-white hover:bg-[#FF6B35]/90"
                  >
                    {language === 'fi' ? 'Käytä asetukset' : 'Apply settings'}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}
