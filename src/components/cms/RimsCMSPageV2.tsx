import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';
import { supabase } from '../../utils/supabase/client';
import { X, Save, AlertCircle, RotateCcw } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { RimsCmsToolbar } from './RimsCmsToolbar';
import { RimsCmsPagination } from './RimsCmsPagination';
import { RimsCmsTable } from './RimsCmsTable';
import {
  calculateLinePricing,
  getPricingRulesFromSpecOverrides,
  isFixedBundleTotalCompatible,
  setPricingRulesToSpecOverrides,
  type BundlePricingMode,
  type ProductPricingRules,
} from '../../utils/pricing';

const VAT_RATE = 0.255;
const VAT_MULTIPLIER = 1 + VAT_RATE;

interface RimVariant {
  id: string;
  ean: string | null;
  brand: string;
  model: string;
  width: number | null;
  diameter: number | null;
  pcd: string | null;
  et: number | null;
  color: string | null;
  price_eur: number | null;
}

interface ProductCMS {
  variant_id: string;
  title: string | null;
  subtitle: string | null;
  short_description: string | null;
  long_description: string | null;
  hero_image_url: string | null;
  gallery: string[] | null;
  seo_slug: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_hidden: boolean;
  spec_overrides: Record<string, any>;
}

interface RimRow extends RimVariant {
  cms_data?: ProductCMS | null;
}

export function RimsCMSPageV2() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme === 'dark';
  const pageSize = 100;

  const [rims, setRims] = useState<RimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRim, setSelectedRim] = useState<RimRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Edit state
  const [editData, setEditData] = useState<Partial<ProductCMS>>({});

  const toPriceWithVat = (priceWithoutVat: number | null | undefined) => {
    if (priceWithoutVat === null || priceWithoutVat === undefined) return null;
    const numeric = Number(priceWithoutVat);
    if (!Number.isFinite(numeric)) return null;
    return numeric * VAT_MULTIPLIER;
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchTerm(searchTerm), 250);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchRims();
  }, [currentPage, debouncedSearchTerm]);

  const fetchRims = async () => {
    setLoading(true);
    setError(null);

    try {
      const trimmedSearch = debouncedSearchTerm.trim();
      let productsQuery = supabase
        .from('products_search')
        .select(
          'variant_id, ean, derived_ean, brand, brand_display_name, model, width_in, rim_diameter_in, et_offset_mm, bolt_pattern, color, final_price_eur, price',
          { count: 'estimated' },
        )
        .eq('product_type', 'rim')
        .order('brand', { ascending: true })
        .order('model', { ascending: true })
        .order('variant_id', { ascending: true })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (trimmedSearch) {
        productsQuery = productsQuery.or([
          `brand.ilike.%${trimmedSearch}%`,
          `brand_display_name.ilike.%${trimmedSearch}%`,
          `model.ilike.%${trimmedSearch}%`,
          `ean.ilike.%${trimmedSearch}%`,
          `derived_ean.ilike.%${trimmedSearch}%`,
          `color.ilike.%${trimmedSearch}%`,
        ].join(','));
      }

      const { data: productRows, error: productsError, count } = await productsQuery;

      if (productsError) throw productsError;

      const resolvedVariants: RimVariant[] = (productRows ?? []).map((variant: any) => ({
        id: variant.variant_id,
        ean: variant.ean ?? variant.derived_ean ?? null,
        brand: variant.brand_display_name || variant.brand || 'Unknown',
        model: variant.model || '',
        width: variant.width_in !== null && variant.width_in !== undefined ? Number(variant.width_in) : null,
        diameter:
          variant.rim_diameter_in !== null && variant.rim_diameter_in !== undefined
            ? Number(variant.rim_diameter_in)
            : null,
        pcd: variant.bolt_pattern ?? null,
        et: variant.et_offset_mm !== null && variant.et_offset_mm !== undefined ? Number(variant.et_offset_mm) : null,
        color: variant.color ?? null,
        price_eur:
          variant.final_price_eur !== null && variant.final_price_eur !== undefined
            ? Number(variant.final_price_eur)
            : (variant.price !== null && variant.price !== undefined ? Number(variant.price) : null),
      }));

      setTotalCount(count ?? resolvedVariants.length);

      if (!resolvedVariants || resolvedVariants.length === 0) {
        setRims([]);
        return;
      }

      // Fetch CMS + EAN data for these variants
      const variantIds = resolvedVariants.map(v => v.id);
      const chunkSize = 200;
      const cmsRows: any[] = [];

      for (let i = 0; i < variantIds.length; i += chunkSize) {
        const idChunk = variantIds.slice(i, i + chunkSize);
        const { data: cmsBatch, error: cmsError } = await supabase
          .from('product_cms')
          .select('*')
          .in('variant_id', idChunk);

        if (cmsError) throw cmsError;
        if (cmsBatch?.length) cmsRows.push(...cmsBatch);
      }

      // Merge data
      const cmsMap = new Map(cmsRows.map((c: any) => [c.variant_id, c]));
      const merged = resolvedVariants.map(v => ({
        ...v,
        cms_data: cmsMap.get(v.id) || null
      }));

      setRims(merged);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const handleEdit = (rim: RimRow) => {
    setSelectedRim(rim);
    
    // Initialize edit data
    const cms = rim.cms_data;
    setEditData({
      variant_id: rim.id,
      title: cms?.title ?? '',
      subtitle: cms?.subtitle ?? '',
      short_description: cms?.short_description ?? '',
      long_description: cms?.long_description ?? '',
      hero_image_url: cms?.hero_image_url ?? null,
      gallery: cms?.gallery ?? [],
      seo_slug: cms?.seo_slug ?? '',
      seo_title: cms?.seo_title ?? '',
      seo_description: cms?.seo_description ?? '',
      is_hidden: cms?.is_hidden ?? false,
      spec_overrides: cms?.spec_overrides ?? {},
    });
    
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedRim(null);
    setEditData({});
    setSaveError(null);
  };

  const patchLocalCmsData = (variantId: string, cmsPatch: Record<string, any> | null) => {
    setRims((prev) =>
      prev.map((rim) => {
        if (rim.id !== variantId) return rim;
        if (cmsPatch === null) {
          return { ...rim, cms_data: null };
        }

        return {
          ...rim,
          cms_data: {
            ...(rim.cms_data ?? { variant_id: rim.id }),
            ...cmsPatch,
          } as any,
        };
      })
    );
  };

  const getBundlePricing = (): ProductPricingRules | null =>
    getPricingRulesFromSpecOverrides(editData.spec_overrides);

  const getBundleTier = (qty: 2 | 4) =>
    qty === 2 ? (getBundlePricing()?.qty2 ?? null) : (getBundlePricing()?.qty4 ?? null);

  const setBundleTier = (qty: 2 | 4, tier: { mode?: BundlePricingMode; percent_off?: number | null; fixed_total_eur?: number | null }) => {
    setEditData((prev) => {
      const currentPricing = getPricingRulesFromSpecOverrides(prev.spec_overrides) ?? { qty2: null, qty4: null };
      const key = qty === 2 ? 'qty2' : 'qty4';
      const existingTier = currentPricing[key] ?? { mode: 'none' as BundlePricingMode, percent_off: null, fixed_total_eur: null };
      const mergedTier = {
        ...existingTier,
        ...tier,
      };
      const nextPricing: ProductPricingRules = {
        qty2: key === 'qty2' ? mergedTier : currentPricing.qty2,
        qty4: key === 'qty4' ? mergedTier : currentPricing.qty4,
      };

      return {
        ...prev,
        spec_overrides: setPricingRulesToSpecOverrides(prev.spec_overrides, nextPricing),
      };
    });
  };

  const clearBundlePricing = () => {
    setEditData((prev) => ({
      ...prev,
      spec_overrides: setPricingRulesToSpecOverrides(prev.spec_overrides, null),
    }));
  };

  const handleSave = async () => {
    if (!selectedRim) return;

    setSaving(true);
    setSaveError(null);

    try {
      const specOverrides = editData.spec_overrides ?? selectedRim.cms_data?.spec_overrides ?? {};
      const pricingRules = getPricingRulesFromSpecOverrides(specOverrides);
      if (
        pricingRules?.qty2?.mode === 'fixed_total' &&
        !isFixedBundleTotalCompatible(pricingRules.qty2.fixed_total_eur, 2)
      ) {
        throw new Error(
          language === 'fi'
            ? '2 kpl kiinteä pakettihinta pitää jakautua tasan kahdelle tuotteelle (sentteihin asti).'
            : 'Fixed total for 2 items must be divisible evenly across 2 units (in cents).'
        );
      }
      if (
        pricingRules?.qty4?.mode === 'fixed_total' &&
        !isFixedBundleTotalCompatible(pricingRules.qty4.fixed_total_eur, 4)
      ) {
        throw new Error(
          language === 'fi'
            ? '4 kpl kiinteä pakettihinta pitää jakautua tasan neljälle tuotteelle (sentteihin asti).'
            : 'Fixed total for 4 items must be divisible evenly across 4 units (in cents).'
        );
      }

      const payload: any = {
        variant_id: selectedRim.id,
        title: editData.title?.trim() || null,
        subtitle: editData.subtitle?.trim() || null,
        short_description: editData.short_description?.trim() || null,
        long_description: editData.long_description?.trim() || null,
        hero_image_url: editData.hero_image_url || null,
        gallery: editData.gallery || [],
        seo_slug: editData.seo_slug?.trim() || null,
        seo_title: editData.seo_title?.trim() || null,
        seo_description: editData.seo_description?.trim() || null,
        is_hidden: editData.is_hidden ?? false,
        spec_overrides: specOverrides,
      };

      // Upsert to product_cms
      const { error } = await supabase
        .from('product_cms')
        .upsert(payload, { onConflict: 'variant_id' });

      if (error) throw error;

      patchLocalCmsData(selectedRim.id, payload);
      handleCloseDrawer();
    } catch (err: any) {
      console.error('Save error:', err);
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (rim: RimRow) => {
    const newHiddenState = !rim.cms_data?.is_hidden;

    try {
      const { error } = await supabase
        .from('product_cms')
        .upsert({
          variant_id: rim.id,
          is_hidden: newHiddenState,
          spec_overrides: rim.cms_data?.spec_overrides ?? {},
        }, { onConflict: 'variant_id' });

      if (error) throw error;

      patchLocalCmsData(rim.id, {
        variant_id: rim.id,
        is_hidden: newHiddenState,
        spec_overrides: rim.cms_data?.spec_overrides ?? {},
      });
    } catch (err: any) {
      console.error('Toggle visibility error:', err);
      setError(err.message);
    }
  };

  const handleResetCms = async () => {
    if (!selectedRim) return;

    setSaving(true);
    setSaveError(null);

    try {
      const { error } = await supabase
        .from('product_cms')
        .delete()
        .eq('variant_id', selectedRim.id);

      if (error) throw error;

      patchLocalCmsData(selectedRim.id, null);
      handleCloseDrawer();
    } catch (err: any) {
      console.error('Reset error:', err);
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const clampedPage = Math.min(currentPage, totalPages);
  const startItem = totalCount === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const endItem = Math.min(clampedPage * pageSize, totalCount);
  const paginationItems = (() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const items: Array<number | 'ellipsis-left' | 'ellipsis-right'> = [1];
    const windowStart = Math.max(2, clampedPage - 1);
    const windowEnd = Math.min(totalPages - 1, clampedPage + 1);

    if (windowStart > 2) {
      items.push('ellipsis-left');
    }

    for (let page = windowStart; page <= windowEnd; page += 1) {
      items.push(page);
    }

    if (windowEnd < totalPages - 1) {
      items.push('ellipsis-right');
    }

    items.push(totalPages);
    return items;
  })();

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const formatSize = (rim: RimVariant) => {
    const parts = [];
    if (rim.width) parts.push(`${rim.width}"`);
    if (rim.diameter) parts.push(`${rim.diameter}"`);
    if (rim.et) parts.push(`ET${rim.et}`);
    if (rim.pcd) parts.push(rim.pcd);
    return parts.join(' × ') || '—';
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0B0D10]' : 'bg-gray-50'}`}>
      <RimsCmsToolbar
        isDark={isDark}
        language={language}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
      />

      {/* Main Content */}
      <div className="px-8 py-6">
        {loading ? (
          <div className="text-center py-20">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto ${
              isDark ? 'border-white' : 'border-gray-900'
            }`} />
          </div>
        ) : error ? (
          <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {language === 'fi'
                  ? `Yhteensä ${totalCount} tuotetta`
                  : `${totalCount} items total`}
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {language === 'fi'
                  ? `Näytetään ${startItem}-${endItem} / ${totalCount} (sivu ${clampedPage}/${totalPages})`
                  : `Showing ${startItem}-${endItem} of ${totalCount} (page ${clampedPage}/${totalPages})`}
              </p>
            </div>

            <RimsCmsTable
              isDark={isDark}
              language={language}
              rims={rims}
              formatSize={formatSize}
              onToggleVisibility={handleToggleVisibility}
              onEdit={handleEdit}
            />

            {rims.length === 0 && (
              <div className="text-center py-20">
                <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'fi' ? 'Ei vanteita löytynyt' : 'No rims found'}
                </p>
              </div>
            )}

            <RimsCmsPagination
              isDark={isDark}
              language={language}
              currentPage={clampedPage}
              totalPages={totalPages}
              totalCount={totalCount}
              startItem={startItem}
              endItem={endItem}
              paginationItems={paginationItems}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Edit Drawer */}
      {drawerOpen && selectedRim && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseDrawer}
          />

          {/* Drawer */}
          <div className={`absolute right-0 top-0 bottom-0 w-full max-w-3xl ${
            isDark ? 'bg-[#0B0D10]' : 'bg-white'
          } shadow-2xl overflow-y-auto`}>
            {/* Drawer Header */}
            <div className={`sticky top-0 z-10 border-b ${
              isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'
            } px-6 py-4 flex items-center justify-between`}>
              <div>
                <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'Muokkaa vannetta' : 'Edit Rim'}
                </h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedRim.brand} {selectedRim.model} — {formatSize(selectedRim)}
                </p>
              </div>
              <button
                onClick={handleCloseDrawer}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                }`}
              >
                <X className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="px-6 py-6 space-y-8">
              
              {/* Section A: Identity (Read-Only) */}
              <div>
                <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'Tunnisteet (vain luku)' : 'Identity (Read-Only)'}
                </h3>
                <div className={`grid grid-cols-2 gap-4 p-4 rounded-lg ${
                  isDark ? 'bg-white/5' : 'bg-gray-50'
                }`}>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fi' ? 'Brändi' : 'Brand'}
                    </label>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedRim.brand}</p>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fi' ? 'Malli' : 'Model'}
                    </label>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedRim.model}</p>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      EAN
                    </label>
                    <p className={`text-sm font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedRim.ean || '—'}</p>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fi' ? 'Koko' : 'Size'}
                    </label>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatSize(selectedRim)}</p>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fi' ? 'Väri' : 'Color'}
                    </label>
                    <p className={`text-sm capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedRim.color || '—'}</p>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fi' ? 'Hinta (ilman ALV)' : 'Price (excl. VAT)'}
                    </label>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedRim.price_eur !== null && selectedRim.price_eur !== undefined
                        ? `€${selectedRim.price_eur.toFixed(2)}`
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fi' ? 'Hinta ALV 25.5% kanssa' : 'Price incl. VAT 25.5%'}
                    </label>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {toPriceWithVat(selectedRim.price_eur) !== null
                        ? `€${toPriceWithVat(selectedRim.price_eur)!.toFixed(2)}`
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section B: Images */}
              <div>
                <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'Kuvat' : 'Images'}
                </h3>
                <ImageUpload
                  images={(editData.gallery as string[]) || []}
                  maxImages={10}
                  onImagesChange={(images) => {
                    setEditData(prev => ({
                      ...prev,
                      gallery: images,
                      hero_image_url: images[0] || null
                    }));
                  }}
                  productType="rim"
                  variantId={selectedRim.id}
                />
              </div>

              {/* Section C: Content */}
              <div>
                <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'Sisältö' : 'Content'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'Otsikko' : 'Title'}
                    </label>
                    <input
                      type="text"
                      value={editData.title ?? ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder={`${selectedRim.brand} ${selectedRim.model}`}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'Alaotsikko' : 'Subtitle'}
                    </label>
                    <input
                      type="text"
                      value={editData.subtitle ?? ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, subtitle: e.target.value }))}
                      placeholder={formatSize(selectedRim)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'Lyhyt kuvaus' : 'Short Description'}
                    </label>
                    <textarea
                      rows={3}
                      value={editData.short_description ?? ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, short_description: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'Pitkä kuvaus' : 'Long Description'}
                    </label>
                    <textarea
                      rows={6}
                      value={editData.long_description ?? ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, long_description: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Section D: Bundle Pricing */}
              <div>
                <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'Pakettihinnoittelu' : 'Bundle Pricing'}
                </h3>
                {(() => {
                  const bundlePricing = getBundlePricing();
                  const tier2 = getBundleTier(2) ?? { mode: 'none' as BundlePricingMode, percent_off: null, fixed_total_eur: null };
                  const tier4 = getBundleTier(4) ?? { mode: 'none' as BundlePricingMode, percent_off: null, fixed_total_eur: null };
                  const basePrice = Number(selectedRim.price_eur ?? 0);
                  const preview2 = calculateLinePricing(basePrice, 2, bundlePricing);
                  const preview4 = calculateLinePricing(basePrice, 4, bundlePricing);
                  const invalidFixed2 = tier2.mode === 'fixed_total' && tier2.fixed_total_eur !== null && !isFixedBundleTotalCompatible(tier2.fixed_total_eur, 2);
                  const invalidFixed4 = tier4.mode === 'fixed_total' && tier4.fixed_total_eur !== null && !isFixedBundleTotalCompatible(tier4.fixed_total_eur, 4);

                  return (
                    <div className="space-y-4">
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {language === 'fi'
                          ? 'Määritä alennus tai kiinteä kokonaishinta, kun asiakas ostaa 2 tai 4 kappaletta.'
                          : 'Set a discount or fixed total when customer buys 2 or 4 units.'}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`rounded-lg border p-3 space-y-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>2 {language === 'fi' ? 'kpl' : 'items'}</p>
                          <select
                            value={tier2.mode}
                            onChange={(e) => setBundleTier(2, {
                              mode: e.target.value as BundlePricingMode,
                              percent_off: null,
                              fixed_total_eur: null,
                            })}
                            className={`w-full px-3 py-2 rounded-lg border ${
                              isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            <option value="none">{language === 'fi' ? 'Ei alennusta' : 'No bundle discount'}</option>
                            <option value="percent">{language === 'fi' ? 'Alennus %' : 'Discount %'}</option>
                            <option value="fixed_total">{language === 'fi' ? 'Kiinteä kokonaishinta' : 'Fixed total price'}</option>
                          </select>
                          {tier2.mode === 'percent' && (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={tier2.percent_off ?? ''}
                              onChange={(e) => setBundleTier(2, { percent_off: e.target.value ? Number(e.target.value) : null })}
                              placeholder={language === 'fi' ? 'Esim. 5' : 'e.g. 5'}
                              className={`w-full px-3 py-2 rounded-lg border ${
                                isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            />
                          )}
                          {tier2.mode === 'fixed_total' && (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={tier2.fixed_total_eur ?? ''}
                              onChange={(e) => setBundleTier(2, { fixed_total_eur: e.target.value ? Number(e.target.value) : null })}
                              placeholder={language === 'fi' ? 'Esim. 220.00' : 'e.g. 220.00'}
                              className={`w-full px-3 py-2 rounded-lg border ${
                                isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            />
                          )}
                          {invalidFixed2 && (
                            <p className={`text-xs ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                              {language === 'fi'
                                ? 'Kiinteä hinta ei jakaudu tasan 2 kappaleelle senttitasolla.'
                                : 'Fixed total does not divide evenly across 2 units in cents.'}
                            </p>
                          )}
                          <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {language === 'fi' ? 'Esikatselu:' : 'Preview:'} €{preview2.lineTotalEur.toFixed(2)}
                            {preview2.savingsEur > 0 ? ` (${language === 'fi' ? 'säästö' : 'saving'} €${preview2.savingsEur.toFixed(2)})` : ''}
                          </p>
                        </div>

                        <div className={`rounded-lg border p-3 space-y-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>4 {language === 'fi' ? 'kpl' : 'items'}</p>
                          <select
                            value={tier4.mode}
                            onChange={(e) => setBundleTier(4, {
                              mode: e.target.value as BundlePricingMode,
                              percent_off: null,
                              fixed_total_eur: null,
                            })}
                            className={`w-full px-3 py-2 rounded-lg border ${
                              isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            <option value="none">{language === 'fi' ? 'Ei alennusta' : 'No bundle discount'}</option>
                            <option value="percent">{language === 'fi' ? 'Alennus %' : 'Discount %'}</option>
                            <option value="fixed_total">{language === 'fi' ? 'Kiinteä kokonaishinta' : 'Fixed total price'}</option>
                          </select>
                          {tier4.mode === 'percent' && (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={tier4.percent_off ?? ''}
                              onChange={(e) => setBundleTier(4, { percent_off: e.target.value ? Number(e.target.value) : null })}
                              placeholder={language === 'fi' ? 'Esim. 10' : 'e.g. 10'}
                              className={`w-full px-3 py-2 rounded-lg border ${
                                isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            />
                          )}
                          {tier4.mode === 'fixed_total' && (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={tier4.fixed_total_eur ?? ''}
                              onChange={(e) => setBundleTier(4, { fixed_total_eur: e.target.value ? Number(e.target.value) : null })}
                              placeholder={language === 'fi' ? 'Esim. 420.00' : 'e.g. 420.00'}
                              className={`w-full px-3 py-2 rounded-lg border ${
                                isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            />
                          )}
                          {invalidFixed4 && (
                            <p className={`text-xs ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                              {language === 'fi'
                                ? 'Kiinteä hinta ei jakaudu tasan 4 kappaleelle senttitasolla.'
                                : 'Fixed total does not divide evenly across 4 units in cents.'}
                            </p>
                          )}
                          <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {language === 'fi' ? 'Esikatselu:' : 'Preview:'} €{preview4.lineTotalEur.toFixed(2)}
                            {preview4.savingsEur > 0 ? ` (${language === 'fi' ? 'säästö' : 'saving'} €${preview4.savingsEur.toFixed(2)})` : ''}
                          </p>
                        </div>
                      </div>

                      {(bundlePricing?.qty2 || bundlePricing?.qty4) && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={clearBundlePricing}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                              isDark
                                ? 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400'
                                : 'border-red-300 bg-red-50 hover:bg-red-100 text-red-700'
                            }`}
                          >
                            <RotateCcw className="w-4 h-4" />
                            {language === 'fi' ? 'Tyhjennä pakettihinnoittelu' : 'Clear bundle pricing'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Section E: SEO */}
              <div>
                <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  SEO
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'URL-tunniste' : 'SEO Slug'}
                    </label>
                    <input
                      type="text"
                      value={editData.seo_slug ?? ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, seo_slug: e.target.value }))}
                      placeholder="rim-brand-model-size"
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'SEO-otsikko' : 'SEO Title'}
                    </label>
                    <input
                      type="text"
                      value={editData.seo_title ?? ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, seo_title: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'SEO-kuvaus' : 'SEO Description'}
                    </label>
                    <textarea
                      rows={3}
                      value={editData.seo_description ?? ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, seo_description: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Section F: Visibility */}
              <div>
                <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'Näkyvyys' : 'Visibility'}
                </h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editData.is_hidden || false}
                    onChange={(e) => setEditData(prev => ({ ...prev, is_hidden: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fi' ? 'Piilota kaupasta' : 'Hide from store'}
                  </span>
                </label>
              </div>

              {/* Save Error */}
              {saveError && (
                <div className={`flex gap-3 p-4 rounded-lg ${
                  isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'
                }`}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{saveError}</p>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className={`sticky bottom-0 border-t ${
              isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'
            } px-6 py-4 flex items-center justify-between gap-3`}>
              <button
                onClick={handleResetCms}
                disabled={saving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? 'border border-red-500/40 text-red-300 hover:bg-red-500/20'
                    : 'border border-red-300 text-red-600 hover:bg-red-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <RotateCcw className="w-4 h-4" />
                {language === 'fi' ? 'Tyhjennä CMS' : 'Reset CMS'}
              </button>
              <button
                onClick={handleCloseDrawer}
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {language === 'fi' ? 'Peruuta' : 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Save className="w-4 h-4" />
                {saving ? (language === 'fi' ? 'Tallennetaan...' : 'Saving...') : (language === 'fi' ? 'Tallenna' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RimsCMSPageV2;
