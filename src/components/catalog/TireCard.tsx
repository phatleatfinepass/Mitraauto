import React from 'react';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';
import { motion } from 'motion/react';
import { ShoppingCart, PackageX, Sun, Snowflake, SunSnow } from 'lucide-react';
import svgPaths from '../../imports/svg-eon971h5o4';
import { buildProductImageFallback } from '../../utils/productImage';
import { calculateLinePricing, type ProductPricingRules } from '../../utils/pricing';

interface TireCardProps {
  product?: {
    id: string;
    brand: string;
    model: string;
    size_text?: string;
    season?: string;
    runflat?: boolean;
    xl?: boolean;
    studded?: boolean;
    ev_ready?: boolean;
    threepmsf?: boolean;
    winter_approved?: boolean;
    ice_approved?: boolean;
    load_index?: string;
    speed_rating?: string;
    eu_fuel?: string;
    eu_wet?: string;
    eu_noise?: number;
    best_price_eur?: number;
    pricing_rules?: ProductPricingRules | null;
    best_image_url: string;
    in_stock: boolean;
  };
  href?: string;
  index?: number;
  onClick?: () => void;
  onAddToCart?: (e: React.MouseEvent) => void;
  disableInitialAnimation?: boolean;
}

const PREVIEW_TIRE_PRODUCT: NonNullable<TireCardProps['product']> = {
  id: 'preview-tire',
  brand: 'Nokian',
  model: 'Hakkapeliitta R5',
  size_text: '205/55 R16',
  season: 'winter',
  best_price_eur: 119,
  best_image_url: '',
  in_stock: true,
};

export function TireCard({ product: productProp, href, index: _index = 0, onClick, onAddToCart, disableInitialAnimation = false }: TireCardProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const product = productProp ?? PREVIEW_TIRE_PRODUCT;

  const fallbackImage = React.useMemo(
    () => buildProductImageFallback(product.brand, product.model),
    [product.brand, product.model]
  );
  const [cardImageSrc, setCardImageSrc] = React.useState(product.best_image_url || fallbackImage);

  React.useEffect(() => {
    setCardImageSrc(product.best_image_url || fallbackImage);
  }, [product.best_image_url, fallbackImage]);

  const getSeasonLabel = (season?: string) => {
    if (!season) return '';
    const labels = {
      summer: language === 'fi' ? 'Kesä' : 'Summer',
      winter: language === 'fi' ? 'Talvi' : 'Winter',
      all_season: language === 'fi' ? 'Ympärivuotinen' : 'All Season',
    };
    return labels[season.toLowerCase() as keyof typeof labels] || season;
  };

  const getSeasonIcon = (season?: string) => {
    if (!season) return null;
    const seasonLower = season.toLowerCase();
    
    if (seasonLower === 'summer') {
      return <Sun className="w-4 h-4" strokeWidth={2} />;
    } else if (seasonLower === 'winter') {
      return <Snowflake className="w-4 h-4" strokeWidth={2} />;
    } else if (seasonLower === 'all_season') {
      return <SunSnow className="w-4 h-4" strokeWidth={2} />;
    }
    return null;
  };

  const getSeasonColor = (season?: string) => {
    if (!season) return theme === 'dark' ? '#fff' : '#101828';
    const seasonLower = season.toLowerCase();
    
    if (seasonLower === 'summer') {
      return '#F59E0B'; // Amber (better visibility in light mode)
    } else if (seasonLower === 'winter') {
      return '#60A5FA'; // Blue
    } else if (seasonLower === 'all_season') {
      return '#FF6B35'; // Brand Orange
    }
    return theme === 'dark' ? '#fff' : '#101828';
  };

  const sizeText = product.size_text?.trim() || '—';

  // EU label values (optional)
  const euFuel = product.eu_fuel;
  const euWet = product.eu_wet;
  const euNoise = product.eu_noise;
  const hasEuLabel = euFuel !== undefined || euWet !== undefined || euNoise !== undefined;

  // Calculate 4-piece price
  const fourPiecePrice = calculateLinePricing(
    product.best_price_eur || 0,
    4,
    product.pricing_rules ?? null,
  ).lineTotalEur;

  const featureBadges = [
    { key: 'ev', show: Boolean(product.ev_ready), label: 'EV' },
    { key: 'runflat', show: Boolean(product.runflat), label: 'RunFlat' },
    { key: 'xl', show: Boolean(product.xl), label: 'XL' },
    { key: 'studded', show: Boolean(product.studded), label: language === 'fi' ? 'Nastat' : 'Studded' },
    { key: 'threepmsf', show: Boolean(product.threepmsf), label: '3PMSF' },
    { key: 'winter', show: Boolean(product.winter_approved) && !Boolean(product.studded), label: 'M+S' },
    { key: 'ice', show: Boolean(product.ice_approved), label: language === 'fi' ? 'Jää' : 'Ice Approved' },
  ].filter((badge) => badge.show);

  const handleCardLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!onClick) return;
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    onClick();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  const interactiveProps = onClick && !href
    ? {
        role: 'button' as const,
        tabIndex: 0,
        onClick: (event: React.MouseEvent<HTMLDivElement>) => {
          event.preventDefault();
          onClick();
        },
        onKeyDown: handleKeyDown,
      }
    : {};

  return (
    <motion.div
      initial={disableInitialAnimation ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: disableInitialAnimation ? 0 : 0.4 }}
      whileHover={{ y: -4 }}
      className={`group relative h-full ${
        onClick ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF6B35]' : ''
      }`}
      {...interactiveProps}
    >
      {href && (
        <a
          href={href}
          aria-label={`${product.brand} ${product.model}`}
          className="absolute inset-0 z-10 rounded-[16px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF6B35] sm:rounded-[24px]"
          onClick={handleCardLinkClick}
        />
      )}
      <div className={`relative size-full rounded-[16px] transition-all duration-500 sm:rounded-[24px] ${theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-gray-50'} ${theme === 'dark' ? 'group-hover:shadow-[0_8px_32px_rgba(255,107,53,0.15)]' : 'group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]'}`}>
        <div className="size-full">
          <div className="relative box-border flex size-full flex-col items-start gap-3 overflow-clip p-3 sm:gap-[24px] sm:p-[24px]">
            
            {/* Top Section: Brand, Model, Size */}
            <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
              {/* Brand */}
              <div className="content-stretch flex items-start relative shrink-0 w-full">
                <p className={`basis-0 font-semibold grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[17px] tracking-[-0.4px] sm:text-[24px] sm:tracking-[-0.7125px] ${
                  theme === 'dark' ? 'text-white' : 'text-[#101828]'
                }`}>
                  {product.brand}
                </p>
              </div>

              {/* Model */}
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full">
                <p className={`relative line-clamp-1 min-w-0 shrink font-normal text-[12px] leading-[16px] tracking-[-0.1784px] sm:text-[14px] sm:leading-[20px] ${
                  theme === 'dark' ? 'text-gray-400' : 'text-[#4a5565]'
                }`}>
                  {product.model}
                </p>
              </div>

              {/* Size and Season */}
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                {/* Size */}
                <div className="content-stretch flex font-normal items-center leading-[18px] not-italic relative rounded-[16px] shrink-0 text-[12px] text-nowrap tracking-[-0.1504px] whitespace-pre sm:text-[14px] sm:leading-[20px]">
                  <p className={`relative shrink-0 ${theme === 'dark' ? 'text-white' : 'text-[#101828]'}`}>
                    {sizeText}
                  </p>
                </div>

                {/* Season Badge */}
                {product.season && (
                  <div className="box-border content-stretch flex gap-1 items-center justify-center p-[2px] relative shrink-0 transition-all duration-300 group-hover:scale-105">
                    <div className="relative hidden shrink-0 size-[16px] transition-transform duration-300 group-hover:rotate-12 sm:block" style={{ color: getSeasonColor(product.season) }}>
                      {getSeasonIcon(product.season)}
                    </div>
                    <div className="relative shrink-0">
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[10px] items-center justify-center relative">
                        <p className={`font-semibold leading-[14px] not-italic relative shrink-0 text-[10px] text-center text-nowrap uppercase whitespace-pre transition-colors duration-300 sm:text-[12px] sm:leading-[16px]`}
                           style={{ color: getSeasonColor(product.season) }}>
                          {getSeasonLabel(product.season)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Image and Label Section */}
            <div className="content-stretch flex flex-col gap-3 items-start relative shrink-0 w-full sm:gap-[16px]">
              
              {/* Tire Image */}
              <div className="aspect-[1.2] bg-white relative rounded-[12px] shrink-0 w-full sm:aspect-[248/157] sm:rounded-[16px]">
                <div className="aspect-[248/157] overflow-clip relative rounded-[inherit] size-full">
                  <div className="absolute top-2 w-full aspect-square sm:top-[16px]">
                    <img
                      src={cardImageSrc}
                      alt={`${product.brand} ${product.model}`}
                      onError={() => {
                        if (cardImageSrc !== fallbackImage) {
                          setCardImageSrc(fallbackImage);
                        }
                      }}
                      className="w-full h-full object-contain pointer-events-none transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                </div>
                <div 
                  aria-hidden="true" 
                  className={`absolute border border-solid inset-0 pointer-events-none rounded-[12px] transition-all duration-500 sm:rounded-[16px] ${
                    theme === 'dark' ? 'border-white/10 group-hover:border-white/20' : 'border-[rgba(229,231,235,0.5)] group-hover:border-gray-300'
                  }`} 
                />
              </div>

              {/* EU Label & Price Container */}
              <div className="content-stretch flex gap-2 items-center relative shrink-0 w-full sm:gap-[12px]">
                
                {/* EU Label */}
                {hasEuLabel && (
                  <div className="relative hidden min-h-px min-w-px basis-0 grow shrink-0 rounded-[16px] sm:block">
                    <div 
                      aria-hidden="true" 
                      className={`absolute border border-solid inset-0 pointer-events-none rounded-[16px] transition-all duration-500 ${
                        theme === 'dark' ? 'border-blue-400/30 group-hover:border-blue-400/60 group-hover:shadow-[0_0_16px_rgba(96,165,250,0.2)]' : 'border-[#bedbff] group-hover:border-blue-400/50 group-hover:shadow-[0_0_16px_rgba(96,165,250,0.15)]'
                      }`} 
                    />
                    <div className="size-full">
                      <div className="box-border content-stretch flex flex-col gap-[16px] items-start p-[12px] relative w-full">
                        {/* EU Metrics */}
                        <div className="content-stretch flex h-[64px] items-center justify-between relative shrink-0 w-full">
                          {/* Fuel */}
                          {euFuel && (
                            <div className="content-stretch flex flex-col gap-[4px] h-full items-center relative shrink-0 w-[21.016px]">
                              <div className="relative shrink-0 size-[16px]">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                                  <path 
                                    d={svgPaths.p6a97700} 
                                    stroke={theme === 'dark' ? '#60A5FA' : '#155DFC'} 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="1.33333" 
                                  />
                                  <path 
                                    d={svgPaths.p28f0ce80} 
                                    stroke={theme === 'dark' ? '#60A5FA' : '#155DFC'} 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="1.33333" 
                                  />
                                  <path 
                                    d="M1.33315 14H9.99981" 
                                    stroke={theme === 'dark' ? '#60A5FA' : '#155DFC'} 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="1.33333" 
                                  />
                                  <path 
                                    d="M2 6H9.33333" 
                                    stroke={theme === 'dark' ? '#60A5FA' : '#155DFC'} 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="1.33333" 
                                  />
                                </svg>
                              </div>
                              <div className="h-[26px] relative shrink-0">
                                <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[10px] h-[26px] items-center justify-center relative">
                                  <p className={`font-normal leading-[28px] not-italic relative shrink-0 text-[18px] text-center text-nowrap tracking-[-0.4395px] whitespace-pre ${
                                    theme === 'dark' ? 'text-white' : 'text-[#101828]'
                                  }`}>
                                    {euFuel}
                                  </p>
                                </div>
                              </div>
                              <div className="relative shrink-0">
                                <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[10px] items-center justify-center relative">
                                  <p className={`font-normal leading-[13.5px] not-italic relative shrink-0 text-[9px] text-center text-nowrap tracking-[0.167px] uppercase whitespace-pre ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-[#6a7282]'
                                  }`}>
                                    {language === 'fi' ? 'POLT' : 'fuel'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Wet */}
                          {euWet && (
                            <div className="content-stretch flex flex-col gap-[4px] h-full items-center relative shrink-0 w-[21.016px]">
                              <div className="relative shrink-0 size-[16px]">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                                  <path 
                                    d={svgPaths.p23197080} 
                                    stroke={theme === 'dark' ? '#60A5FA' : '#155DFC'} 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="1.33333" 
                                  />
                                  <path 
                                    d={svgPaths.p24cd0280} 
                                    stroke={theme === 'dark' ? '#60A5FA' : '#155DFC'} 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="1.33333" 
                                  />
                                </svg>
                              </div>
                              <div className="h-[26px] relative shrink-0">
                                <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[10px] h-[26px] items-center justify-center relative">
                                  <p className={`font-normal leading-[28px] not-italic relative shrink-0 text-[18px] text-center text-nowrap tracking-[-0.4395px] whitespace-pre ${
                                    theme === 'dark' ? 'text-white' : 'text-[#101828]'
                                  }`}>
                                    {euWet}
                                  </p>
                                </div>
                              </div>
                              <div className="relative shrink-0">
                                <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[10px] items-center justify-center relative">
                                  <p className={`font-normal leading-[13.5px] not-italic relative shrink-0 text-[9px] text-center text-nowrap tracking-[0.167px] uppercase whitespace-pre ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-[#6a7282]'
                                  }`}>
                                    {language === 'fi' ? 'MRKÄ' : 'WeT'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Noise */}
                          {euNoise !== undefined && (
                            <div className="content-stretch flex flex-col gap-[4px] h-full items-center relative shrink-0 w-[21.016px]">
                              <div className="relative shrink-0 size-[16px]">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                                  <path 
                                    d={svgPaths.p17ed0900} 
                                    stroke={theme === 'dark' ? '#60A5FA' : '#155DFC'} 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="1.33333" 
                                  />
                                  <path 
                                    d={svgPaths.p1ef0e180} 
                                    stroke={theme === 'dark' ? '#60A5FA' : '#155DFC'} 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="1.33333" 
                                  />
                                  <path 
                                    d={svgPaths.p37402580} 
                                    stroke={theme === 'dark' ? '#60A5FA' : '#155DFC'} 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="1.33333" 
                                  />
                                </svg>
                              </div>
                              <div className="h-[26px] relative shrink-0">
                                <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[10px] h-[26px] items-center justify-center relative">
                                  <p className={`font-normal leading-[28px] not-italic relative shrink-0 text-[18px] text-center text-nowrap tracking-[-0.4395px] whitespace-pre ${
                                    theme === 'dark' ? 'text-white' : 'text-[#101828]'
                                  }`}>
                                    {Math.round(euNoise)}
                                  </p>
                                </div>
                              </div>
                              <div className="relative shrink-0">
                                <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[10px] items-center justify-center relative">
                                  <p className={`font-normal leading-[13.5px] not-italic relative shrink-0 text-[9px] text-center text-nowrap tracking-[0.167px] uppercase whitespace-pre ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-[#6a7282]'
                                  }`}>
                                    DB
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Price Container */}
                <div className="relative min-h-px min-w-px basis-full grow shrink-0 rounded-[12px] sm:basis-0 sm:rounded-[16px]">
                  <div 
                    aria-hidden="true" 
                    className={`absolute border border-solid inset-0 pointer-events-none rounded-[12px] transition-all duration-500 sm:rounded-[16px] ${
                      theme === 'dark' ? 'border-orange-400/30 group-hover:border-orange-400/60 group-hover:shadow-[0_0_16px_rgba(255,107,53,0.2)]' : 'border-[#ffd6a7] group-hover:border-orange-400/50 group-hover:shadow-[0_0_16px_rgba(255,107,53,0.15)]'
                    }`} 
                  />
                  <div className="size-full">
                    <div className="box-border content-stretch flex flex-col gap-2 items-start p-2 relative w-full sm:gap-[16px] sm:p-[12px]">
                      {/* Price */}
                      <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
                        {/* Euro Icon */}
                        <div className="relative shrink-0 size-3.5 sm:size-[16px]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                            <path 
                              d={svgPaths.p4b3b540} 
                              stroke="#FF6B35" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth="1.33333" 
                            />
                          </svg>
                        </div>
                        
                        {/* Price Value */}
                        <div className="h-[26px] relative shrink-0">
                          <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[10px] h-[26px] items-center justify-center relative">
                            <p className={`font-medium leading-[24px] not-italic relative shrink-0 text-[16px] text-center text-nowrap tracking-[-0.4395px] whitespace-pre sm:text-[18px] sm:leading-[28px] ${
                              theme === 'dark' ? 'text-white' : 'text-[#101828]'
                            }`}>
                              {(product.best_price_eur || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        
                        {/* 4-Piece Price */}
                        <div className="relative shrink-0">
                          <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[10px] items-center justify-center relative">
                            <p className={`font-normal leading-[13.5px] not-italic relative shrink-0 text-[9px] text-center text-nowrap tracking-[0.167px] uppercase whitespace-pre ${
                              theme === 'dark' ? 'text-gray-400' : 'text-[#6a7282]'
                            }`}>
                              {fourPiecePrice.toFixed(2)} €/4PCS
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom: Feature Badges & Add Button */}
              <div className="content-stretch flex flex-col gap-3 items-start relative mt-auto shrink-0 w-full sm:gap-[20px]">
                
                {/* Feature Badges */}
                <div className="content-stretch flex min-h-[24px] flex-wrap items-start gap-1.5 relative shrink-0 w-full sm:min-h-[30px] sm:gap-2">
                  {featureBadges.map((badge) => (
                    <div key={badge.key} className={`box-border content-stretch flex gap-[8px] items-center px-1.5 py-1 relative rounded-[8px] shrink-0 transition-all duration-300 sm:px-[8px] sm:py-[4px] ${
                      theme === 'dark' ? 'bg-white/5 group-hover:bg-white/10' : 'bg-[rgba(250,250,250,0.2)] group-hover:bg-white/60'
                    }`}>
                      <div 
                        aria-hidden="true" 
                        className={`absolute border border-solid inset-0 pointer-events-none rounded-[8px] transition-colors duration-300 ${
                          theme === 'dark' ? 'border-white/20 group-hover:border-white/40' : 'border-[rgba(106,114,130,0.3)] group-hover:border-gray-400'
                        }`} 
                      />
                      <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0">
                        <div className="relative shrink-0">
                          <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[10px] items-center justify-center relative">
                            <p className={`font-normal leading-[13.5px] not-italic relative shrink-0 text-[9px] text-center text-nowrap tracking-[0.167px] uppercase whitespace-pre ${
                              theme === 'dark' ? 'text-gray-400' : 'text-[#99a1af]'
                            }`}>
                              {badge.label}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Button */}
                <button
                  disabled={!product.in_stock}
                  className="pointer-events-auto z-20 bg-[#ff6b35] hover:bg-[#ff6b35]/90 box-border content-stretch flex gap-2 h-9 items-center justify-center relative rounded-[25px] shadow-[0px_4px_12px_0px_rgba(255,107,53,0.25)] shrink-0 w-full text-white transition-all duration-300 hover:shadow-[0px_6px_20px_0px_rgba(255,107,53,0.35)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 sm:h-[40px] sm:gap-[14px]"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onAddToCart?.(event);
                  }}
                >
                  {product.in_stock ? (
                    <>
                      <div className="relative shrink-0 size-[16px]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                          <g clipPath="url(#clip0_cart)">
                            <path 
                              d={svgPaths.p22b32180} 
                              stroke="white" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth="1.33333" 
                            />
                            <path 
                              d={svgPaths.pceec000} 
                              stroke="white" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth="1.33333" 
                            />
                            <path 
                              d={svgPaths.p35e3f800} 
                              stroke="white" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth="1.33333" 
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_cart">
                              <rect fill="white" height="16" width="16" />
                            </clipPath>
                          </defs>
                        </svg>
                      </div>
                      <div className="h-[20px] relative shrink-0">
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[20px] relative">
                          <p className="font-semibold leading-[20px] not-italic text-[14px] text-nowrap tracking-[-0.2904px] whitespace-pre">
                            {language === 'fi' ? 'Lisää' : 'Add'}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative shrink-0 size-[16px]">
                        <PackageX className="w-full h-full" strokeWidth={1.33333} />
                      </div>
                      <div className="h-[20px] relative shrink-0">
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[20px] relative">
                          <p className="font-semibold leading-[20px] not-italic text-[14px] text-nowrap tracking-[-0.2904px] whitespace-pre">
                            {language === 'fi' ? 'Loppu' : 'Out'}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Border */}
        <div 
          aria-hidden="true" 
          className={`absolute border border-solid inset-0 pointer-events-none rounded-[16px] transition-all duration-500 sm:rounded-[24px] ${
            theme === 'dark' ? 'border-white/10 group-hover:border-orange-400/30' : 'border-[rgba(229,231,235,0.8)] group-hover:border-orange-400/20'
          }`} 
        />
      </div>
    </motion.div>
  );
}
