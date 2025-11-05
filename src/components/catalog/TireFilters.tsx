import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Search, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { LicensePlateDisplay } from './LicensePlateDisplay';

interface TireFiltersProps {
  onFilterChange: (filters: any) => void;
  onSearch: () => void;
  searchMode: 'license' | 'vehicle' | 'manual';
}

export function TireFilters({ onFilterChange, onSearch, searchMode }: TireFiltersProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [licensePlate, setLicensePlate] = useState('');
  const [filters, setFilters] = useState({
    width: 'all',
    aspectRatio: 'all',
    diameter: 'all',
    season: 'all',
    brand: [],
    runflat: false,
    xl: false,
    studded: false,
    inStockOnly: false,
    sortBy: 'price_asc',
    search: '',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auto-search when license plate is complete (6 characters) or on Enter
  useEffect(() => {
    if (searchMode === 'license' && licensePlate.length === 7) {
      onSearch();
    }
  }, [licensePlate, searchMode]);

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

  const clearFilters = () => {
    const emptyFilters = {
      width: 'all',
      aspectRatio: 'all',
      diameter: 'all',
      season: 'all',
      brand: [],
      runflat: false,
      xl: false,
      studded: false,
      inStockOnly: false,
      sortBy: 'price_asc',
      search: '',
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const widthOptions = ['155', '165', '175', '185', '195', '205', '215', '225', '235', '245', '255', '265', '275', '285', '295', '305', '315', '325', '335', '345', '355'];
  const aspectOptions = ['30', '35', '40', '45', '50', '55', '60', '65', '70', '75', '80', '85'];
  const diameterOptions = ['12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'];

  const bgClass = theme === 'dark' ? 'bg-white/5' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-white/10' : 'border-gray-200';
  const textClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const secondaryTextClass = theme === 'dark' ? 'text-[#B0B8C4]' : 'text-gray-600';
  const inputBgClass = theme === 'dark' ? 'bg-white/5' : 'bg-gray-50';
  const selectBgClass = theme === 'dark' ? 'bg-[#161A22]' : 'bg-white';

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
              {/* Season & Sort Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        {language === 'fi' ? '☀️ Kesä' : '☀️ Summer'}
                      </SelectItem>
                      <SelectItem value="winter" className={`${textClass} hover:bg-white/10`}>
                        {language === 'fi' ? '❄️ Talvi' : '❄️ Winter'}
                      </SelectItem>
                      <SelectItem value="all_season" className={`${textClass} hover:bg-white/10`}>
                        {language === 'fi' ? '🔄 Ympärivuotinen' : '🔄 All Season'}
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
              </div>

              {/* Feature Toggles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              </div>

              {/* Search Input */}
              <div>
                <Label className={`${textClass} mb-2 block text-sm`}>
                  {language === 'fi' ? 'Haku merkillä tai mallilla' : 'Search by brand or model'}
                </Label>
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${secondaryTextClass}`} />
                  <Input
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    placeholder={language === 'fi' ? 'Malli tai merkki' : 'Model or brand'}
                    className={`pl-10 ${inputBgClass} ${borderClass} ${textClass} placeholder:${secondaryTextClass}/50 focus:border-[#FF6B35] focus:ring-[#FF6B35]/20`}
                  />
                </div>
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
    </div>
  );
}
