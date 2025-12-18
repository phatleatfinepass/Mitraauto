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

type RimRow = {
  variant_id: string;
  brand: string;
  brand_display_name: string;
  model: string;
  size_string: string;
  width_in: number | null;
  rim_diameter_in: number | null;
  bolt_pattern: string | null;
  et_offset_mm: number | null;
  color: string | null;
  finish: string | null;
  price: number | null;
  currency: string | null;
  stock_qty: number | null;
  card_title: string | null;
  subtitle: string | null;
  cms_status: 'Default' | 'Overridden' | 'Hidden';
};

type RimFilters = {
  brand: string;
  model: string;
  size: string;
  boltPattern: string;
  diameter: string;
};

type RimCMSData = {
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

const emptyCmsState: RimCMSData = {
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

export function RimsCMSPage() {
  const { theme } = useTheme();
  const { language } = useLanguage();

  const [filters, setFilters] = useState<RimFilters>({
    brand: '',
    model: '',
    size: '',
    boltPattern: '',
    diameter: 'all',
  });

  const [rims, setRims] = useState<RimRow[]>([]);
  const [selectedRim, setSelectedRim] = useState<RimRow | null>(null);
  const [cmsData, setCmsData] = useState<RimCMSData>(emptyCmsState);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [listError, setListError] = useState<string | null>(null);
  const [cmsError, setCmsError] = useState<string | null>(null);
  const [hasCmsEntry, setHasCmsEntry] = useState(false);

  const handleFilterChange = (key: keyof RimFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const buildArrayFromCSV = (value: string) => {
    const parts = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    return parts.length ? parts : null;
  };

    const fetchRims = async () => {
    setListError(null);

    let query = supabase
      .from('products_search')
      .select(
        `variant_id, product_type, brand, brand_display_name, model, size_string, width_in, rim_diameter_in, et_offset_mm, bolt_pattern, color, finish, price, currency, stock_qty, card_title, subtitle`
      )
      .eq('product_type', 'rim');

    if (filters.brand) {
      query = query.ilike('brand_display_name', `%${filters.brand}%`);
    }

    if (filters.model) {
      query = query.ilike('model', `%${filters.model}%`);
    }

    if (filters.size) {
      query = query.ilike('size_string', `%${filters.size}%`);
    }

    if (filters.boltPattern) {
      query = query.ilike('bolt_pattern', `%${filters.boltPattern}%`);
    }

    if (filters.diameter !== 'all') {
      query = query.eq('rim_diameter_in', Number(filters.diameter));
    }

    const { data, error } = await query
      .order('brand_display_name', { ascending: true })
      .order('model', { ascending: true })
      .order('size_string', { ascending: true });

    if (error) {
      setListError('Failed to load rims: ' + error.message);
      setRims([]);
      setSelectedRim(null);
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

    const mappedRims: RimRow[] = (data ?? []).map((item) => ({
      variant_id: item.variant_id,
      brand: item.brand ?? '',
      brand_display_name: item.brand_display_name ?? item.brand ?? '',
      model: item.model ?? '',
      size_string: item.size_string ?? '',
      width_in: item.width_in,
      rim_diameter_in: item.rim_diameter_in,
      bolt_pattern: item.bolt_pattern ?? null,
      et_offset_mm: item.et_offset_mm ?? null,
      color: item.color ?? null,
      finish: item.finish ?? null,
      price: item.price,
      currency: item.currency,
      stock_qty: item.stock_qty,
      card_title: item.card_title ?? null,
      subtitle: item.subtitle ?? null,
      cms_status: cmsStatuses[item.variant_id] ?? 'Default',
    }));

    setRims(mappedRims);

    if (selectedRim && !mappedRims.find((rim) => rim.variant_id === selectedRim.variant_id)) {
      setSelectedRim(null);
      setCmsData(emptyCmsState);
      setHasCmsEntry(false);
    }
  };

  useEffect(() => {
    fetchRims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = () => {
    fetchRims();
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

  const handleSelectRim = (rim: RimRow) => {
    setSelectedRim(rim);
    setSaveStatus('idle');
    loadCmsData(rim.variant_id);
  };

  const handleCmsDataChange = (key: keyof RimCMSData, value: string | boolean) => {
    setCmsData((prev) => ({ ...prev, [key]: value }));
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    if (!selectedRim) return;

    setSaveStatus('idle');
    setCmsError(null);

    const gallery = buildArrayFromCSV(cmsData.galleryUrls);
    const badges = buildArrayFromCSV(cmsData.badges);

    const payload = {
      variant_id: selectedRim.variant_id,
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
      ? await supabase.from('product_cms').update(payload).eq('variant_id', selectedRim.variant_id)
      : await supabase.from('product_cms').insert(payload);

    if (error) {
      setSaveStatus('error');
      setCmsError('Failed to save CMS data: ' + error.message);
      return;
    }

    setSaveStatus('success');
    setHasCmsEntry(true);
    await Promise.all([loadCmsData(selectedRim.variant_id), fetchRims()]);
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0B0D10]' : 'bg-gray-50'}`}>
      {/* Page Header */}
      <div className={`border-b ${isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'}`}>
        <div className="px-8 py-6">
          <h1 className={`text-3xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
            CMS / Product / Rims
          </h1>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage rim data, override display text, images, and visibility
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* LEFT COLUMN: Rim List + Filters */}
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
                  placeholder="e.g. BBS"
                  value={filters.brand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  className={isDark ? 'bg-white/5 border-white/10 text-white' : ''}
                />
              </div>
              
              <div>
                <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Model</Label>
                <Input
                  placeholder="e.g. CH-R"
                  value={filters.model}
                  onChange={(e) => handleFilterChange('model', e.target.value)}
                  className={isDark ? 'bg-white/5 border-white/10 text-white' : ''}
                />
              </div>
              
              <div>
                <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Size</Label>
                <Input
                  placeholder="e.g. 8x18"
                  value={filters.size}
                  onChange={(e) => handleFilterChange('size', e.target.value)}
                  className={isDark ? 'bg-white/5 border-white/10 text-white' : ''}
                />
              </div>
              
              <div>
                <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Bolt Pattern</Label>
                <Input
                  placeholder="e.g. 5x112"
                  value={filters.boltPattern}
                  onChange={(e) => handleFilterChange('boltPattern', e.target.value)}
                  className={isDark ? 'bg-white/5 border-white/10 text-white' : ''}
                />
              </div>
              
              <div>
                <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Diameter</Label>
                <select
                  value={filters.diameter}
                  onChange={(e) => handleFilterChange('diameter', e.target.value)}
                  className={`w-full h-10 px-3 rounded-md border ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All</option>
                  {[14, 15, 16, 17, 18, 19, 20, 21, 22].map((d) => (
                    <option key={d} value={d.toString()}>{d}"</option>
                  ))}
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
              Filters work on normalized rim data from products_search.
            </p>
          </div>

          {/* Rim Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className={`sticky top-0 z-10 ${isDark ? 'bg-[#1a1f2e]' : 'bg-gray-100'}`}>
                <tr className={`text-xs uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <th className="px-4 py-3 text-left">Brand</th>
                  <th className="px-4 py-3 text-left">Model</th>
                  <th className="px-4 py-3 text-left">Size</th>
                  <th className="px-4 py-3 text-left">Width</th>
                  <th className="px-4 py-3 text-left">Diameter</th>
                  <th className="px-4 py-3 text-left">Bolt Pattern</th>
                  <th className="px-4 py-3 text-left">Offset</th>
                  <th className="px-4 py-3 text-left">Color/Finish</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-left">Stock</th>
                  <th className="px-4 py-3 text-left">CMS Status</th>
                </tr>
              </thead>
              <tbody>
                {rims.length === 0 ? (
                  <tr>
                    <td colSpan={11} className={`px-4 py-8 text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      No rims found with current filters.
                    </td>
                  </tr>
                ) : (
                  rims.map((rim) => (
                    <tr
                      key={rim.variant_id}
                      onClick={() => handleSelectRim(rim)}
                      className={`cursor-pointer border-b transition-colors ${
                        selectedRim?.variant_id === rim.variant_id
                          ? isDark ? 'bg-blue-500/20' : 'bg-blue-50'
                          : isDark
                            ? 'border-white/5 hover:bg-white/5'
                            : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{rim.brand_display_name}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{rim.model}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{rim.size_string}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{rim.width_in ?? '-'}"</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{rim.rim_diameter_in ?? '-'}"</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{rim.bolt_pattern ?? '-'}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{rim.et_offset_mm !== null ? `ET${rim.et_offset_mm}` : '-'}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {[rim.color, rim.finish].filter(Boolean).join(' / ') || '-'}
                      </td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {rim.price ? `${rim.currency ?? '€'}${rim.price.toFixed(2)}` : '-'}
                      </td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {rim.stock_qty ?? 0} pcs
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          rim.cms_status === 'Overridden'
                            ? 'bg-blue-500/20 text-blue-400'
                            : rim.cms_status === 'Hidden'
                            ? 'bg-red-500/20 text-red-400'
                            : isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {rim.cms_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: Rim CMS Editor */}
        <div className={`w-1/2 flex flex-col ${isDark ? 'bg-[#0B0D10]' : 'bg-gray-50'}`}>
          <div className="flex-1 overflow-auto p-6">
            <h2 className={`text-xl mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Rim CMS Overrides
            </h2>

            {cmsError && (
              <div className="mb-4 text-sm text-red-500">{cmsError}</div>
            )}

            {!selectedRim ? (
              <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Select a rim from the table to edit CMS data.
              </div>
            ) : (
              <>
                {/* Read-only Info Box */}
                <Card className={`p-4 mb-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>Brand:</span>
                      <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedRim.brand_display_name}</span>
                    </div>
                    <div>
                      <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>Model:</span>
                      <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedRim.model}</span>
                    </div>
                    <div>
                      <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>Size:</span>
                      <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedRim.size_string}</span>
                    </div>
                    <div>
                      <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>Width / Diameter:</span>
                      <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedRim.width_in ?? '-'}" / {selectedRim.rim_diameter_in ?? '-'}"
                      </span>
                    </div>
                    <div>
                      <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>Bolt Pattern:</span>
                      <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedRim.bolt_pattern ?? '-'}</span>
                    </div>
                    <div>
                      <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>Offset:</span>
                      <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedRim.et_offset_mm !== null ? `ET${selectedRim.et_offset_mm}` : '-'}
                      </span>
                    </div>
                    <div>
                      <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>Color / Finish:</span>
                      <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {[selectedRim.color, selectedRim.finish].filter(Boolean).join(' / ') || '-'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>Current title:</span>
                      <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedRim.card_title || `${selectedRim.brand_display_name} ${selectedRim.model}`}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>Current subtitle:</span>
                      <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedRim.subtitle || selectedRim.size_string}</span>
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
                        placeholder="Premium, Flow-formed, Matt black"
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
                          placeholder="rim-slug"
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
                          Hide this rim from storefront
                        </Label>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          If checked, this rim will not appear in search or listing pages.
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
          {selectedRim && (
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
