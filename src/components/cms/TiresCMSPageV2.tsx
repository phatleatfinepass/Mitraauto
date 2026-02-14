import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';
import { supabase } from '../../utils/supabase/client';
import { Search, Edit, Eye, EyeOff, X, Save, AlertCircle, Upload, GripVertical, RotateCcw, AlertTriangle } from 'lucide-react';

interface ProductSearchTire {
  variant_id: string;
  product_type: 'tire';
  derived_ean: string | null;
  brand: string;
  model: string;
  size_string: string | null;
  season: string | null;
  
  // Base EU values from supplier
  eu_fuel_class: string | null;
  eu_wet_grip_class: string | null;
  eu_noise_db: number | null;
  eu_noise_class: string | null;
  
  // Final computed values
  final_title: string | null;
  final_price_eur: number | null;
  final_is_hidden: boolean;
  price?: number | null;
  
  // Conflict detection
  ean_conflict_open?: boolean | null;
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
  spec_overrides: {
    eu?: {
      fuel_class?: string;
      wet_grip_class?: string;
      noise_db?: number;
      noise_class?: string;
    };
    [key: string]: any;
  } | null;
  price_override_eur: number | null;
  promo_enabled: boolean;
  promo_price_eur: number | null;
  promo_start: string | null;
  promo_end: string | null;
}

interface TireRow extends ProductSearchTire {
  cms_data?: ProductCMS | null;
}

const EU_FUEL_WET_OPTIONS = ['A', 'B', 'C', 'D', 'E'];
const EU_NOISE_CLASS_OPTIONS = ['A', 'B', 'C'];

export function TiresCMSPageV2() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme === 'dark';
  const pageSize = 100;

  const [tires, setTires] = useState<TireRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConflicts, setShowConflicts] = useState(false);
  const [selectedTire, setSelectedTire] = useState<TireRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sizeParts, setSizeParts] = useState({ width: '', aspect: '', rim: '' });

  // Edit state
  const [editData, setEditData] = useState<Partial<ProductCMS>>({});

  // Image upload state
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchTires();
  }, [showConflicts, searchTerm, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [showConflicts, searchTerm]);

  const fetchTires = async () => {
    setLoading(true);
    setError(null);

    try {
      const trimmedSearch = searchTerm.trim();
      const rangeStart = (currentPage - 1) * pageSize;
      const rangeEnd = rangeStart + pageSize - 1;
      const runProductsQuery = async (
        ignoreConflictColumn: boolean,
        ignoreDerivedEanColumn: boolean,
        useFullRange: boolean = false
      ) => {
        let query = supabase
          .from('products_search')
          .select('*', { count: 'exact' })
          .eq('product_type', 'tire')
          .order('brand', { ascending: true })
          .order('model', { ascending: true });

        // Old schemas might not have ean_conflict_open; fallback handled below.
        if (!showConflicts && !ignoreConflictColumn) {
          query = query.or('ean_conflict_open.is.null,ean_conflict_open.eq.false');
        }

        if (trimmedSearch) {
          const searchFilters = [
            `brand.ilike.%${trimmedSearch}%`,
            `model.ilike.%${trimmedSearch}%`,
            `size_string.ilike.%${trimmedSearch}%`
          ];

          if (!ignoreDerivedEanColumn) {
            searchFilters.push(`derived_ean.ilike.%${trimmedSearch}%`);
          }

          query = query.or(
            searchFilters.join(',')
          );
        }

        if (useFullRange) {
          return query.range(0, 4999);
        }

        return query.range(rangeStart, rangeEnd);
      };

      let ignoreConflictColumn = false;
      let ignoreDerivedEanColumn = false;
      let products: any[] | null = null;
      let productsError: any = null;
      let count: number | null = 0;

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const result = await runProductsQuery(ignoreConflictColumn, ignoreDerivedEanColumn);
        products = result.data;
        productsError = result.error;
        count = result.count;

        if (!productsError) break;

        const isMissingColumn = productsError?.code === '42703' && typeof productsError?.message === 'string';

        if (
          isMissingColumn &&
          !ignoreConflictColumn &&
          productsError.message.includes('ean_conflict_open')
        ) {
          ignoreConflictColumn = true;
          continue;
        }

        if (
          isMissingColumn &&
          !ignoreDerivedEanColumn &&
          productsError.message.includes('derived_ean')
        ) {
          ignoreDerivedEanColumn = true;
          continue;
        }

        break;
      }

      if (productsError) throw productsError;

      if (ignoreConflictColumn) {
        const fullResult = await runProductsQuery(true, ignoreDerivedEanColumn, true);
        if (fullResult.error) throw fullResult.error;
        products = fullResult.data;
        count = fullResult.count;
      }

      if (!products || products.length === 0) {
        setTotalCount(0);
        setTires([]);
        setLoading(false);
        return;
      }

      // Fetch CMS data for these variants
      const variantIds = products.map((p: any) => p.variant_id);
      const [{ data: cmsData, error: cmsError }, { data: eanRows, error: eanError }] = await Promise.all([
        supabase
          .from('product_cms')
          .select('*')
          .in('variant_id', variantIds),
        supabase
          .from('catalog_tire_variants')
          .select('id, ean')
          .in('id', variantIds)
      ]);

      if (cmsError) throw cmsError;
      if (eanError) throw eanError;

      // Merge data
      const cmsMap = new Map(cmsData?.map((c: any) => [c.variant_id, c]) || []);
      const eanMap = new Map(eanRows?.map((row: any) => [row.id, row.ean]) || []);
      const normalizedEanCounts = new Map<string, number>();

      for (const product of products) {
        const ean = (product.derived_ean ?? eanMap.get(product.variant_id) ?? '').trim();
        if (!ean) continue;
        normalizedEanCounts.set(ean, (normalizedEanCounts.get(ean) ?? 0) + 1);
      }

      const merged = products.map((p: any) => ({
        ...p,
        derived_ean: p.derived_ean ?? eanMap.get(p.variant_id) ?? null,
        final_price_eur: p.final_price_eur ?? p.price ?? null,
        ean_conflict_open:
          p.ean_conflict_open ??
          (() => {
            const ean = (p.derived_ean ?? eanMap.get(p.variant_id) ?? '').trim();
            return ean ? (normalizedEanCounts.get(ean) ?? 0) > 1 : false;
          })(),
        cms_data: cmsMap.get(p.variant_id) || null
      }));

      if (ignoreConflictColumn) {
        const visibleRows = showConflicts
          ? merged
          : merged.filter((row: any) => !row.ean_conflict_open);

        const fallbackTotal = visibleRows.length;
        setTotalCount(fallbackTotal);
        const fallbackTotalPages = Math.max(1, Math.ceil(fallbackTotal / pageSize));
        if (currentPage > fallbackTotalPages) {
          setCurrentPage(fallbackTotalPages);
          return;
        }

        const pagedRows = visibleRows.slice(rangeStart, rangeEnd + 1);
        setTires(pagedRows as TireRow[]);
        return;
      }

      const nextTotal = count ?? 0;
      setTotalCount(nextTotal);
      const totalPages = Math.max(1, Math.ceil(nextTotal / pageSize));
      if (currentPage > totalPages) {
        setCurrentPage(totalPages);
        return;
      }

      setTires(merged as TireRow[]);
    } catch (err: any) {
      console.error('Fetch tires error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

    const parseTireSize = (size?: string | null) => {
    const cleaned = size?.trim() ?? '';
    const match = cleaned.match(/(\d{3})\s*\/\s*(\d{2})\s*R?\s*(\d{2})/i);

    if (!match) {
      return { width: '', aspect: '', rim: '' };
    }

    return { width: match[1], aspect: match[2], rim: match[3] };
  };

  const formatTireSize = (parts: { width: string; aspect: string; rim: string }) => {
    if (!parts.width && !parts.aspect && !parts.rim) {
      return '';
    }

    if (!parts.width || !parts.aspect || !parts.rim) {
      return '';
    }

    return `${parts.width}/${parts.aspect} R${parts.rim}`;
  };

  const handleEdit = (tire: TireRow) => {
    setSelectedTire(tire);
    
    // Initialize edit data
    const cms = tire.cms_data;
    setEditData({
      variant_id: tire.variant_id,
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
      price_override_eur: cms?.price_override_eur ?? null,
      promo_enabled: cms?.promo_enabled ?? false,
      promo_price_eur: cms?.promo_price_eur ?? null,
      promo_start: cms?.promo_start ?? null,
      promo_end: cms?.promo_end ?? null,
    });

    const sizeSource =
      (cms?.spec_overrides as any)?.identity?.size_string ??
      tire.size_string ??
      '';
    setSizeParts(parseTireSize(sizeSource));
    
    setDrawerOpen(true);
    setUploadError(null);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedTire(null);
    setEditData({});
    setSaveError(null);
    setUploadError(null);
    setSizeParts({ width: '', aspect: '', rim: '' });
  };

  const handleSave = async () => {
    if (!selectedTire) return;

    setSaving(true);
    setSaveError(null);

    try {
      const payload: any = {
        variant_id: selectedTire.variant_id,
        title: editData.title?.trim() || null,
        subtitle: editData.subtitle?.trim() || null,
        short_description: editData.short_description?.trim() || null,
        long_description: editData.long_description?.trim() || null,
        gallery: Array.isArray(editData.gallery) ? editData.gallery.filter(Boolean) : [],
        seo_slug: editData.seo_slug?.trim() || null,
        seo_title: editData.seo_title?.trim() || null,
        seo_description: editData.seo_description?.trim() || null,
        is_hidden: editData.is_hidden ?? false,
        spec_overrides: editData.spec_overrides ?? {},
        price_override_eur: editData.price_override_eur ?? null,
        promo_enabled: editData.promo_enabled ?? false,
        promo_price_eur: editData.promo_price_eur ?? null,
        promo_start: editData.promo_start || null,
        promo_end: editData.promo_end || null,
      };

      payload.hero_image_url = editData.hero_image_url || payload.gallery[0] || null;

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
          variant_id: tire.variant_id,
          is_hidden: newHiddenState,
          spec_overrides: tire.cms_data?.spec_overrides ?? {},
        }, { onConflict: 'variant_id' });

      if (error) throw error;

      await fetchTires();
    } catch (err: any) {
      console.error('Toggle visibility error:', err);
      setError(err.message);
    }
  };

  // Image upload functions
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedTire) return;

    setUploadingImages(true);
    setUploadError(null);

    try {
      const currentGallery = (editData.gallery as string[]) || [];
      if (currentGallery.length + files.length > 10) {
        throw new Error('Maximum 10 images allowed');
      }

      const newImages: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image`);
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} exceeds 5MB limit`);
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const ext = file.name.split('.').pop();
        const filename = `${timestamp}_${randomStr}.${ext}`;
        const path = `tires/${selectedTire.variant_id}/${filename}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(path);

        newImages.push(publicUrl);
      }

      // Add new images to gallery
      const updatedGallery = [...currentGallery, ...newImages];
      setEditData(prev => ({
        ...prev,
        gallery: updatedGallery,
        hero_image_url: updatedGallery[0] || prev.hero_image_url
      }));

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = async (index: number) => {
    const gallery = (editData.gallery as string[]) || [];
    const imageUrl = gallery[index];
    
    // Try to delete from storage
    try {
      const urlPath = new URL(imageUrl).pathname;
      const pathParts = urlPath.split('/product-images/');
      if (pathParts.length > 1) {
        const storagePath = pathParts[1];
        await supabase.storage.from('product-images').remove([storagePath]);
      }
    } catch (error) {
      console.warn('Could not delete from storage:', error);
    }

    // Remove from gallery
    const updatedGallery = gallery.filter((_, i) => i !== index);
    setEditData(prev => ({
      ...prev,
      gallery: updatedGallery,
      hero_image_url: updatedGallery[0] || null
    }));
  };

  const handleImageReorder = (newGallery: string[]) => {
    setEditData(prev => ({
      ...prev,
      gallery: newGallery,
      hero_image_url: newGallery[0] || prev.hero_image_url
    }));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const gallery = (editData.gallery as string[]) || [];
    const newGallery = [...gallery];
    const draggedItem = newGallery[draggedIndex];
    newGallery.splice(draggedIndex, 1);
    newGallery.splice(index, 0, draggedItem);
    
    handleImageReorder(newGallery);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // EU override helpers
  const getEUOverride = () => {
    return editData.spec_overrides?.eu || null;
  };

  const setEUField = (field: string, value: any) => {
    const currentOverrides = editData.spec_overrides || {};
    const currentEU = currentOverrides.eu || {};
    
    const updatedEU = { ...currentEU, [field]: value };
    
    setEditData(prev => ({
      ...prev,
      spec_overrides: {
        ...currentOverrides,
        eu: updatedEU
      }
    }));
  };

  const clearEUOverrides = () => {
    const currentOverrides = editData.spec_overrides || {};
    const { eu, ...restOverrides } = currentOverrides;
    
    setEditData(prev => ({
      ...prev,
      spec_overrides: Object.keys(restOverrides).length > 0 ? restOverrides : null
    }));
  };

  const hasEUOverride = () => {
    const override = getEUOverride();
    return override && Object.keys(override).length > 0;
  };

  const getIdentityOverride = () => {
    return editData.spec_overrides?.identity || null;
  };

  const setIdentityField = (field: 'brand' | 'model' | 'size_string' | 'season', value?: string) => {
    setEditData(prev => {
      const currentOverrides = prev.spec_overrides || {};
      const currentIdentity = currentOverrides.identity || {};

      const updatedIdentity = { ...currentIdentity } as Record<string, string>;
      if (value === undefined) {
        delete updatedIdentity[field];
      } else {
        updatedIdentity[field] = value;
      }

      const { identity, ...restOverrides } = currentOverrides;
      const nextOverrides = {
        ...restOverrides,
        ...(Object.keys(updatedIdentity).length > 0 ? { identity: updatedIdentity } : {})
      };

      return {
        ...prev,
        spec_overrides: Object.keys(nextOverrides).length > 0 ? nextOverrides : null
      };
    });
  };

  const clearIdentityOverrides = () => {
    setEditData(prev => {
      const currentOverrides = prev.spec_overrides || {};
      const { identity, ...restOverrides } = currentOverrides;

      return {
        ...prev,
        spec_overrides: Object.keys(restOverrides).length > 0 ? restOverrides : null
      };
    });
    setSizeParts(parseTireSize(selectedTire?.size_string ?? ''));
  };

  const updateSizePart = (field: 'width' | 'aspect' | 'rim', value: string) => {
    setSizeParts(prev => {
      const next = { ...prev, [field]: value };
      setIdentityField('size_string', formatTireSize(next));
      return next;
    });
  };

  const handleResetCms = async () => {
    if (!selectedTire) return;

    setSaving(true);
    setSaveError(null);

    try {
      const { error } = await supabase
        .from('product_cms')
        .delete()
        .eq('variant_id', selectedTire.variant_id);

      if (error) throw error;

      await fetchTires();
      handleCloseDrawer();
    } catch (err: any) {
      console.error('Reset error:', err);
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredTires = tires;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

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
              ? 'Hallitse renkaiden sisältöä, EU-merkintöjä, hintoja ja kuvia'
              : 'Manage tire content, EU labels, pricing, and images'}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className={`border-b ${isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'} px-8 py-4`}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:max-w-md">
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
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showConflicts}
              onChange={(e) => setShowConflicts(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {language === 'fi' ? 'Näytä konfliktit' : 'Show conflicts'}
            </span>
          </label>
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
                    {filteredTires.map((tire) => (
                      <tr 
                        key={tire.variant_id} 
                        className={`${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} ${
                          tire.ean_conflict_open ? (isDark ? 'bg-yellow-500/10' : 'bg-yellow-50') : ''
                        }`}
                      >
                        <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          <div className="flex items-center gap-2">
                            {tire.brand}
                            {tire.ean_conflict_open && (
                              <AlertTriangle className="w-4 h-4 text-yellow-500" title="EAN conflict" />
                            )}
                          </div>
                        </td>
                        <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {tire.model}
                        </td>
                        <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {tire.size_string || '—'}
                        </td>
                        <td className={`px-4 py-3 text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {tire.derived_ean || '—'}
                        </td>
                        <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {tire.final_price_eur !== null && tire.final_price_eur !== undefined
                            ? `€${tire.final_price_eur.toFixed(2)}`
                            : '—'}
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

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'fi'
                    ? `Näytetään ${startItem}-${endItem} / ${totalCount}`
                    : `Showing ${startItem}-${endItem} of ${totalCount}`}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      isDark
                        ? 'border-white/10 text-gray-200 hover:bg-white/10 disabled:text-gray-600 disabled:hover:bg-transparent'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-transparent'
                    }`}
                  >
                    {language === 'fi' ? 'Edellinen' : 'Previous'}
                  </button>
                  {Array.from({ length: totalPages }).map((_, index) => {
                    const pageNumber = index + 1;
                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          pageNumber === currentPage
                            ? isDark
                              ? 'bg-blue-500/30 text-blue-200'
                              : 'bg-blue-100 text-blue-700'
                            : isDark
                              ? 'text-gray-300 hover:bg-white/10'
                              : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      isDark
                        ? 'border-white/10 text-gray-200 hover:bg-white/10 disabled:text-gray-600 disabled:hover:bg-transparent'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-transparent'
                    }`}
                  >
                    {language === 'fi' ? 'Seuraava' : 'Next'}
                  </button>
                </div>
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
              
              {/* Section A: Identity */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fi' ? 'Tunnisteet' : 'Identity'}
                  </h3>
                  <button
                    type="button"
                    onClick={clearIdentityOverrides}
                    className={`flex items-center gap-2 text-sm ${isDark ? 'text-blue-200 hover:text-white' : 'text-blue-700 hover:text-blue-900'}`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    {language === 'fi' ? 'Palauta perustasot' : 'Reset to base'}
                  </button>
                </div>

                <div className={`grid grid-cols-2 gap-4 p-4 rounded-lg ${
                  isDark ? 'bg-white/5' : 'bg-gray-50'
                }`}>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fi' ? 'Brändi' : 'Brand'}
                    </label>
                    <input
                      type="text"
                      value={getIdentityOverride()?.brand ?? selectedTire.brand}
                      onChange={(e) => setIdentityField('brand', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fi' ? 'Malli' : 'Model'}
                    </label>
                    <input
                      type="text"
                      value={getIdentityOverride()?.model ?? selectedTire.model}
                      onChange={(e) => setIdentityField('model', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      EAN
                    </label>
                    <p className={`text-sm font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedTire.derived_ean || '—'}</p>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fi' ? 'Koko' : 'Size'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="205"
                        value={sizeParts.width}
                        onChange={(e) => updateSizePart('width', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="55"
                        value={sizeParts.aspect}
                        onChange={(e) => updateSizePart('aspect', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="16"
                        value={sizeParts.rim}
                        onChange={(e) => updateSizePart('rim', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {language === 'fi' ? 'Muoto: 205 / 55 R 16' : 'Format: 205 / 55 R 16'}
                    </p>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fi' ? 'Kausi' : 'Season'}
                    </label>
                    <select
                      value={getIdentityOverride()?.season ?? selectedTire.season ?? ''}
                      onChange={(e) => setIdentityField('season', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">{language === 'fi' ? 'Perusta (ei muutosta)' : 'Use base value'}</option>
                      <option value="summer">{language === 'fi' ? 'Kesä' : 'Summer'}</option>
                      <option value="winter">{language === 'fi' ? 'Talvi' : 'Winter'}</option>
                      <option value="all_season">{language === 'fi' ? 'Ympärivuotinen' : 'All Season'}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section B: EU Labels */}
              <div>
                <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'EU-rengas­merkintä' : 'EU Tyre Label'}
                </h3>
                
                <div className={`flex gap-3 p-4 rounded-lg border mb-6 ${
                  isDark 
                    ? 'bg-blue-500/10 border-blue-500/30' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-900'}`}>
                    {language === 'fi' 
                      ? 'Voit ohittaa toimittajan arvot. Tyhjä = käytä perusarvoa.'
                      : 'Override supplier values. Empty = use base value.'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Fuel Efficiency */}
                  <div className="space-y-3">
                    <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'Polttoaine­tehokkuus' : 'Fuel Efficiency'}
                    </label>
                    
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {language === 'fi' ? 'Perustaso:' : 'Base:'}
                      </span>
                      <span className={`font-mono font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedTire.eu_fuel_class || '—'}
                      </span>
                    </div>

                    <select
                      value={getEUOverride()?.fuel_class || ''}
                      onChange={(e) => setEUField('fuel_class', e.target.value || undefined)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-[#1C1C1E] border-white/20 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">{language === 'fi' ? '— Käytä perustasoa —' : '— Use base value —'}</option>
                      {EU_FUEL_WET_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Wet Grip */}
                  <div className="space-y-3">
                    <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'Märkäpito' : 'Wet Grip'}
                    </label>
                    
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {language === 'fi' ? 'Perustaso:' : 'Base:'}
                      </span>
                      <span className={`font-mono font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedTire.eu_wet_grip_class || '—'}
                      </span>
                    </div>

                    <select
                      value={getEUOverride()?.wet_grip_class || ''}
                      onChange={(e) => setEUField('wet_grip_class', e.target.value || undefined)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-[#1C1C1E] border-white/20 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">{language === 'fi' ? '— Käytä perustasoa —' : '— Use base value —'}</option>
                      {EU_FUEL_WET_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Noise dB */}
                  <div className="space-y-3">
                    <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'Melutaso (dB)' : 'Noise Level (dB)'}
                    </label>
                    
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {language === 'fi' ? 'Perustaso:' : 'Base:'}
                      </span>
                      <span className={`font-mono font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedTire.eu_noise_db ? `${selectedTire.eu_noise_db} dB` : '—'}
                      </span>
                    </div>

                    <input
                      type="number"
                      min="50"
                      max="90"
                      step="1"
                      value={getEUOverride()?.noise_db ?? ''}
                      onChange={(e) => setEUField('noise_db', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder={language === 'fi' ? 'Käytä perustasoa' : 'Use base value'}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>

                  {/* Noise Class */}
                  <div className="space-y-3">
                    <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'Meluluokka' : 'Noise Class'}
                    </label>
                    
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {language === 'fi' ? 'Perustaso:' : 'Base:'}
                      </span>
                      <span className={`font-mono font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedTire.eu_noise_class || '—'}
                      </span>
                    </div>

                    <select
                      value={getEUOverride()?.noise_class || ''}
                      onChange={(e) => setEUField('noise_class', e.target.value || undefined)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-[#1C1C1E] border-white/20 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">{language === 'fi' ? '— Käytä perustasoa —' : '— Use base value —'}</option>
                      {EU_NOISE_CLASS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {hasEUOverride() && (
                  <div className="flex justify-end pt-4 mt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={clearEUOverrides}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        isDark 
                          ? 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400' 
                          : 'border-red-300 bg-red-50 hover:bg-red-100 text-red-700'
                      }`}
                    >
                      <RotateCcw className="w-4 h-4" />
                      {language === 'fi' ? 'Tyhjennä EU-ohitukset' : 'Clear EU Overrides'}
                    </button>
                  </div>
                )}
              </div>

              {/* Section C: Pricing */}
              <div>
                <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'Hinnoittelu' : 'Pricing'}
                </h3>
                
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {language === 'fi' ? 'Perushinta:' : 'Base price:'}
                      </span>
                      <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        €{selectedTire.final_price_eur?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'Hinnan ohitus (€)' : 'Price Override (€)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editData.price_override_eur ?? ''}
                      onChange={(e) => setEditData(prev => ({ 
                        ...prev, 
                        price_override_eur: e.target.value ? parseFloat(e.target.value) : null 
                      }))}
                      placeholder={language === 'fi' ? 'Jätä tyhjäksi käyttääksesi perushintaa' : 'Leave empty to use base price'}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>

                  <div className="border-t pt-4 border-white/10">
                    <label className="flex items-center gap-3 cursor-pointer mb-4">
                      <input
                        type="checkbox"
                        checked={editData.promo_enabled || false}
                        onChange={(e) => setEditData(prev => ({ ...prev, promo_enabled: e.target.checked }))}
                        className="w-5 h-5 rounded border-gray-300"
                      />
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {language === 'fi' ? 'Tarjoushinta käytössä' : 'Promotional price enabled'}
                      </span>
                    </label>

                    {editData.promo_enabled && (
                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {language === 'fi' ? 'Tarjoushinta (€)' : 'Promo Price (€)'}
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editData.promo_price_eur ?? ''}
                            onChange={(e) => setEditData(prev => ({ 
                              ...prev, 
                              promo_price_eur: e.target.value ? parseFloat(e.target.value) : null 
                            }))}
                            className={`w-full px-3 py-2 rounded-lg border ${
                              isDark 
                                ? 'bg-[#1C1C1E] border-white/20 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {language === 'fi' ? 'Alkaa' : 'Start Date'}
                            </label>
                            <input
                              type="date"
                              value={editData.promo_start ?? ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, promo_start: e.target.value || null }))}
                              className={`w-full px-3 py-2 rounded-lg border ${
                                isDark 
                                  ? 'bg-[#1C1C1E] border-white/20 text-white' 
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            />
                          </div>

                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {language === 'fi' ? 'Päättyy' : 'End Date'}
                            </label>
                            <input
                              type="date"
                              value={editData.promo_end ?? ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, promo_end: e.target.value || null }))}
                              className={`w-full px-3 py-2 rounded-lg border ${
                                isDark 
                                  ? 'bg-[#1C1C1E] border-white/20 text-white' 
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section D: Images */}
              <div>
                <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'Kuvat' : 'Images'}
                </h3>

                {/* Upload Button */}
                {((editData.gallery as string[])?.length || 0) < 10 && (
                  <label className="block cursor-pointer mb-4">
                    <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDark 
                        ? 'border-white/20 hover:border-white/40 bg-white/5' 
                        : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                    }`}>
                      <Upload className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <p className={`text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {uploadingImages ? (language === 'fi' ? 'Ladataan...' : 'Uploading...') : (language === 'fi' ? 'Klikkaa ladataksesi kuvia' : 'Click to upload images')}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        PNG, JPG max 5MB ({(editData.gallery as string[])?.length || 0}/10)
                      </p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files)}
                      disabled={uploadingImages}
                      className="hidden"
                    />
                  </label>
                )}

                {uploadError && (
                  <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
                    <p className="text-sm">{uploadError}</p>
                  </div>
                )}

                {/* Image Grid */}
                {((editData.gallery as string[])?.length || 0) > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {(editData.gallery as string[]).map((url, index) => (
                      <div
                        key={url}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                          draggedIndex === index 
                            ? 'opacity-50 scale-95' 
                            : 'opacity-100 scale-100'
                        } ${
                          isDark ? 'border-white/10 hover:border-white/30' : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <div className="aspect-square bg-white">
                          <img 
                            src={url} 
                            alt={`Product ${index + 1}`}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 cursor-move"
                            title="Drag to reorder"
                          >
                            <GripVertical className="w-5 h-5 text-white" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="p-2 rounded-lg bg-red-500/80 hover:bg-red-500 transition-colors"
                            title="Remove"
                          >
                            <X className="w-5 h-5 text-white" />
                          </button>
                        </div>

                        <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
                          index === 0 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-black/50 text-white'
                        }`}>
                          {index === 0 ? 'Hero' : `#${index + 1}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section E: Content */}
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
                      value={editData.subtitle ?? ''}
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

              {/* Section F: SEO */}
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

              {/* Section G: Visibility */}
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
