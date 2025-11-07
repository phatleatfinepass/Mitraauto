import React from 'react';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';
import { motion } from 'motion/react';
import svgPaths from '../../imports/svg-a1qm6qb0np';
import mockupRimImage from 'figma:asset/a7d07b92f4849dcd91f999211a4f6982cfd3f72f.png';

interface RimCardProps {
  product: {
    id: string;
    brand: string;
    model: string;
    rim_width?: number;
    rim_diameter?: number;
    pcd?: string;
    et_offset?: number;
    cb?: number;
    color?: string;
    material?: string;
    best_price_eur?: number;
    best_image_url: string;
    in_stock: boolean;
  };
  index?: number;
}

export function RimCard({ product, index = 0 }: RimCardProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();

  // Calculate 4-piece price
  const fourPiecePrice = (product.best_price_eur || 0) * 4;

  // Format size parts
  const getSizeParts = () => {
    const parts = [];
    if (product.rim_width) parts.push(product.rim_width.toString());
    if (product.rim_diameter) parts.push(`${product.rim_diameter}"`);
    if (product.et_offset) parts.push(`ET${product.et_offset}`);
    if (product.pcd) parts.push(product.pcd);
    return parts;
  };

  const sizeParts = getSizeParts();

  const getMaterialLabel = (material?: string) => {
    if (!material) return '';
    const labels = {
      alloy: language === 'fi' ? 'Alumiini' : 'Aluminum',
      steel: language === 'fi' ? 'Teräs' : 'Steel',
    };
    return labels[material.toLowerCase() as keyof typeof labels] || material;
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4 }}
      className="group relative h-full"
    >
      <div className={`relative rounded-[24px] size-full transition-all duration-500 ${theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-gray-50'} ${theme === 'dark' ? 'group-hover:shadow-[0_8px_32px_rgba(11,107,255,0.15)]' : 'group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]'}`}>
        <div className="size-full">
          <div className="box-border content-stretch flex flex-col gap-[24px] items-start overflow-clip p-[24px] relative size-full">
            
            {/* Top Section: Brand, Model, Size */}
            <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
              {/* Brand */}
              <div className="content-stretch flex items-start relative shrink-0 w-full">
                <p className={`basis-0 font-semibold grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[24px] tracking-[-0.7125px] ${
                  theme === 'dark' ? 'text-white' : 'text-[#101828]'
                }`}>
                  {product.brand}
                </p>
              </div>

              {/* Model */}
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full">
                <p className={`font-normal leading-[20px] not-italic relative shrink-0 text-[14px] text-nowrap tracking-[-0.1784px] whitespace-pre ${
                  theme === 'dark' ? 'text-gray-400' : 'text-[#4a5565]'
                }`}>
                  {product.model}
                </p>
              </div>

              {/* Size and CB */}
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                {/* Size */}
                <div className="content-stretch flex font-normal items-center leading-[20px] not-italic relative rounded-[16px] shrink-0 text-[14px] text-nowrap tracking-[-0.1504px] whitespace-pre">
                  {sizeParts.map((part, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && idx < sizeParts.length && (
                        <p className={`relative shrink-0 mx-[4px] ${theme === 'dark' ? 'text-white' : 'text-[#101828]'}`}>
                          {idx === 1 ? '×' : ' '}
                        </p>
                      )}
                      <p className={`relative shrink-0 ${theme === 'dark' ? 'text-white' : 'text-[#101828]'}`}>{part}</p>
                    </React.Fragment>
                  ))}
                </div>

                {/* CB Badge */}
                {product.cb && (
                  <div className="box-border content-stretch flex flex-col gap-[16px] items-start px-[8px] py-[4px] relative rounded-[8px] shrink-0 transition-all duration-300 group-hover:scale-105">
                    <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[8px] ${
                      theme === 'dark' ? 'border-[#0B6BFF]/30' : 'border-[#bedbff]'
                    }`} />
                    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0">
                      <p className={`font-normal leading-[13.5px] not-italic relative shrink-0 text-[9px] text-center text-nowrap tracking-[0.167px] uppercase whitespace-pre ${
                        theme === 'dark' ? 'text-[#60A5FA]' : 'text-[#1447e6]'
                      }`}>
                        CB: {product.cb}<span className="lowercase">mm</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Image and Bottom Section */}
            <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
              {/* Image */}
              <div className="bg-white h-[193px] relative rounded-[16px] shrink-0 w-full">
                <div className="overflow-clip relative rounded-[inherit] size-full">
                  <div className="absolute left-[calc(50%+0.5px)] size-[193px] top-1/2 translate-x-[-50%] translate-y-[-50%] transition-transform duration-700 group-hover:scale-110">
                    <img 
                      alt={`${product.brand} ${product.model}`}
                      className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" 
                      src={mockupRimImage} 
                    />
                  </div>
                </div>
                <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[16px] ${
                  theme === 'dark' ? 'border-[rgba(229,231,235,0.1)]' : 'border-[rgba(229,231,235,0.5)]'
                }`} />
              </div>

              {/* Price Container */}
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full">
                <div className="basis-0 grow min-h-px min-w-px relative rounded-[16px] shrink-0 transition-all duration-300 group-hover:scale-[1.02]">
                  <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[16px] ${
                    theme === 'dark' ? 'border-[#FF6B35]/30' : 'border-[#ffd6a7]'
                  }`} />
                  <div className="size-full">
                    <div className="box-border content-stretch flex gap-[16px] items-start p-[12px] relative w-full">
                      {/* Price */}
                      <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0">
                        {/* Euro Icon */}
                        <div className="relative shrink-0 size-[16px]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                            <path d={svgPaths.p4b3b540} stroke={theme === 'dark' ? '#FF6B35' : '#FF6B35'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                          </svg>
                        </div>
                        
                        {/* Value */}
                        <div className="h-[26px] relative shrink-0">
                          <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[10px] h-[26px] items-center justify-center relative">
                            <p className={`font-medium leading-[28px] not-italic relative shrink-0 text-[18px] text-center text-nowrap tracking-[-0.4395px] whitespace-pre ${
                              theme === 'dark' ? 'text-white' : 'text-[#101828]'
                            }`}>
                              {(product.best_price_eur || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        
                        {/* 4PCS Label */}
                        <div className="basis-0 grow min-h-px min-w-px relative shrink-0">
                          <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[10px] items-center justify-end relative w-full">
                            <p className={`font-normal leading-[13.5px] not-italic relative shrink-0 text-[9px] text-center text-nowrap tracking-[0.167px] uppercase whitespace-pre ${
                              theme === 'dark' ? 'text-[#B0B8C4]' : 'text-[#6a7282]'
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

              {/* Bottom: Badges and Button */}
              <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full">
                {/* Material & Color Badges */}
                <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full transition-all duration-300 group-hover:scale-105">
                  {/* Color Badge - Always rendered, opacity 0 if no color */}
                  <div className={`box-border content-stretch flex gap-[8px] items-center px-[8px] py-[4px] relative rounded-[8px] shrink-0 transition-opacity ${
                    theme === 'dark' ? 'bg-[rgba(250,250,250,0.05)]' : 'bg-[rgba(250,250,250,0.2)]'
                  } ${!product.color ? 'opacity-0' : 'opacity-100'}`}>
                    <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[8px] ${
                      theme === 'dark' ? 'border-[rgba(106,114,130,0.2)]' : 'border-[rgba(106,114,130,0.3)]'
                    }`} />
                    <div className="capitalize content-stretch flex font-normal gap-[2px] items-center justify-center leading-[13.5px] not-italic relative shrink-0 text-[9px] text-center text-nowrap tracking-[0.167px] whitespace-pre">
                      <p className={`relative shrink-0 ${theme === 'dark' ? 'text-[#B0B8C4]' : 'text-[#99a1af]'}`}>
                        {language === 'fi' ? 'Väri' : 'Color'}:
                      </p>
                      <p className={`relative shrink-0 ${theme === 'dark' ? 'text-[#B0B8C4]' : 'text-[#99a1af]'}`}>
                        {product.color || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Material Badge - Always rendered, opacity 0 if no material */}
                  <div className={`box-border content-stretch flex gap-[8px] items-center px-[8px] py-[4px] relative rounded-[8px] shrink-0 transition-opacity ${
                    theme === 'dark' ? 'bg-[rgba(250,250,250,0.05)]' : 'bg-[rgba(250,250,250,0.2)]'
                  } ${!product.material ? 'opacity-0' : 'opacity-100'}`}>
                    <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[8px] ${
                      theme === 'dark' ? 'border-[rgba(106,114,130,0.2)]' : 'border-[rgba(106,114,130,0.3)]'
                    }`} />
                    <div className="capitalize content-stretch flex font-normal gap-[2px] items-center justify-center leading-[13.5px] not-italic relative shrink-0 text-[9px] text-center text-nowrap tracking-[0.167px] whitespace-pre">
                      <p className={`relative shrink-0 ${theme === 'dark' ? 'text-[#B0B8C4]' : 'text-[#99a1af]'}`}>
                        {language === 'fi' ? 'Materiaali' : 'Material'}:
                      </p>
                      <p className={`relative shrink-0 ${theme === 'dark' ? 'text-[#B0B8C4]' : 'text-[#99a1af]'}`}>
                        {getMaterialLabel(product.material) || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Add Button */}
                <button
                  disabled={!product.in_stock}
                  className="bg-[#ff6b35] box-border content-stretch flex gap-[14px] h-[40px] items-center justify-center relative rounded-[25px] shadow-[0px_4px_12px_0px_rgba(255,107,53,0.25)] hover:shadow-[0px_6px_16px_0px_rgba(255,107,53,0.35)] shrink-0 w-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group/button hover:bg-[#ff6b35]/90"
                >
                  {/* Shopping Cart Icon */}
                  <div className="relative shrink-0 size-[16px] transition-transform duration-300 group-hover/button:rotate-12">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                      <g clipPath="url(#clip0_201_4500)">
                        <path d={svgPaths.p22b32180} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                        <path d={svgPaths.pceec000} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                        <path d={svgPaths.p35e3f800} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                      </g>
                      <defs>
                        <clipPath id="clip0_201_4500">
                          <rect fill="white" height="16" width="16" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                  
                  {/* Button Text */}
                  <div className="h-[20px] relative shrink-0">
                    <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[20px] relative">
                      <p className="absolute font-semibold leading-[20px] left-0 not-italic text-[14px] text-nowrap text-white top-[0.5px] tracking-[-0.2904px] whitespace-pre">
                        {product.in_stock 
                          ? (language === 'fi' ? 'Lisää' : 'Add')
                          : (language === 'fi' ? 'Loppu' : 'Sold Out')
                        }
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Border */}
        <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[24px] transition-all duration-500 ${
          theme === 'dark' 
            ? 'border-[rgba(229,231,235,0.1)] group-hover:border-[#0B6BFF]/50' 
            : 'border-[rgba(229,231,235,0.8)] group-hover:border-[#0B6BFF]/30'
        }`} />
      </div>
    </motion.div>
  );
}
