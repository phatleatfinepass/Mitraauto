import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { TireFilters } from './TireFilters';
import { RimFilters } from './RimFilters';
import { TireCard } from './TireCard';
import { RimCard } from './RimCard';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

type CatalogMode = 'tires' | 'rims';

interface Product {
  id: string;
  brand: string;
  model: string;
  product_type: string;
  best_price_eur: number;
  best_image_url: string;
  in_stock: boolean;
  // Tire specific
  size_text?: string;
  eu_fuel?: string;
  eu_wet?: string;
  eu_noise?: number;
  season?: string;
  runflat?: boolean;
  xl?: boolean;
  studded?: boolean;
  // Rim specific
  rim_width?: number;
  rim_diameter?: number;
  pcd?: string;
  et_offset?: number;
  cb?: number;
  color?: string;
  material?: string;
  bolts_included?: boolean;
}

const ITEMS_PER_PAGE = 12;

export function CatalogPage() {
  const { language } = useLanguage();
  const [mode, setMode] = useState<CatalogMode>('tires');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<any>({});

  const supabase = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey
  );

  useEffect(() => {
    fetchProducts();
  }, [mode, filters, currentPage]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products_search')
        .select('*', { count: 'exact' })
        .eq('product_type', mode === 'tires' ? 'tire' : 'rim');

      // Apply filters
      if (filters.inStockOnly) {
        query = query.eq('in_stock', true);
      }

      if (filters.brand && filters.brand.length > 0) {
        query = query.in('brand', filters.brand);
      }

      // Tire-specific filters
      if (mode === 'tires') {
        if (filters.width) query = query.eq('width', filters.width);
        if (filters.aspectRatio) query = query.eq('aspect_ratio', filters.aspectRatio);
        if (filters.diameter) query = query.eq('diameter', filters.diameter);
        if (filters.season) query = query.eq('season', filters.season);
        if (filters.runflat) query = query.eq('runflat', true);
        if (filters.xl) query = query.eq('xl', true);
        if (filters.studded) query = query.eq('studded', true);
        if (filters.search) {
          query = query.or(`brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
        }
      }

      // Rim-specific filters
      if (mode === 'rims') {
        if (filters.rimDiameter) query = query.eq('rim_diameter', filters.rimDiameter);
        if (filters.rimWidth) query = query.eq('rim_width', filters.rimWidth);
        if (filters.pcd) query = query.eq('pcd', filters.pcd);
        if (filters.etOffset) query = query.eq('et_offset', filters.etOffset);
        if (filters.cb) query = query.eq('cb', filters.cb);
        if (filters.color) query = query.eq('color', filters.color);
        if (filters.material) query = query.eq('material', filters.material);
        if (filters.boltsIncluded !== undefined) query = query.eq('bolts_included', filters.boltsIncluded);
      }

      // Sorting
      if (filters.sortBy === 'price_asc') {
        query = query.order('best_price_eur', { ascending: true });
      } else if (filters.sortBy === 'price_desc') {
        query = query.order('best_price_eur', { ascending: false });
      } else if (filters.sortBy === 'brand_asc') {
        query = query.order('brand', { ascending: true });
      } else if (mode === 'tires' && filters.sortBy === 'wet_grip') {
        query = query.order('eu_wet', { ascending: true });
      } else if (mode === 'tires' && filters.sortBy === 'noise') {
        query = query.order('eu_noise', { ascending: true });
      }

      // Pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setProducts(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page on filter change
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0D10] to-[#161A22]">
      {/* Mode Selector Tabs */}
      <div className="sticky top-16 z-30 bg-[#0B0D10]/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4 py-6">
            <button
              onClick={() => {
                setMode('tires');
                setFilters({});
                setCurrentPage(1);
              }}
              className={`
                relative px-8 py-3 rounded-xl transition-all duration-300
                ${mode === 'tires'
                  ? 'bg-[#0B6BFF]/20 text-white border border-[#0B6BFF]/50'
                  : 'bg-white/5 text-[#B0B8C4] hover:bg-white/10 border border-white/10'
                }
              `}
            >
              {mode === 'tires' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-[#0B6BFF]/20 rounded-xl border border-[#0B6BFF]/50"
                  style={{ boxShadow: '0 0 24px rgba(11,107,255,0.25)' }}
                />
              )}
              <span className="relative z-10">
                {language === 'fi' ? '🛞 Renkaat' : '🛞 Tires'}
              </span>
            </button>

            <button
              onClick={() => {
                setMode('rims');
                setFilters({});
                setCurrentPage(1);
              }}
              className={`
                relative px-8 py-3 rounded-xl transition-all duration-300
                ${mode === 'rims'
                  ? 'bg-[#0B6BFF]/20 text-white border border-[#0B6BFF]/50'
                  : 'bg-white/5 text-[#B0B8C4] hover:bg-white/10 border border-white/10'
                }
              `}
            >
              {mode === 'rims' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-[#0B6BFF]/20 rounded-xl border border-[#0B6BFF]/50"
                  style={{ boxShadow: '0 0 24px rgba(11,107,255,0.25)' }}
                />
              )}
              <span className="relative z-10">
                {language === 'fi' ? '⚙️ Vanteet' : '⚙️ Rims'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="container mx-auto max-w-7xl px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {mode === 'tires' ? (
              <div className="text-center mb-8">
                <h1 className="text-5xl lg:text-6xl mb-4 text-white">
                  {language === 'fi' ? 'Löydä Renkaasi' : 'Find Your Tires'}
                </h1>
                <p className="text-xl text-[#B0B8C4]">
                  {language === 'fi'
                    ? 'Valitse koon tai rekisterikilven perusteella löytääksesi täydellisen sopivuuden ajoneuvollesi.'
                    : 'Select by size or license plate to find the perfect fit for your vehicle.'}
                </p>
              </div>
            ) : (
              <div className="text-center mb-8">
                <h1 className="text-5xl lg:text-6xl mb-4 text-white">
                  {language === 'fi' ? 'Valitse Vanteesi' : 'Choose Your Rims'}
                </h1>
                <p className="text-xl text-[#B0B8C4]">
                  {language === 'fi'
                    ? 'Löydä täydelliset pyörät — tarkkuussuunniteltu tyyliin ja suorituskykyyn.'
                    : 'Find perfect-fit wheels — precision-engineered for style and performance.'}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Filters */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-8"
          >
            {mode === 'tires' ? (
              <TireFilters onFilterChange={handleFilterChange} />
            ) : (
              <RimFilters onFilterChange={handleFilterChange} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-[#B0B8C4]">
            {language === 'fi'
              ? `${totalCount} tuotetta löydetty`
              : `${totalCount} products found`}
          </p>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-[500px] rounded-2xl bg-white/5 backdrop-blur-sm animate-pulse"
              />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${mode}-${currentPage}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {mode === 'tires' ? (
                    <TireCard product={product} />
                  ) : (
                    <RimCard product={product} />
                  )}
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="text-center py-20">
            <p className="text-2xl text-[#B0B8C4] mb-4">
              {language === 'fi'
                ? 'Ei tuloksia hakuehdoillasi'
                : 'No products found with your filters'}
            </p>
            <Button
              onClick={() => {
                setFilters({});
                setCurrentPage(1);
              }}
              className="bg-[#0B6BFF] hover:bg-[#0B6BFF]/80"
            >
              {language === 'fi' ? 'Tyhjennä suodattimet' : 'Clear Filters'}
            </Button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-12">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              variant="outline"
              className="border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`
                      w-10 h-10 rounded-lg transition-all duration-200
                      ${currentPage === pageNum
                        ? 'bg-[#0B6BFF] text-white shadow-[0_0_24px_rgba(11,107,255,0.25)]'
                        : 'bg-white/5 text-[#B0B8C4] hover:bg-white/10'
                      }
                    `}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <Button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              className="border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
