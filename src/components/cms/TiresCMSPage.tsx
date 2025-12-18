'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Search, Save, Check, X } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';

type TireRow = {
  variant_id: string;
  brand: string;
  brand_display_name: string;
  model: string;
  size_string: string;
  season: string | null;
  studded: boolean;
  xl_reinforced: boolean;
  price: number | null;
  currency: string | null;
  stock_qty: number | null;
  card_title: string | null;
  subtitle: string | null;
  cms_status: 'Default' | 'Overridden' | 'Hidden';
};

type TireFilters = {
  brand: string;
  model: string;
  size: string;
  season: string;
  studded: string;
};

type TireCMSData = {
  titleOverride: string;
  subtitleOverride: string;
  shortDescription: string;
  longDescription: string;
  heroImageUrl: string;
  galleryUrls: string;
  badges: string;
  seoSlug: string;
  seoTitle: string;
  seoDescription: string;
  hideFromStorefront: boolean;
};

const emptyCmsState: TireCMSData = {
  titleOverride: '',
  subtitleOverride: '',
  shortDescription: '',
  longDescription: '',
  heroImageUrl: '',
  galleryUrls: '',
  badges: '',
  seoSlug: '',
  seoTitle: '',
  seoDescription: '',
  hideFromStorefront: false,
};

export function TiresCMSPage() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [filters, setFilters] = useState<TireFilters>({
    brand: '',
    model: '',
    size: '',
    season: 'all',
    studded: 'all',
  });

  const [tires, setTires] = useState<TireRow[]>([]);
  const [selectedTire, setSelectedTire] = useState<TireRow | null>(null);
  const [cmsData, setCmsData] = useState<TireCMSData>(emptyCmsState);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [listError, setListError] = useState<string | null>(null);
  const [cmsError, setCmsError] = useState<string | null>(null);
  const [hasCmsEntry, setHasCmsEntry] = useState(false);

  const handleFilterChange = (key: keyof TireFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const buildArrayFromCSV = (value: string) => {
    const parts = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    return parts.length ? parts : null;
  };

  const fetchTires = async () => {
    setListError(null);

    let query = supabase
      .from('products_search')
      .select(
        `variant_id, product_type, brand, brand_display_name, model, size_string, season, studded, xl_reinforced, price, currency, stock_qty, card_title, subtitle`
      )
      .eq('product_type', 'tire');

    if (filters.brand) {
      query = query.ilike('brand_display_name', `%${filters.brand}%`);
    }

    if (filters.model) {
      query = query.ilike('model', `%${filters.model}%`);
    }

    if (filters.size) {
      query = query.ilike('size_string', `%${filters.size}%`);
    }

    if (filters.season !== 'all') {
      query = query.eq('season', filters.season);
    }

    if (filters.studded === 'studded') {
      query = query.eq('studded', true);
    } else if (filters.studded === 'non-studded') {
      query = query.eq('studded', false);
    }

    const { data, error } = await query
      .order('brand_display_name', { ascending: true })
      .order('model', { ascending: true })
      .order('size_string', { ascending: true });

    if (error) {
      setListError('Failed to load tires: ' + error.message);
      setTires([]);
      setSelectedTire(null);
      return;
    }

    const variantIds = (data ?? []).map((item) => item.variant_id);
    const cmsStatuses: Record<string, 'Default' | 'Overridden' | 'Hidden'> = {};

    if (variantIds.length > 0) {
      const { data: cmsRows, error: cmsFetchError } = await supabase
        .from('product_cms')
        .select('variant_id, is_hidden')
        .in('variant_id', variantIds);

      if (cmsFetchError) {
        setListError('Failed to load CMS statuses: ' + cmsFetchError.message);
      } else if (cmsRows) {
        cmsRows.forEach((row) => {
          cmsStatuses[row.variant_id] = row.is_hidden ? 'Hidden' : 'Overridden';
        });
      }
    }

    const mappedTires: TireRow[] = (data ?? []).map((item) => ({
      variant_id: item.variant_id,
      brand: item.brand ?? '',
      brand_display_name: item.brand_display_name ?? item.brand ?? '',
      model: item.model ?? '',
      size_string: item.size_string ?? '',
      season: item.season,
      studded: Boolean(item.studded),
      xl_reinforced: Boolean(item.xl_reinforced),
      price: item.price,
      currency: item.currency,
      stock_qty: item.stock_qty,
      card_title: item.card_title ?? null,
      subtitle: item.subtitle ?? null,
      cms_status: cmsStatuses[item.variant_id] ?? 'Default',
    }));

    setTires(mappedTires);

    if (selectedTire && !mappedTires.find((tire) => tire.variant_id === selectedTire.variant_id)) {
      setSelectedTire(null);
      setCmsData(emptyCmsState);
      setHasCmsEntry(false);
    }
  };

    useEffect(() => {
    fetchTires();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = () => {
    fetchTires();
  };

  const loadCmsData = async (variantId: string) => {
    setCmsError(null);
    setCmsData(emptyCmsState);
    setHasCmsEntry(false);

    const { data, error } = await supabase
      .from('product_cms')
      .select('*')
      .eq('variant_id', variantId)
      .maybeSingle();

    if (error) {
      setCmsError('Failed to load CMS data: ' + error.message);
      return;
    }

    if (data) {
      setHasCmsEntry(true);
      setCmsData({
        titleOverride: data.title ?? '',
        subtitleOverride: data.subtitle ?? '',
        shortDescription: data.short_description ?? '',
        longDescription: data.long_description ?? '',
        heroImageUrl: data.hero_image_url ?? '',
        galleryUrls: Array.isArray(data.gallery) ? data.gallery.join(', ') : '',
        badges: Array.isArray(data.badges) ? data.badges.join(', ') : '',
        seoSlug: data.seo_slug ?? '',
        seoTitle: data.seo_title ?? '',
        seoDescription: data.seo_description ?? '',
        hideFromStorefront: Boolean(data.is_hidden),
      });
    }
  };

  const handleSelectTire = (tire: TireRow) => {
    setSelectedTire(tire);
    setSaveStatus('idle');
    loadCmsData(tire.variant_id);
  };

  const handleCmsDataChange = (key: keyof TireCMSData, value: string | boolean) => {
    setCmsData((prev) => ({ ...prev, [key]: value }));
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    if (!selectedTire) return;

    setSaveStatus('idle');
    setCmsError(null);

    const gallery = buildArrayFromCSV(cmsData.galleryUrls);
    const badges = buildArrayFromCSV(cmsData.badges);

    const payload = {
      variant_id: selectedTire.variant_id,
      title: cmsData.titleOverride || null,
      subtitle: cmsData.subtitleOverride || null,
      short_description: cmsData.shortDescription || null,
      long_description: cmsData.longDescription || null,
      hero_image_url: cmsData.heroImageUrl || null,
      gallery,
      badges,
      seo_slug: cmsData.seoSlug || null,
      seo_title: cmsData.seoTitle || null,
      seo_description: cmsData.seoDescription || null,
      is_hidden: cmsData.hideFromStorefront,
    };

    const { error } = hasCmsEntry
      ? await supabase.from('product_cms').update(payload).eq('variant_id', selectedTire.variant_id)
      : await supabase.from('product_cms').insert(payload);

    if (error) {
      setSaveStatus('error');
      setCmsError('Failed to save CMS data: ' + error.message);
      return;
    }

    setSaveStatus('success');
    setHasCmsEntry(true);
    await Promise.all([loadCmsData(selectedTire.variant_id), fetchTires()]);
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0B0D10]' : 'bg-gray-50'}`}>
      {/* Page Header */}
      <div className={`border-b ${isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'}`}>
        <div className="px-8 py-6">
          <h1 className={`text-3xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
            CMS / Product / Tires
          </h1>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage tire data, override display text, images, and visibility
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* LEFT COLUMN: Tire List + Filters */}
        <div className={`w-1/2 border-r ${isDark ? 'border-white/10' : 'border-gray-200'} flex flex-col`}>
          {/* Filters Panel */}
          <div className={`p-6 border-b ${isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'}`}>
            <h2 className={`mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Filters
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Brand</Label>
                <Input
                  placeholder="e.g. Nokian"
                  value={filters.brand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  className={isDark ? 'bg-white/5 border-white/10 text-white' : ''}
                />
              </div>
              
              <div>
                <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Model</Label>
                <Input
                  placeholder="e.g. Hakkapeliitta"
                  value={filters.model}
                  onChange={(e) => handleFilterChange('model', e.target.value)}
                  className={isDark ? 'bg-white/5 border-white/10 text-white' : ''}
                />
              </div>
              
              <div>
                <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Size</Label>
                <Input
                  placeholder="e.g. 205/55R16"
                  value={filters.size}
                  onChange={(e) => handleFilterChange('size', e.target.value)}
                  className={isDark ? 'bg-white/5 border-white/10 text-white' : ''}
                />
              </div>
              
              <div>
                <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Season</Label>
                <select
                  value={filters.season}
                  onChange={(e) => handleFilterChange('season', e.target.value)}
                  className={`w-full h-10 px-3 rounded-md border ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All</option>
                  <option value="summer">Summer</option>
                  <option value="winter">Winter</option>
                  <option value="all-season">All-season</option>
                </select>
              </div>
              
              <div>
                <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Studded</Label>
                <select
                  value={filters.studded}
                  onChange={(e) => handleFilterChange('studded', e.target.value)}
                  className={`w-full h-10 px-3 rounded-md border ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All</option>
                  <option value="studded">Studded</option>
                  <option value="non-studded">Non-studded</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <Button onClick={handleApplyFilters} className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90">
                  <Search className="w-4 h-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </div>
            
            {listError && (
              <p className="text-sm text-red-500 mb-2">{listError}</p>
            )}

            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              These filters work on normalized tire data from products_search.
            </p>
          </div>

          {/* Tire Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className={`sticky top-0 z-10 ${isDark ? 'bg-[#1a1f2e]' : 'bg-gray-100'}`}>
                <tr className={`text-xs uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <th className="px-4 py-3 text-left">Brand</th>
                  <th className="px-4 py-3 text-left">Model</th>
                  <th className="px-4 py-3 text-left">Size</th>
                  <th className="px-4 py-3 text-left">Season</th>
                  <th className="px-4 py-3 text-left">Studded</th>
                  <th className="px-4 py-3 text-left">XL</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-left">Stock</th>
                  <th className="px-4 py-3 text-left">CMS Status</th>
                </tr>
              </thead>
              <tbody>
                {tires.length === 0 ? (
                  <tr>
                    <td colSpan={9} className={`px-4 py-8 text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      No tires found with current filters.
                    </td>
                  </tr>
                ) : (
                  tires.map((tire) => (
                    <tr
                      key={tire.variant_id}
                      onClick={() => handleSelectTire(tire)}
                      className={`cursor-pointer border-b transition-colors ${
                        selectedTire?.variant_id === tire.variant_id
                          ? isDark ? 'bg-blue-500/20' : 'bg-blue-50'
                          : isDark
                            ? 'border-white/5 hover:bg-white/5'
                            : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{tire.brand_display_name}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{tire.model}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{tire.size_string}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{tire.season ?? '-'}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {tire.studded ? 'Yes' : 'No'}
                      </td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {tire.xl_reinforced ? 'Yes' : 'No'}
                      </td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {tire.price ? `${tire.currency ?? '€'}${tire.price.toFixed(2)}` : '-'}
                      </td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {tire.stock_qty ?? 0} pcs
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          tire.cms_status === 'Overridden'
                            ? 'bg-blue-500/20 text-blue-400'
                            : tire.cms_status === 'Hidden'
                            ? 'bg-red-500/20 text-red-400'
                            : isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {tire.cms_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: Tire CMS Editor */}
        <div className={`w-1/2 flex flex-col ${isDark ? 'bg-[#0B0D10]' : 'bg-gray-50'}`}>
          <div className="flex-1 overflow-auto p-6">
            <h2 className={`text-xl mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Tire CMS Overrides
            </h2>

            {cmsError && (
              <div className="mb-4 text-sm text-red-500">{cmsError}</div>
            )}

            {!selectedTire ? (
              <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Select a tire from the table to edit CMS data.
              </div>
            ) : (
              <>
                {/* Read-only Info Box */}
                <Card className={`p-4 mb-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>Brand:</span>
                      <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedTire.brand_display_name}</span>
                    </div>
                    <div>
                      <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>Model:</span>
                      <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedTire.model}</span>
                    </div>
                    <div>
                      <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>Size:</span>
                      <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedTire.size_string}</span>
                    </div>
                    <div>
                      <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>Season:</span>
                      <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedTire.season ?? '-'}</span>
                    </div>
                    <div>
                      <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>Studded:</span>
                      <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedTire.studded ? 'Yes' : 'No'}</span>
                    </div>
                    <div>
                      <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>XL:</span>
                      <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedTire.xl_reinforced ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>Current title:</span>
                      <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedTire.card_title || `${selectedTire.brand_display_name} ${selectedTire.model}`}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>Current subtitle:</span>
                      <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedTire.subtitle || selectedTire.size_string}</span>
                    </div>
                  </div>
                </Card>

                {/* Editable Form */}
                <div className="space-y-6">
                  {/* Basic Text */}
                  <div>
                    <h3 className={`mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Basic Text</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Title Override</Label>
                        <Input
                          placeholder="If empty, brand + model will be used."
                          value={cmsData.titleOverride}
                          onChange={(e) => handleCmsDataChange('titleOverride', e.target.value)}
                          className={isDark ? 'bg-white/5 border-white/10 text-white' : ''}
                        />
                      </div>
                      <div>
                        <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Subtitle Override</Label>
                        <Input
                          placeholder="Custom subtitle..."
                          value={cmsData.subtitleOverride}
                          onChange={(e) => handleCmsDataChange('subtitleOverride', e.target.value)}
                          className={isDark ? 'bg-white/5 border-white/10 text-white' : ''}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Descriptions */}
                  <div>
                    <h3 className={`mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Descriptions</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Short Description</Label>
                        <textarea
                          rows={4}
                          placeholder="Brief description for cards..."
                          value={cmsData.shortDescription}
                          onChange={(e) => handleCmsDataChange('shortDescription', e.target.value)}
                          className={`w-full px-3 py-2 rounded-md border ${
                            isDark
                              ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>
                      <div>
                        <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Long Description</Label>
                        <textarea
                          rows={4}
                          placeholder="Detailed description for product pages..."
                          value={cmsData.longDescription}
                          onChange={(e) => handleCmsDataChange('longDescription', e.target.value)}
                          className={`w-full px-3 py-2 rounded-md border ${
                            isDark
                              ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Images */}
                  <div>
                    <h3 className={`mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Images</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Hero Image URL</Label>
                        <Input
                          placeholder="https://..."
                          value={cmsData.heroImageUrl}
                          onChange={(e) => handleCmsDataChange('heroImageUrl', e.target.value)}
                          className={isDark ? 'bg-white/5 border-white/10 text-white' : ''}
                        />
                      </div>
                      <div>
                        <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Gallery URLs (comma separated)</Label>
                        <Input
                          placeholder="https://image1.jpg, https://image2.jpg"
                          value={cmsData.galleryUrls}
                          onChange={(e) => handleCmsDataChange('galleryUrls', e.target.value)}
                          className={isDark ? 'bg-white/5 border-white/10 text-white' : ''}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Badges / Tags */}
                  <div>
                    <h3 className={`mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Badges / Tags</h3>
                    <div>
                      <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Badges (comma separated tags)</Label>
                      <Input
                        placeholder="Premium, Winter, XL, EV"
                        value={cmsData.badges}
                        onChange={(e) => handleCmsDataChange('badges', e.target.value)}
                        className={isDark ? 'bg-white/5 border-white/10 text-white' : ''}
                      />
                    </div>
                  </div>

                  {/* SEO */}
                  <div>
                    <h3 className={`mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>SEO</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>SEO Slug</Label>
                        <Input
                          placeholder="tire-slug"
                          value={cmsData.seoSlug}
                          onChange={(e) => handleCmsDataChange('seoSlug', e.target.value)}
                          className={isDark ? 'bg-white/5 border-white/10 text-white' : ''}
                        />
                      </div>
                      <div>
                        <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>SEO Title</Label>
                        <Input
                          placeholder="SEO title..."
                          value={cmsData.seoTitle}
                          onChange={(e) => handleCmsDataChange('seoTitle', e.target.value)}
                          className={isDark ? 'bg-white/5 border-white/10 text-white' : ''}
                        />
                      </div>
                      <div>
                        <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>SEO Description</Label>
                        <Input
                          placeholder="SEO description..."
                          value={cmsData.seoDescription}
                          onChange={(e) => handleCmsDataChange('seoDescription', e.target.value)}
                          className={isDark ? 'bg-white/5 border-white/10 text-white' : ''}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Visibility */}
                  <div>
                    <h3 className={`mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Visibility</h3>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="hideFromStorefront"
                        checked={cmsData.hideFromStorefront}
                        onCheckedChange={(checked) => handleCmsDataChange('hideFromStorefront', checked as boolean)}
                      />
                      <div>
                        <Label
                          htmlFor="hideFromStorefront"
                          className={`cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          Hide this tire from storefront
                        </Label>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          If checked, this tire will not appear in search or listing pages.
                          Hiding is applied via the CMS layer.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Actions */}
          {selectedTire && (
            <div className={`p-6 border-t ${isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleSave}
                  className="bg-[#FF6B35] hover:bg-[#FF6B35]/90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                
                {saveStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-500">
                    <Check className="w-4 h-4" />
                    <span className="text-sm">Changes saved</span>
                  </div>
                )}
                
                {saveStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-500">
                    <X className="w-4 h-4" />
                    <span className="text-sm">Failed to save changes</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
