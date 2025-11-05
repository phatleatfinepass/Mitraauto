import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Search, Filter } from 'lucide-react';
import { Button } from '../ui/button';

interface TireFiltersProps {
  onFilterChange: (filters: any) => void;
}

export function TireFilters({ onFilterChange }: TireFiltersProps) {
  const { language } = useLanguage();
  const [filters, setFilters] = useState({
    width: '',
    aspectRatio: '',
    diameter: '',
    season: '',
    brand: [],
    runflat: false,
    xl: false,
    studded: false,
    inStockOnly: false,
    sortBy: 'price_asc',
    search: '',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      width: '',
      aspectRatio: '',
      diameter: '',
      season: '',
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

  return (
    <div className="glassmorphic-panel rounded-2xl p-6 border border-white/10 backdrop-blur-xl bg-white/5">
      {/* License Plate Input */}
      <div className="mb-6">
        <Label className="text-white mb-2 block">
          {language === 'fi' ? 'Rekisteritunnus (valinnainen)' : 'License Plate (optional)'}
        </Label>
        <Input
          placeholder={language === 'fi' ? 'ABC-123' : 'ABC-123'}
          className="bg-white/5 border-white/10 text-white placeholder:text-[#B0B8C4]/50 focus:border-[#0B6BFF] focus:ring-[#0B6BFF]/20"
        />
      </div>

      {/* Main Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
        {/* Width */}
        <div>
          <Label className="text-white mb-2 block text-sm">
            {language === 'fi' ? 'Leveys' : 'Width'}
          </Label>
          <Select value={filters.width} onValueChange={(value) => updateFilter('width', value)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent className="bg-[#161A22] border-white/10">
              <SelectItem value="">All</SelectItem>
              {widthOptions.map(w => (
                <SelectItem key={w} value={w} className="text-white hover:bg-white/10">
                  {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Aspect Ratio */}
        <div>
          <Label className="text-white mb-2 block text-sm">
            {language === 'fi' ? 'Korkeus' : 'Aspect'}
          </Label>
          <Select value={filters.aspectRatio} onValueChange={(value) => updateFilter('aspectRatio', value)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent className="bg-[#161A22] border-white/10">
              <SelectItem value="">All</SelectItem>
              {aspectOptions.map(a => (
                <SelectItem key={a} value={a} className="text-white hover:bg-white/10">
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Diameter */}
        <div>
          <Label className="text-white mb-2 block text-sm">
            {language === 'fi' ? 'Halkaisija' : 'Diameter'}
          </Label>
          <Select value={filters.diameter} onValueChange={(value) => updateFilter('diameter', value)}>
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

        {/* Season */}
        <div>
          <Label className="text-white mb-2 block text-sm">
            {language === 'fi' ? 'Kausi' : 'Season'}
          </Label>
          <Select value={filters.season} onValueChange={(value) => updateFilter('season', value)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent className="bg-[#161A22] border-white/10">
              <SelectItem value="" className="text-white hover:bg-white/10">All</SelectItem>
              <SelectItem value="summer" className="text-white hover:bg-white/10">
                {language === 'fi' ? '☀️ Kesä' : '☀️ Summer'}
              </SelectItem>
              <SelectItem value="winter" className="text-white hover:bg-white/10">
                {language === 'fi' ? '❄️ Talvi' : '❄️ Winter'}
              </SelectItem>
              <SelectItem value="all_season" className="text-white hover:bg-white/10">
                {language === 'fi' ? '🔄 Ympärivuotinen' : '🔄 All Season'}
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
              <SelectItem value="wet_grip" className="text-white hover:bg-white/10">
                {language === 'fi' ? 'Märkäpito' : 'Wet Grip'}
              </SelectItem>
              <SelectItem value="noise" className="text-white hover:bg-white/10">
                {language === 'fi' ? 'Melu' : 'Noise'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div>
          <Label className="text-white mb-2 block text-sm">
            {language === 'fi' ? 'Haku' : 'Search'}
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0B8C4]" />
            <Input
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder={language === 'fi' ? 'Malli tai merkki' : 'Model or brand'}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-[#B0B8C4]/50 focus:border-[#0B6BFF] focus:ring-[#0B6BFF]/20"
            />
          </div>
        </div>
      </div>

      {/* Advanced Toggles */}
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
          {/* RunFlat */}
          <div className="flex items-center space-x-2">
            <Switch
              checked={filters.runflat}
              onCheckedChange={(checked) => updateFilter('runflat', checked)}
              className="data-[state=checked]:bg-[#0B6BFF]"
            />
            <Label className="text-white text-sm">RunFlat</Label>
          </div>

          {/* XL */}
          <div className="flex items-center space-x-2">
            <Switch
              checked={filters.xl}
              onCheckedChange={(checked) => updateFilter('xl', checked)}
              className="data-[state=checked]:bg-[#0B6BFF]"
            />
            <Label className="text-white text-sm">XL</Label>
          </div>

          {/* Studded */}
          <div className="flex items-center space-x-2">
            <Switch
              checked={filters.studded}
              onCheckedChange={(checked) => updateFilter('studded', checked)}
              className="data-[state=checked]:bg-[#0B6BFF]"
            />
            <Label className="text-white text-sm">
              {language === 'fi' ? 'Nastarenkaat' : 'Studded'}
            </Label>
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
