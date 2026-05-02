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
import { LicensePlateDisplay } from './LicensePlateDisplay';
import { supabase } from '../../utils/supabase/client';

interface TireFiltersProps {
  onFilterChange: (filters: any) => void;
  onSearch: () => void;
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
    ean: string;
    sortBy: string;
    search: string;
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
  ean: '',
  sortBy: 'price_asc',
  search: '',
};

export function TireFilters({ onFilterChange, onSearch, searchMode, filters: externalFilters }: TireFiltersProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [licensePlate, setLicensePlate] = useState('');
  const [filters, setFilters] = useState(DEFAULT_TIRE_FILTERS);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [brandSearchTerm, setBrandSearchTerm] = useState('');

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auto-search when license plate is complete (6 characters) or on Enter
  useEffect(() => {
    if (searchMode === 'license' && licensePlate.length === 7) {
      onSearch();
    }
  }, [licensePlate, searchMode]);

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

  const handleLicensePlateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && licensePlate.length >= 6) {
      onSearch();
    }
  };

  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
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

  return (
    <div className={`glassmorphic-panel rounded-2xl p-6 border backdrop-blur-xl ${borderClass} ${bgClass}`}>
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
          </div>
        </div>
      )}

      {/* Manual Entry */}
      {searchMode === 'manual' && (
        <>
          {/* Simple Main Filters - Width, Aspect, Diameter */}
          <div>
            <Label className={`${textClass} text-sm mb-3 block`}>
              {language === 'fi' ? '⚙️ Rengaskoko' : '⚙️ Tire Size'}
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Width */}
              <div>
                <Label className={`${textClass} mb-2 block text-xs`}>
                  {language === 'fi' ? 'Leveys' : 'Width'}
                </Label>
                <Select value={filters.width} onValueChange={(value) => updateFilter('width', value)}>
                  <SelectTrigger className={`${inputBgClass} ${borderClass} ${textClass}`}>
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

              {/* Aspect Ratio */}
              <div>
                <Label className={`${textClass} mb-2 block text-xs`}>
                  {language === 'fi' ? 'Korkeus' : 'Aspect'}
                </Label>
                <Select value={filters.aspectRatio} onValueChange={(value) => updateFilter('aspectRatio', value)}>
                  <SelectTrigger className={`${inputBgClass} ${borderClass} ${textClass}`}>
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

              {/* Diameter */}
              <div>
                <Label className={`${textClass} mb-2 block text-xs`}>
                  {language === 'fi' ? 'Halkaisija' : 'Diameter'}
                </Label>
                <Select value={filters.diameter} onValueChange={(value) => updateFilter('diameter', value)}>
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
            </div>
          </div>

          {/* Search Button */}
          <Button
            onClick={onSearch}
            className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/80 text-white shadow-[0_0_20px_rgba(255,107,53,0.3)] mb-4"
          >
            {language === 'fi' ? '🔍 Hae' : '🔍 Search'}
          </Button>

          {/* Advanced Filters Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[#FF6B35] hover:text-[#FF6B35]/80 hover:bg-[#FF6B35]/10"
            >
              <Filter className="w-4 h-4 mr-2" />
              {language === 'fi' ? 'Lisäsuodattimet' : 'Advanced Filters'}
            </Button>
          </div>

          {showAdvanced && (
            <div className={`space-y-4 p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-200'}`}>
              {/* Season, Sort & EAN Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              {/* Feature Toggles */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* RunFlat */}
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={filters.runflat}
                    onCheckedChange={(checked) => updateFilter('runflat', checked)}
                    className="data-[state=checked]:bg-[#FF6B35]"
                  />
                  <Label className={`${textClass} text-sm`}>RunFlat</Label>
                </div>

                {/* XL */}
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={filters.xl}
                    onCheckedChange={(checked) => updateFilter('xl', checked)}
                    className="data-[state=checked]:bg-[#FF6B35]"
                  />
                  <Label className={`${textClass} text-sm`}>XL</Label>
                </div>

                {/* Studded */}
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

                {/* In Stock */}
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

                {/* Retreaded */}
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
              </div>

              {/* Brand Checklist */}
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
                        className={`rounded-full px-2.5 py-1 text-xs ${theme === 'dark' ? 'bg-[#FF6B35]/15 text-[#FFD2C2]' : 'bg-[#FF6B35]/10 text-[#B9481E]'}`}
                      >
                        {brand}
                      </span>
                    ))}
                    {selectedBrands.length > 4 && (
                      <span className={`rounded-full px-2.5 py-1 text-xs ${theme === 'dark' ? 'bg-white/10 text-white/80' : 'bg-gray-100 text-gray-700'}`}>
                        +{selectedBrands.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Clear Filters */}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className={`${secondaryTextClass} hover:${textClass} hover:bg-white/10`}
              >
                {language === 'fi' ? 'Tyhjennä suodattimet' : 'Clear All Filters'}
              </Button>
            </div>
          )}
        </>
      )}

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
