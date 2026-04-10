import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';
import { buildProductImageFallback } from '../../utils/productImage';
import { calculateLinePricing, type ProductPricingRules } from '../../utils/pricing';

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
    pricing_rules?: ProductPricingRules | null;
    best_image_url: string;
    in_stock: boolean;
  };
  index?: number;
  onClick?: () => void;
  onAddToCart?: (e: React.MouseEvent) => void;
}

export function RimCard({ product, index: _index = 0, onClick, onAddToCart }: RimCardProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const fallbackImage = React.useMemo(
    () => buildProductImageFallback(product.brand, product.model),
    [product.brand, product.model]
  );
  const [cardImageSrc, setCardImageSrc] = React.useState(product.best_image_url || fallbackImage);

  React.useEffect(() => {
    setCardImageSrc(product.best_image_url || fallbackImage);
  }, [product.best_image_url, fallbackImage]);

  const fourPiecePrice = calculateLinePricing(
    product.best_price_eur || 0,
    4,
    product.pricing_rules ?? null,
  ).lineTotalEur;

  const sizeLabel = [product.rim_width, product.rim_diameter ? `${product.rim_diameter}"` : undefined]
    .filter(Boolean)
    .join('x') || '—';

  const fitmentRows = [
    { label: 'PCD', value: product.pcd || '—' },
    { label: 'ET', value: product.et_offset != null ? String(product.et_offset) : '—' },
    { label: language === 'fi' ? 'CB' : 'CB', value: product.cb != null ? `${product.cb} mm` : '—' },
    {
      label: language === 'fi' ? 'Materiaali' : 'Material',
      value: product.material
        ? product.material.toLowerCase() === 'alloy'
          ? (language === 'fi' ? 'Kevytmetalli' : 'Alloy')
          : product.material.toLowerCase() === 'steel'
            ? (language === 'fi' ? 'Teräs' : 'Steel')
            : product.material
        : '—',
    },
  ];

  const metaChips = [
    product.color ? { label: language === 'fi' ? `Väri ${product.color}` : `Color ${product.color}` } : null,
    product.in_stock
      ? { label: language === 'fi' ? 'Varastossa' : 'In stock', accent: true }
      : { label: language === 'fi' ? 'Tilapäisesti loppu' : 'Out of stock' },
  ].filter(Boolean) as Array<{ label: string; accent?: boolean }>;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  const interactiveProps = onClick
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
      whileHover={{ y: -3 }}
      transition={{ duration: 0.24 }}
      className={`h-full ${onClick ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2' : ''}`}
      {...interactiveProps}
    >
      <article className={`flex h-full flex-col overflow-hidden rounded-2xl border ${isDark ? 'border-white/10 bg-[#11161d] text-white' : 'border-gray-200 bg-white text-gray-900'} transition-shadow duration-200 ${isDark ? 'hover:shadow-[0_12px_40px_rgba(0,0,0,0.28)]' : 'hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]'}`}>
        <div className={`border-b px-5 py-4 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className={`text-xs font-medium uppercase tracking-[0.16em] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {product.brand}
              </p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight">
                {product.model}
              </h3>
              <p className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {sizeLabel}
              </p>
            </div>

            <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isDark ? 'bg-white/5 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
              {language === 'fi' ? 'Vanne' : 'Rim'}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {metaChips.map((chip) => (
              <span
                key={chip.label}
                className={`rounded-full px-2.5 py-1 text-xs ${
                  chip.accent
                    ? 'bg-[#FF6B35]/15 text-[#FF6B35]'
                    : isDark
                      ? 'bg-white/5 text-gray-300'
                      : 'bg-gray-100 text-gray-600'
                }`}
              >
                {chip.label}
              </span>
            ))}
          </div>
        </div>

        <div className="px-5 pt-5">
          <div className={`flex h-56 items-center justify-center rounded-xl border ${isDark ? 'border-white/10 bg-[#0b1016]' : 'border-gray-200 bg-gray-50'}`}>
            <img
              alt={`${product.brand} ${product.model}`}
              className="h-full w-full object-contain p-4"
              src={cardImageSrc}
              onError={() => {
                if (cardImageSrc !== fallbackImage) {
                  setCardImageSrc(fallbackImage);
                }
              }}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col px-5 py-5">
          <div className="grid grid-cols-2 gap-3">
            {fitmentRows.map((item) => (
              <div
                key={item.label}
                className={`rounded-xl border px-3 py-3 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-gray-50'}`}
              >
                <p className={`text-[11px] font-medium uppercase tracking-[0.14em] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {item.label}
                </p>
                <p className={`mt-1 text-sm font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className={`mt-4 rounded-xl border px-4 py-4 ${isDark ? 'border-white/10 bg-[#0b1016]' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className={`text-xs uppercase tracking-[0.16em] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {language === 'fi' ? 'Hinta / kpl' : 'Price / each'}
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">
                  {(product.best_price_eur || 0).toFixed(2)} €
                </p>
              </div>
              <div className="text-right">
                <p className={`text-xs uppercase tracking-[0.16em] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {language === 'fi' ? 'Sarja 4 kpl' : 'Set of 4'}
                </p>
                <p className={`mt-1 text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  {fourPiecePrice.toFixed(2)} €
                </p>
              </div>
            </div>
          </div>

          <button
            disabled={!product.in_stock}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF6B35]/90 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={(event) => {
              event.stopPropagation();
              onAddToCart?.(event);
            }}
          >
            <ShoppingCart className="h-4 w-4" />
            {product.in_stock
              ? (language === 'fi' ? 'Lisää koriin' : 'Add to cart')
              : (language === 'fi' ? 'Tilapäisesti loppu' : 'Out of stock')}
          </button>
        </div>
      </article>
    </motion.div>
  );
}

export default RimCard;
