import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { TireFilters } from './TireFilters';
import { RimFilters } from './RimFilters';
import { TireCard } from './TireCard';
import { RimCard } from './RimCard';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getSupabaseClient } from '../../utils/supabase/client';

type CatalogMode = 'tires' | 'rims';
type SearchMode = 'license' | 'vehicle' | 'manual';

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

// Demo data until products_search view is created
const DEMO_TIRES: Product[] = [
  {
    id: '1',
    brand: 'Nokian',
    model: 'Hakkapeliitta R5',
    product_type: 'tire',
    size_text: '205/55 R16 91H',
    eu_fuel: 'B',
    eu_wet: 'A',
    eu_noise: 68,
    season: 'winter',
    runflat: false,
    xl: false,
    studded: false,
    best_price_eur: 129.00,
    best_image_url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400',
    in_stock: true,
  },
  {
    id: '2',
    brand: 'Michelin',
    model: 'Pilot Sport 4',
    product_type: 'tire',
    size_text: '225/45 R17 94W',
    eu_fuel: 'C',
    eu_wet: 'A',
    eu_noise: 71,
    season: 'summer',
    runflat: false,
    xl: true,
    studded: false,
    best_price_eur: 159.00,
    best_image_url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400',
    in_stock: true,
  },
  {
    id: '3',
    brand: 'Continental',
    model: 'AllSeasonContact',
    product_type: 'tire',
    size_text: '195/65 R15 91H',
    eu_fuel: 'B',
    eu_wet: 'B',
    eu_noise: 70,
    season: 'all_season',
    runflat: false,
    xl: false,
    studded: false,
    best_price_eur: 99.00,
    best_image_url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400',
    in_stock: true,
  },
];

const DEMO_RIMS: Product[] = [
  {
    id: '4',
    brand: 'BBS',
    model: 'CH-R',
    product_type: 'rim',
    rim_width: 8,
    rim_diameter: 18,
    pcd: '5×112',
    et_offset: 35,
    cb: 66.6,
    color: 'silver',
    material: 'alloy',
    best_price_eur: 450.00,
    best_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    in_stock: true,
  },
  {
    id: '5',
    brand: 'OZ Racing',
    model: 'Superturismo GT',
    product_type: 'rim',
    rim_width: 7.5,
    rim_diameter: 17,
    pcd: '5×100',
    et_offset: 48,
    cb: 68.0,
    color: 'gunmetal',
    material: 'alloy',
    best_price_eur: 380.00,
    best_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    in_stock: true,
  },
];

export function CatalogPage() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [mode, setMode] = useState<CatalogMode>('tires');
  const [searchMode, setSearchMode] = useState<SearchMode>('manual');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<any>({});

  const supabase = getSupabaseClient();

  // Only fetch when search is explicitly triggered
  const handleSearch = () => {
    setHasSearched(true);
    setCurrentPage(1);
    fetchProducts();
  };

  useEffect(() => {
    if (hasSearched) {
      fetchProducts();
    }
  }, [currentPage]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Try to fetch from Supabase, fall back to demo data
      const { data, error, count } = await supabase
        .from('products_search')
        .select('*', { count: 'exact' })
        .range(0, 0);

      // If table doesn't exist, use demo data
      if (error && error.code === '42703') {
        console.log('Using demo data - products_search view not found');
        const demoData = mode === 'tires' ? DEMO_TIRES : DEMO_RIMS;
        setProducts(demoData);
        setTotalCount(demoData.length);
      } else {
        // Table exists, fetch real data with filters
        let query = supabase
          .from('products_search')
          .select('*', { count: 'exact' });

        // Apply filters
        if (filters.inStockOnly) {
          query = query.eq('in_stock', true);
        }

        if (filters.brand && filters.brand.length > 0) {
          query = query.in('brand', filters.brand);
        }

        // Tire-specific filters
        if (mode === 'tires') {
          if (filters.width && filters.width !== 'all') query = query.eq('width', filters.width);
          if (filters.aspectRatio && filters.aspectRatio !== 'all') query = query.eq('aspect_ratio', filters.aspectRatio);
          if (filters.diameter && filters.diameter !== 'all') query = query.eq('diameter', filters.diameter);
          if (filters.season && filters.season !== 'all') query = query.eq('season', filters.season);
          if (filters.runflat) query = query.eq('runflat', true);
          if (filters.xl) query = query.eq('xl', true);
          if (filters.studded) query = query.eq('studded', true);
          if (filters.search) {
            query = query.or(`brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
          }
        }

        // Rim-specific filters
        if (mode === 'rims') {
          if (filters.rimDiameter && filters.rimDiameter !== 'all') query = query.eq('rim_diameter', filters.rimDiameter);
          if (filters.rimWidth && filters.rimWidth !== 'all') query = query.eq('rim_width', filters.rimWidth);
          if (filters.pcd && filters.pcd !== 'all') query = query.eq('pcd', filters.pcd);
          if (filters.etOffset) query = query.eq('et_offset', filters.etOffset);
          if (filters.cb) query = query.eq('cb', filters.cb);
          if (filters.color && filters.color !== 'all') query = query.eq('color', filters.color);
          if (filters.material && filters.material !== 'all') query = query.eq('material', filters.material);
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

        const { data: realData, error: realError, count: realCount } = await query;

        if (realError) throw realError;

        setProducts(realData || []);
        setTotalCount(realCount || 0);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to demo data on any error
      const demoData = mode === 'tires' ? DEMO_TIRES : DEMO_RIMS;
      setProducts(demoData);
      setTotalCount(demoData.length);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  return (
    <div className={`min-h-screen ${
      theme === 'dark'
        ? 'bg-gradient-to-b from-[#0B0D10] to-[#161A22]'
        : 'bg-gradient-to-b from-white to-gray-50'
    }`}>
      {/* Mode Selector Tabs */}
      <div className={`sticky top-16 z-30 backdrop-blur-xl border-b ${
        theme === 'dark'
          ? 'bg-[#0B0D10]/80 border-white/5'
          : 'bg-white/80 border-gray-200'
      }`}>
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4 py-6">
            <button
              onClick={() => {
                setMode('tires');
                setFilters({});
                setHasSearched(false);
                setProducts([]);
              }}
              className={`
                relative px-8 py-3 rounded-xl transition-all duration-300
                ${mode === 'tires'
                  ? 'bg-[#FF6B35]/20 border border-[#FF6B35]/50'
                  : theme === 'dark'
                    ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                    : 'bg-gray-100 hover:bg-gray-200 border border-gray-300'
                }
                ${theme === 'dark' ? 'text-white' : mode === 'tires' ? 'text-[#FF6B35]' : 'text-gray-600'}
              `}
            >
              {mode === 'tires' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-[#FF6B35]/20 rounded-xl border border-[#FF6B35]/50"
                  style={{ boxShadow: '0 0 24px rgba(255,107,53,0.25)' }}
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
                setHasSearched(false);
                setProducts([]);
              }}
              className={`
                relative px-8 py-3 rounded-xl transition-all duration-300
                ${mode === 'rims'
                  ? 'bg-[#FF6B35]/20 border border-[#FF6B35]/50'
                  : theme === 'dark'
                    ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                    : 'bg-gray-100 hover:bg-gray-200 border border-gray-300'
                }
                ${theme === 'dark' ? 'text-white' : mode === 'rims' ? 'text-[#FF6B35]' : 'text-gray-600'}
              `}
            >
              {mode === 'rims' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-[#FF6B35]/20 rounded-xl border border-[#FF6B35]/50"
                  style={{ boxShadow: '0 0 24px rgba(255,107,53,0.25)' }}
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
                <h1 className={`text-5xl lg:text-6xl mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'Löydä Renkaasi' : 'Find Your Tires'}
                </h1>
                <p className={`text-xl ${theme === 'dark' ? 'text-[#B0B8C4]' : 'text-gray-600'}`}>
                  {language === 'fi'
                    ? 'Valitse hakutapa löytääksesi täydellisen sopivuuden ajoneuvollesi.'
                    : 'Choose your search method to find the perfect fit for your vehicle.'}
                </p>
              </div>
            ) : (
              <div className="text-center mb-8">
                <h1 className={`text-5xl lg:text-6xl mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'Valitse Vanteesi' : 'Choose Your Rims'}
                </h1>
                <p className={`text-xl ${theme === 'dark' ? 'text-[#B0B8C4]' : 'text-gray-600'}`}>
                  {language === 'fi'
                    ? 'Valitse hakutapa löytääksesi täydelliset pyörät.'
                    : 'Choose your search method to find perfect-fit wheels.'}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Search Mode Tabs */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <button
            onClick={() => setSearchMode('license')}
            className={`
              px-6 py-2.5 rounded-lg transition-all duration-200 text-sm
              ${searchMode === 'license'
                ? 'bg-[#FF6B35] text-white shadow-[0_0_20px_rgba(255,107,53,0.3)]'
                : theme === 'dark'
                  ? 'bg-white/5 text-[#B0B8C4] hover:bg-white/10 border border-white/10'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
              }
            `}
          >
            {language === 'fi' ? '🚗 Rekisteritunnus' : '🚗 License Plate'}
          </button>
          <button
            onClick={() => setSearchMode('manual')}
            className={`
              px-6 py-2.5 rounded-lg transition-all duration-200 text-sm
              ${searchMode === 'manual'
                ? 'bg-[#FF6B35] text-white shadow-[0_0_20px_rgba(255,107,53,0.3)]'
                : theme === 'dark'
                  ? 'bg-white/5 text-[#B0B8C4] hover:bg-white/10 border border-white/10'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
              }
            `}
          >
            {language === 'fi' ? '⚙️ Manuaalinen haku' : '⚙️ Manual Search'}
          </button>
        </div>

        {/* Filters */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${mode}-${searchMode}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-8"
          >
            {mode === 'tires' ? (
              <TireFilters 
                onFilterChange={handleFilterChange} 
                onSearch={handleSearch}
                searchMode={searchMode}
              />
            ) : (
              <RimFilters 
                onFilterChange={handleFilterChange}
                onSearch={handleSearch}
                searchMode={searchMode}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Results Count */}
        {hasSearched && (
          <div className="flex items-center justify-between mb-6">
            <p className={theme === 'dark' ? 'text-[#B0B8C4]' : 'text-gray-600'}>
              {language === 'fi'
                ? `${totalCount} tuotetta löydetty`
                : `${totalCount} products found`}
            </p>
          </div>
        )}

        {/* Empty State - Before Search */}
        {!hasSearched && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#FF6B35]/10 flex items-center justify-center">
              <span className="text-5xl">🔍</span>
            </div>
            <h3 className={`text-2xl mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {language === 'fi' ? 'Aloita haku' : 'Start Your Search'}
            </h3>
            <p className={`max-w-md mx-auto ${theme === 'dark' ? 'text-[#B0B8C4]' : 'text-gray-600'}`}>
              {language === 'fi'
                ? 'Valitse hakutapa yllä ja täytä tiedot löytääksesi sopivat tuotteet.'
                : 'Select a search method above and fill in the details to find matching products.'}
            </p>
          </div>
        )}

        {/* Product Grid */}
        {hasSearched && loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`h-[500px] rounded-2xl backdrop-blur-sm animate-pulse ${
                  theme === 'dark' ? 'bg-white/5' : 'bg-gray-200'
                }`}
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

        {/* Empty State - No Results */}
        {hasSearched && !loading && products.length === 0 && (
          <div className="text-center py-20">
            <p className={`text-2xl mb-4 ${theme === 'dark' ? 'text-[#B0B8C4]' : 'text-gray-600'}`}>
              {language === 'fi'
                ? 'Ei tuloksia hakuehdoillasi'
                : 'No products found with your filters'}
            </p>
            <Button
              onClick={() => {
                setFilters({});
                setHasSearched(false);
                setProducts([]);
              }}
              className="bg-[#FF6B35] hover:bg-[#FF6B35]/80"
            >
              {language === 'fi' ? 'Tyhjennä haku' : 'Clear Search'}
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
              className={`disabled:opacity-30 ${
                theme === 'dark'
                  ? 'border-white/10 bg-white/5 hover:bg-white/10'
                  : 'border-gray-300 bg-gray-100 hover:bg-gray-200'
              }`}
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
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`
                      w-10 h-10 rounded-lg transition-all duration-200
                      ${currentPage === pageNum
                        ? 'bg-[#FF6B35] text-white shadow-[0_0_24px_rgba(255,107,53,0.25)]'
                        : theme === 'dark'
                          ? 'bg-white/5 text-[#B0B8C4] hover:bg-white/10'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
              className={`disabled:opacity-30 ${
                theme === 'dark'
                  ? 'border-white/10 bg-white/5 hover:bg-white/10'
                  : 'border-gray-300 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
