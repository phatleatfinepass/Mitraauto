import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';
import { supabase } from '../../utils/supabase/client';
import { Search, Edit, Eye, EyeOff, X, Save, AlertCircle, RotateCcw } from 'lucide-react';
import { ImageUpload } from './ImageUpload';

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

  const [rims, setRims] = useState<RimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRim, setSelectedRim] = useState<RimRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Edit state
  const [editData, setEditData] = useState<Partial<ProductCMS>>({});

  useEffect(() => {
    fetchRims();
  }, []);

  const fetchRims = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch rim variants (base data - read-only)
      const { data: variants, error: variantsError } = await supabase
        .from('catalog_rim_variants')
        .select('id, ean, brand, model, width, diameter, pcd, et, color')
        .order('brand', { ascending: true })
        .order('model', { ascending: true })
        .limit(100);

      let resolvedVariants: RimVariant[] | null =
        variants?.map((variant: any) => ({
          ...variant,
          price_eur: null,
        })) ?? null;

      if (variantsError) {
        const message = variantsError.message ?? '';
        const shouldFallback =
          message.includes('catalog_rim_variants.brand') ||
          message.includes('column "brand" does not exist');

        if (!shouldFallback) {
          throw variantsError;
        }

        const { data: fallbackVariants, error: fallbackError } = await supabase
          .from('products_search')
          .select(
            'variant_id, brand, brand_display_name, model, width_in, rim_diameter_in, et_offset_mm, bolt_pattern, color, price',
          )
          .eq('product_type', 'rim')
          .order('brand_display_name', { ascending: true })
          .order('model', { ascending: true })
          .limit(100);

        if (fallbackError) throw fallbackError;

        resolvedVariants =
          fallbackVariants?.map((variant) => ({
            id: variant.variant_id,
            ean: null,
            brand: variant.brand_display_name || variant.brand || 'Unknown',
            model: variant.model || '',
            width: variant.width_in ?? null,
            diameter: variant.rim_diameter_in ?? null,
            pcd: variant.bolt_pattern ?? null,
            et: variant.et_offset_mm ?? null,
            color: variant.color ?? null,
            price_eur: variant.price ?? null,
          })) ?? [];
      }

      if (!resolvedVariants || resolvedVariants.length === 0) {
        setRims([]);
        setLoading(false);
        return;
      }

      // Fetch CMS + EAN data for these variants
      const variantIds = resolvedVariants.map(v => v.id);
      const [
        { data: cmsData, error: cmsError },
        { data: eanRows, error: eanError },
        { data: pricingRows, error: pricingError },
      ] = await Promise.all([
        supabase
          .from('product_cms')
          .select('*')
          .in('variant_id', variantIds),
        supabase
          .from('catalog_rim_variants')
          .select('id, ean')
          .in('id', variantIds),
        supabase
          .from('products_search')
          .select('variant_id, price')
          .eq('product_type', 'rim')
          .in('variant_id', variantIds),
      ]);

      if (cmsError) throw cmsError;
      if (eanError) throw eanError;
      if (pricingError) throw pricingError;

      // Merge data
      const cmsMap = new Map(cmsData?.map(c => [c.variant_id, c]) || []);
      const eanMap = new Map(eanRows?.map((row: any) => [row.id, row.ean]) || []);
      const priceMap = new Map(pricingRows?.map((row: any) => [row.variant_id, row.price]) || []);
      const merged = resolvedVariants.map(v => ({
        ...v,
        ean: v.ean ?? eanMap.get(v.id) ?? null,
        price_eur: v.price_eur ?? priceMap.get(v.id) ?? null,
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

  const handleSave = async () => {
    if (!selectedRim) return;

    setSaving(true);
    setSaveError(null);

    try {
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
        spec_overrides: editData.spec_overrides ?? selectedRim.cms_data?.spec_overrides ?? {},
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

  const filteredRims = rims.filter(rim => {
    const search = searchTerm.toLowerCase();
    return (
      rim.brand.toLowerCase().includes(search) ||
      rim.model.toLowerCase().includes(search) ||
      rim.ean?.toLowerCase().includes(search) ||
      rim.color?.toLowerCase().includes(search)
    );
  });

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
      {/* Header */}
      <div className={`border-b ${isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'}`}>
        <div className="px-8 py-6">
          <h1 className={`text-3xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'Vanteet CMS' : 'Rims CMS'}
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'fi' 
              ? 'Hallitse vanteiden sisältöä ja kuvia'
              : 'Manage rim content and images'}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className={`border-b ${isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'} px-8 py-4`}>
        <div className="relative max-w-md">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder={language === 'fi' ? 'Hae brändin, mallin tai EAN:n mukaan...' : 'Search by brand, model, or EAN...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
              isDark 
                ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>
      </div>

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
            {/* Table */}
            <div className={`rounded-lg border overflow-hidden ${
              isDark ? 'border-white/10 bg-[#161A22]' : 'border-gray-200 bg-white'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {language === 'fi' ? 'Brändi' : 'Brand'}
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {language === 'fi' ? 'Malli' : 'Model'}
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {language === 'fi' ? 'Koko' : 'Size'}
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {language === 'fi' ? 'Väri' : 'Color'}
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        EAN
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {language === 'fi' ? 'Hinta' : 'Price'}
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {language === 'fi' ? 'Näkyvyys' : 'Visible'}
                      </th>
                      <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {language === 'fi' ? 'Toiminnot' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredRims.map((rim) => (
                      <tr key={rim.id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                        <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {rim.brand}
                        </td>
                        <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {rim.model}
                        </td>
                        <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatSize(rim)}
                        </td>
                        <td className={`px-4 py-3 capitalize ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {rim.color || '—'}
                        </td>
                        <td className={`px-4 py-3 text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {rim.ean || '—'}
                        </td>
                        <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {rim.price_eur !== null && rim.price_eur !== undefined
                            ? `€${Number(rim.price_eur).toFixed(2)}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleVisibility(rim)}
                            className={`p-1 rounded transition-colors ${
                              rim.cms_data?.is_hidden
                                ? (isDark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600')
                                : (isDark ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700')
                            }`}
                          >
                            {rim.cms_data?.is_hidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleEdit(rim)}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              isDark 
                                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            <Edit className="w-4 h-4" />
                            {language === 'fi' ? 'Muokkaa' : 'Edit'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredRims.length === 0 && (
              <div className="text-center py-20">
                <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'fi' ? 'Ei vanteita löytynyt' : 'No rims found'}
                </p>
              </div>
            )}
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

              {/* Section D: SEO */}
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

              {/* Section E: Visibility */}
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
