import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { LicensePlateDisplay } from './LicensePlateDisplay';

interface RimFiltersProps {
  onFilterChange: (filters: any) => void;
  onSearch: () => void;
  searchMode: 'license' | 'vehicle' | 'manual';
}

export function RimFilters({ onFilterChange, onSearch, searchMode }: RimFiltersProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [licensePlate, setLicensePlate] = useState('');
  const [filters, setFilters] = useState({
    rimDiameter: 'all',
    rimWidth: 'all',
    pcd: 'all',
    etOffset: '',
    cb: '',
    color: 'all',
    material: 'all',
    boltsIncluded: undefined,
    inStockOnly: false,
    sortBy: 'price_asc',
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
      rimDiameter: 'all',
      rimWidth: 'all',
      pcd: 'all',
      etOffset: '',
      cb: '',
      color: 'all',
      material: 'all',
      boltsIncluded: undefined,
      inStockOnly: false,
      sortBy: 'price_asc',
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const diameterOptions = ['13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'];
  const widthOptions = ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12'];
  const pcdOptions = ['4×100', '4×108', '5×100', '5×108', '5×112', '5×114.3', '5×120', '6×139.7'];

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
          {/* Simple Main Filters - Diameter, Width, PCD */}
          <div>
            <Label className={`${textClass} text-sm mb-3 block`}>
              {language === 'fi' ? '⚙️ Vanteen koko' : '⚙️ Rim Size'}
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                      <SelectItem key={p} value={p} className={`${textClass} hover:bg-white/10`}>
                        {p}
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
              {/* ET Offset & CB */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Color & Material */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className={`${textClass} mb-2 block text-sm`}>
                    {language === 'fi' ? 'Väri' : 'Color'}
                  </Label>
                  <Select value={filters.color} onValueChange={(value) => updateFilter('color', value)}>
                    <SelectTrigger className={`${inputBgClass} ${borderClass} ${textClass}`}>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent className={`${selectBgClass} ${borderClass}`}>
                      <SelectItem value="all" className={`${textClass} hover:bg-white/10`}>All</SelectItem>
                      <SelectItem value="silver" className={`${textClass} hover:bg-white/10`}>
                        {language === 'fi' ? 'Hopea' : 'Silver'}
                      </SelectItem>
                      <SelectItem value="black" className={`${textClass} hover:bg-white/10`}>
                        {language === 'fi' ? 'Musta' : 'Black'}
                      </SelectItem>
                      <SelectItem value="gunmetal" className={`${textClass} hover:bg-white/10`}>
                        {language === 'fi' ? 'Tummanharmaa' : 'Gunmetal'}
                      </SelectItem>
                      <SelectItem value="white" className={`${textClass} hover:bg-white/10`}>
                        {language === 'fi' ? 'Valkoinen' : 'White'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={`${textClass} mb-2 block text-sm`}>
                    {language === 'fi' ? 'Materiaali' : 'Material'}
                  </Label>
                  <Select value={filters.material} onValueChange={(value) => updateFilter('material', value)}>
                    <SelectTrigger className={`${inputBgClass} ${borderClass} ${textClass}`}>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent className={`${selectBgClass} ${borderClass}`}>
                      <SelectItem value="all" className={`${textClass} hover:bg-white/10`}>All</SelectItem>
                      <SelectItem value="alloy" className={`${textClass} hover:bg-white/10`}>
                        {language === 'fi' ? 'Kevytmetalli' : 'Alloy'}
                      </SelectItem>
                      <SelectItem value="steel" className={`${textClass} hover:bg-white/10`}>
                        {language === 'fi' ? 'Teräs' : 'Steel'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sort & Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <SelectItem value="brand_asc" className={`${textClass} hover:bg-white/10`}>
                        {language === 'fi' ? 'Merkki A-Ö' : 'Brand A-Z'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={filters.inStockOnly}
                      onCheckedChange={(checked) => updateFilter('inStockOnly', checked)}
                      className="data-[state=checked]:bg-[#FF6B35]"
                    />
                    <Label className={`${textClass} text-sm`}>
                      {language === 'fi' ? 'Vain varastossa' : 'In Stock Only'}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={filters.boltsIncluded === true}
                      onCheckedChange={(checked) => updateFilter('boltsIncluded', checked ? true : undefined)}
                      className="data-[state=checked]:bg-[#FF6B35]"
                    />
                    <Label className={`${textClass} text-sm`}>
                      {language === 'fi' ? 'Pultit mukana' : 'Bolts Included'}
                    </Label>
                  </div>
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
