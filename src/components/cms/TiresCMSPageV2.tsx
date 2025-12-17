import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { Search, Edit, Eye, EyeOff, X, Save, AlertCircle } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { EULabelOverride } from './EULabelOverride';

interface TireVariant {
  id: string;
  ean: string | null;
  brand: string;
  brand_name?: string | null;
  manufacturer?: string | null;
  model: string;
  size_string: string | null;
  season: string | null;
  eu_fuel_class: string | null;
  eu_wet_class: string | null;
  eu_noise_db: number | null;
  eu_noise_class: string | null;
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
  spec_overrides: any | null;
}

interface TireRow extends TireVariant {
  cms_data?: ProductCMS | null;
}

export function TiresCMSPageV2() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme === 'dark';

  const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

  const [tires, setTires] = useState<TireRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTire, setSelectedTire] = useState<TireRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Edit state
  const [editData, setEditData] = useState<Partial<ProductCMS>>({});

  useEffect(() => {
    fetchTires();
  }, []);

  const fetchTires = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch tire variants (base data - read-only)
      const { data: variants, error: variantsError } = await supabase
        .from('catalog_tire_variants')
        .select('*')
        .limit(100);

      if (variantsError) throw variantsError;

      if (!variants || variants.length === 0) {
        setTires([]);
        setLoading(false);
        return;
      }

      // Normalize brand field in case the view exposes a different column name
      const normalizedVariants = variants.map(v => ({
        ...v,
        brand: (v as any).brand ?? (v as any).brand_name ?? (v as any).manufacturer ?? 'Unknown brand'
      }));

      // Sort client-side to avoid ordering on potentially missing DB columns
      normalizedVariants.sort((a, b) => {
        const brandA = (a.brand || '').toLowerCase();
        const brandB = (b.brand || '').toLowerCase();
        if (brandA === brandB) {
          return (a.model || '').localeCompare(b.model || '');
        }
        return brandA.localeCompare(brandB);
      });

      // Fetch CMS data for these variants
      const variantIds = normalizedVariants.map(v => v.id);
      const { data: cmsData, error: cmsError } = await supabase
        .from('product_cms')
        .select('*')
        .in('variant_id', variantIds);

      if (cmsError) throw cmsError;

      // Merge data
      const cmsMap = new Map(cmsData?.map(c => [c.variant_id, c]) || []);
      const merged = normalizedVariants.map(v => ({
        ...v,
        cms_data: cmsMap.get(v.id) || null
      }));

      setTires(merged);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tire: TireRow) => {
    setSelectedTire(tire);
    
    // Initialize edit data
    const cms = tire.cms_data;
    setEditData({
      variant_id: tire.id,
      title: cms?.title || null,
      subtitle: cms?.subtitle || null,
      short_description: cms?.short_description || null,
      long_description: cms?.long_description || null,
      hero_image_url: cms?.hero_image_url || null,
      gallery: cms?.gallery || [],
      seo_slug: cms?.seo_slug || null,
      seo_title: cms?.seo_title || null,
      seo_description: cms?.seo_description || null,
      is_hidden: cms?.is_hidden || false,
      spec_overrides: cms?.spec_overrides || null,
    });
    
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedTire(null);
    setEditData({});
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!selectedTire) return;

    setSaving(true);
    setSaveError(null);

    try {
      const payload: any = {
        variant_id: selectedTire.id,
        title: editData.title || null,
        subtitle: editData.subtitle || null,
        short_description: editData.short_description || null,
        long_description: editData.long_description || null,
        hero_image_url: editData.hero_image_url || null,
        gallery: editData.gallery || [],
        seo_slug: editData.seo_slug || null,
        seo_title: editData.seo_title || null,
        seo_description: editData.seo_description || null,
        is_hidden: editData.is_hidden || false,
        spec_overrides: editData.spec_overrides || null,
      };

      // Upsert to product_cms
      const { error } = await supabase
        .from('product_cms')
        .upsert(payload, { onConflict: 'variant_id' });

      if (error) throw error;

      // Refresh data
      await fetchTires();
      handleCloseDrawer();
    } catch (err: any) {
      console.error('Save error:', err);
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (tire: TireRow) => {
    const newHiddenState = !tire.cms_data?.is_hidden;

    try {
      const { error } = await supabase
        .from('product_cms')
        .upsert({
          variant_id: tire.id,
          is_hidden: newHiddenState,
        }, { onConflict: 'variant_id' });

      if (error) throw error;

      await fetchTires();
    } catch (err: any) {
      console.error('Toggle visibility error:', err);
      setError(err.message);
    }
  };

  const filteredTires = tires.filter(tire => {
    const search = searchTerm.toLowerCase();
    return (
      tire.brand.toLowerCase().includes(search) ||
      tire.model.toLowerCase().includes(search) ||
      tire.ean?.toLowerCase().includes(search) ||
      tire.size_string?.toLowerCase().includes(search)
    );
  });

  const getEUOverride = (cms: ProductCMS | null | undefined) => {
    return cms?.spec_overrides?.eu || null;
  };

  const hasEUOverride = (cms: ProductCMS | null | undefined) => {
    const override = getEUOverride(cms);
    return override && Object.keys(override).length > 0;
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0B0D10]' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b ${isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'}`}>
        <div className="px-8 py-6">
          <h1 className={`text-3xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'Renkaat CMS' : 'Tires CMS'}
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'fi' 
              ? 'Hallitse renkaiden sisältöä, EU-merkintöjä ja kuvia'
              : 'Manage tire content, EU labels, and images'}
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
                        EAN
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {language === 'fi' ? 'Perus EU' : 'Base EU'}
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {language === 'fi' ? 'Ohitus' : 'Override'}
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
                    {filteredTires.map((tire) => (
                      <tr key={tire.id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                        <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {tire.brand}
                        </td>
                        <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {tire.model}
                        </td>
                        <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {tire.size_string || '—'}
                        </td>
                        <td className={`px-4 py-3 text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {tire.ean || '—'}
                        </td>
                        <td className={`px-4 py-3 text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <div className="space-y-1">
                            <div>F: {tire.eu_fuel_class || '—'}</div>
                            <div>W: {tire.eu_wet_class || '—'}</div>
                            <div>N: {tire.eu_noise_db ? `${tire.eu_noise_db}dB (${tire.eu_noise_class || '—'})` : '—'}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {hasEUOverride(tire.cms_data) ? (
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                            }`}>
                              {language === 'fi' ? 'KYLLÄ' : 'YES'}
                            </span>
                          ) : (
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {language === 'fi' ? 'EI' : 'NO'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleVisibility(tire)}
                            className={`p-1 rounded transition-colors ${
                              tire.cms_data?.is_hidden
                                ? (isDark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600')
                                : (isDark ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700')
                            }`}
                          >
                            {tire.cms_data?.is_hidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleEdit(tire)}
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

            {filteredTires.length === 0 && (
              <div className="text-center py-20">
                <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'fi' ? 'Ei renkaita löytynyt' : 'No tires found'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Drawer */}
      {drawerOpen && selectedTire && (
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
                  {language === 'fi' ? 'Muokkaa rengasta' : 'Edit Tire'}
                </h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedTire.brand} {selectedTire.model} — {selectedTire.size_string}
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
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedTire.brand}</p>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fi' ? 'Malli' : 'Model'}
                    </label>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedTire.model}</p>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      EAN
                    </label>
                    <p className={`text-sm font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedTire.ean || '—'}</p>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fi' ? 'Koko' : 'Size'}
                    </label>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedTire.size_string || '—'}</p>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fi' ? 'Kausi' : 'Season'}
                    </label>
                    <p className={`text-sm capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedTire.season || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Section B: EU Label Overrides */}
              <div>
                <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'EU-rengas­merkintä' : 'EU Tyre Label'}
                </h3>
                <EULabelOverride
                  baseValues={{
                    fuel: selectedTire.eu_fuel_class,
                    wet: selectedTire.eu_wet_class,
                    noise_db: selectedTire.eu_noise_db,
                    noise_class: selectedTire.eu_noise_class,
                  }}
                  overrideValues={editData.spec_overrides?.eu || null}
                  onOverrideChange={(values) => {
                    setEditData(prev => ({
                      ...prev,
                      spec_overrides: {
                        ...prev.spec_overrides,
                        eu: Object.keys(values).length > 0 ? values : null
                      }
                    }));
                  }}
                  onClearOverride={() => {
                    setEditData(prev => {
                      const { eu, ...rest } = prev.spec_overrides || {};
                      return {
                        ...prev,
                        spec_overrides: Object.keys(rest).length > 0 ? rest : null
                      };
                    });
                  }}
                />
              </div>

              {/* Section C: Images */}
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
                  productType="tire"
                  variantId={selectedTire.id}
                />
              </div>

              {/* Section D: Content */}
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
                      value={editData.title || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder={`${selectedTire.brand} ${selectedTire.model}`}
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
                      value={editData.subtitle || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, subtitle: e.target.value }))}
                      placeholder={selectedTire.size_string || ''}
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
                      value={editData.short_description || ''}
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
                      value={editData.long_description || ''}
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
                      value={editData.seo_slug || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, seo_slug: e.target.value }))}
                      placeholder="tire-brand-model-size"
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
                      value={editData.seo_title || ''}
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
                      value={editData.seo_description || ''}
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
            } px-6 py-4 flex items-center justify-end gap-3`}>
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
