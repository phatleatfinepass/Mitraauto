import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Filter } from 'lucide-react';
import { Button } from '../ui/button';

interface RimFiltersProps {
  onFilterChange: (filters: any) => void;
}

export function RimFilters({ onFilterChange }: RimFiltersProps) {
  const { language } = useLanguage();
  const [filters, setFilters] = useState({
    rimDiameter: '',
    rimWidth: '',
    pcd: '',
    etOffset: '',
    cb: '',
    color: '',
    material: '',
    boltsIncluded: undefined,
    inStockOnly: false,
    sortBy: 'price_asc',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      rimDiameter: '',
      rimWidth: '',
      pcd: '',
      etOffset: '',
      cb: '',
      color: '',
      material: '',
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

  return (
    <div className="glassmorphic-panel rounded-2xl p-6 border border-white/10 backdrop-blur-xl bg-white/5">
      {/* Vehicle Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <Label className="text-white mb-2 block text-sm">
            {language === 'fi' ? 'Merkki' : 'Make'}
          </Label>
          <Select>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder={language === 'fi' ? 'Valitse merkki' : 'Select make'} />
            </SelectTrigger>
            <SelectContent className="bg-[#161A22] border-white/10">
              <SelectItem value="audi" className="text-white hover:bg-white/10">Audi</SelectItem>
              <SelectItem value="bmw" className="text-white hover:bg-white/10">BMW</SelectItem>
              <SelectItem value="mercedes" className="text-white hover:bg-white/10">Mercedes-Benz</SelectItem>
              <SelectItem value="volkswagen" className="text-white hover:bg-white/10">Volkswagen</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-white mb-2 block text-sm">
            {language === 'fi' ? 'Malli' : 'Model'}
          </Label>
          <Select>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder={language === 'fi' ? 'Valitse malli' : 'Select model'} />
            </SelectTrigger>
            <SelectContent className="bg-[#161A22] border-white/10">
              <SelectItem value="a4" className="text-white hover:bg-white/10">A4</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-white mb-2 block text-sm">
            {language === 'fi' ? 'Vuosi' : 'Year'}
          </Label>
          <Select>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder={language === 'fi' ? 'Valitse vuosi' : 'Select year'} />
            </SelectTrigger>
            <SelectContent className="bg-[#161A22] border-white/10">
              {Array.from({ length: 25 }, (_, i) => 2025 - i).map(year => (
                <SelectItem key={year} value={year.toString()} className="text-white hover:bg-white/10">
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
        {/* Diameter */}
        <div>
          <Label className="text-white mb-2 block text-sm">
            {language === 'fi' ? 'Halkaisija' : 'Diameter'}
          </Label>
          <Select value={filters.rimDiameter} onValueChange={(value) => updateFilter('rimDiameter', value)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent className="bg-[#161A22] border-white/10">
              <SelectItem value="">All</SelectItem>
              {diameterOptions.map(d => (
                <SelectItem key={d} value={d} className="text-white hover:bg-white/10">
                  {d}"
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Width */}
        <div>
          <Label className="text-white mb-2 block text-sm">
            {language === 'fi' ? 'Leveys' : 'Width'}
          </Label>
          <Select value={filters.rimWidth} onValueChange={(value) => updateFilter('rimWidth', value)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent className="bg-[#161A22] border-white/10">
              <SelectItem value="">All</SelectItem>
              {widthOptions.map(w => (
                <SelectItem key={w} value={w} className="text-white hover:bg-white/10">
                  {w}"
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* PCD */}
        <div>
          <Label className="text-white mb-2 block text-sm">
            PCD
          </Label>
          <Select value={filters.pcd} onValueChange={(value) => updateFilter('pcd', value)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent className="bg-[#161A22] border-white/10">
              <SelectItem value="">All</SelectItem>
              {pcdOptions.map(p => (
                <SelectItem key={p} value={p} className="text-white hover:bg-white/10">
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Material */}
        <div>
          <Label className="text-white mb-2 block text-sm">
            {language === 'fi' ? 'Materiaali' : 'Material'}
          </Label>
          <Select value={filters.material} onValueChange={(value) => updateFilter('material', value)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent className="bg-[#161A22] border-white/10">
              <SelectItem value="" className="text-white hover:bg-white/10">All</SelectItem>
              <SelectItem value="alloy" className="text-white hover:bg-white/10">
                {language === 'fi' ? 'Alumiini' : 'Alloy'}
              </SelectItem>
              <SelectItem value="steel" className="text-white hover:bg-white/10">
                {language === 'fi' ? 'Teräs' : 'Steel'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort */}
        <div>
          <Label className="text-white mb-2 block text-sm">
            {language === 'fi' ? 'Järjestä' : 'Sort By'}
          </Label>
          <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#161A22] border-white/10">
              <SelectItem value="price_asc" className="text-white hover:bg-white/10">
                {language === 'fi' ? 'Hinta ↑' : 'Price ↑'}
              </SelectItem>
              <SelectItem value="price_desc" className="text-white hover:bg-white/10">
                {language === 'fi' ? 'Hinta ↓' : 'Price ↓'}
              </SelectItem>
              <SelectItem value="brand_asc" className="text-white hover:bg-white/10">
                {language === 'fi' ? 'Merkki A–Z' : 'Brand A–Z'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-[#0B6BFF] hover:text-[#0B6BFF]/80 hover:bg-[#0B6BFF]/10"
        >
          <Filter className="w-4 h-4 mr-2" />
          {language === 'fi' ? 'Lisäsuodattimet' : 'Advanced Filters'}
        </Button>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
          {/* ET Offset */}
          <div>
            <Label className="text-white mb-2 block text-sm">
              ET {language === 'fi' ? '(Offset)' : '(Offset)'}
            </Label>
            <Input
              type="number"
              value={filters.etOffset}
              onChange={(e) => updateFilter('etOffset', e.target.value)}
              placeholder="35"
              className="bg-white/5 border-white/10 text-white placeholder:text-[#B0B8C4]/50 focus:border-[#0B6BFF] focus:ring-[#0B6BFF]/20"
            />
          </div>

          {/* CB */}
          <div>
            <Label className="text-white mb-2 block text-sm">
              CB {language === 'fi' ? '(Keskireikä)' : '(Center Bore)'}
            </Label>
            <Input
              type="number"
              value={filters.cb}
              onChange={(e) => updateFilter('cb', e.target.value)}
              placeholder="66.6"
              className="bg-white/5 border-white/10 text-white placeholder:text-[#B0B8C4]/50 focus:border-[#0B6BFF] focus:ring-[#0B6BFF]/20"
            />
          </div>

          {/* Color */}
          <div>
            <Label className="text-white mb-2 block text-sm">
              {language === 'fi' ? 'Väri' : 'Color'}
            </Label>
            <Select value={filters.color} onValueChange={(value) => updateFilter('color', value)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent className="bg-[#161A22] border-white/10">
                <SelectItem value="" className="text-white hover:bg-white/10">All</SelectItem>
                <SelectItem value="silver" className="text-white hover:bg-white/10">Silver</SelectItem>
                <SelectItem value="black" className="text-white hover:bg-white/10">Black</SelectItem>
                <SelectItem value="gunmetal" className="text-white hover:bg-white/10">Gunmetal</SelectItem>
                <SelectItem value="chrome" className="text-white hover:bg-white/10">Chrome</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* In Stock */}
          <div className="flex items-center space-x-2">
            <Switch
              checked={filters.inStockOnly}
              onCheckedChange={(checked) => updateFilter('inStockOnly', checked)}
              className="data-[state=checked]:bg-[#0B6BFF]"
            />
            <Label className="text-white text-sm">
              {language === 'fi' ? 'Varastossa' : 'In Stock'}
            </Label>
          </div>

          {/* Clear Filters */}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-[#B0B8C4] hover:text-white hover:bg-white/10"
          >
            {language === 'fi' ? 'Tyhjennä' : 'Clear All'}
          </Button>
        </div>
      )}
    </div>
  );
}
