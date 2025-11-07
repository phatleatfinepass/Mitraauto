import React from 'react';
import { useCart } from './CartContext';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartDrawerProps {
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckout }) => {
  const { items, removeFromCart, updateQuantity, totalItems, totalPrice, isCartOpen, setIsCartOpen } = useCart();
  const { theme } = useTheme();
  const { language } = useLanguage();

  const t = (key: string) => {
    const translations: Record<string, { fi: string; en: string }> = {
      cart: { fi: 'Ostoskori', en: 'Shopping Cart' },
      emptyCart: { fi: 'Ostoskori on tyhjä', en: 'Your cart is empty' },
      emptyCartDesc: { fi: 'Lisää tuotteita ostoskoriin aloittaaksesi ostokset', en: 'Add products to cart to start shopping' },
      continueShopping: { fi: 'Jatka ostoksia', en: 'Continue Shopping' },
      checkout: { fi: 'Siirry kassalle', en: 'Proceed to Checkout' },
      subtotal: { fi: 'Välisumma', en: 'Subtotal' },
      vat: { fi: 'Sis. ALV 25.5%', en: 'Incl. VAT 25.5%' },
      items: { fi: 'tuotetta', en: 'items' },
      remove: { fi: 'Poista', en: 'Remove' },
      perPcs: { fi: 'kpl', en: 'pcs' },
    };
    return translations[key]?.[language] || key;
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent 
        side="right" 
        className={`w-full sm:max-w-md p-0 ${
          theme === 'dark' ? 'bg-[#11141A] border-white/10' : 'bg-white border-[#E2E8F0]'
        }`}
      >
        <SheetHeader className={`px-6 py-5 border-b ${
          theme === 'dark' ? 'border-white/10' : 'border-[#E2E8F0]'
        }`}>
          <SheetTitle className={`flex items-center gap-3 ${
            theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
          }`}>
            <ShoppingBag className="size-5" />
            {t('cart')} {totalItems > 0 && `(${totalItems})`}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {t('cart')}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] px-6">
            <div className={`size-20 rounded-full flex items-center justify-center mb-4 ${
              theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
            }`}>
              <ShoppingBag className={`size-10 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`} />
            </div>
            <h3 className={`text-lg mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
            }`}>
              {t('emptyCart')}
            </h3>
            <p className={`text-sm text-center mb-6 ${
              theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
            }`}>
              {t('emptyCartDesc')}
            </p>
            <Button
              onClick={() => setIsCartOpen(false)}
              className="bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white"
            >
              {t('continueShopping')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col h-[calc(100vh-80px)]">
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.2 }}
                    className={`mb-4 p-4 rounded-xl border ${
                      theme === 'dark'
                        ? 'bg-[#1C1C1E] border-white/10'
                        : 'bg-gray-50 border-[#E2E8F0]'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className={`size-20 rounded-lg overflow-hidden flex-shrink-0 ${
                        theme === 'dark' ? 'bg-[#2C2C2E]' : 'bg-white'
                      }`}>
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={`${item.product.brand} ${item.product.model}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${
                            theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            <ShoppingBag className="size-8" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm mb-1 truncate ${
                          theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
                        }`}>
                          {item.product.brand} {item.product.model}
                        </h4>
                        <p className={`text-xs mb-2 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
                        }`}>
                          {(item.product.product_type === 'tire' || item.product.type === 'tire') ? (
                            <>
                              {item.product.size_text || `${item.product.tire_width}/${item.product.aspect_ratio} ${item.product.construction}${item.product.rim_diameter}`}
                            </>
                          ) : (
                            <>
                              {item.product.rim_width}×{item.product.rim_diameter}" ET{item.product.et_offset}
                            </>
                          )}
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-2 rounded-lg px-2 py-1 ${
                            theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white border border-[#E2E8F0]'
                          }`}>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className={`p-1 rounded transition-colors ${
                                theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                              }`}
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className={`text-sm min-w-[2ch] text-center ${
                              theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
                            }`}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className={`p-1 rounded transition-colors ${
                                theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                              }`}
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-[#FF6B00]">
                              €{(item.price * item.quantity).toFixed(2)}
                            </p>
                            <p className={`text-xs ${
                              theme === 'dark' ? 'text-gray-500' : 'text-[#64748B]'
                            }`}>
                              €{item.price.toFixed(2)} / {t('perPcs')}
                            </p>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className={`flex items-center gap-1 text-xs mt-2 transition-colors ${
                            theme === 'dark'
                              ? 'text-gray-400 hover:text-red-400'
                              : 'text-[#64748B] hover:text-red-600'
                          }`}
                        >
                          <Trash2 className="size-3" />
                          {t('remove')}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Cart Summary */}
            <div className={`border-t p-6 ${
              theme === 'dark' ? 'border-white/10 bg-[#11141A]' : 'border-[#E2E8F0] bg-white'
            }`}>
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-[#64748B]'
                  }`}>
                    {t('subtotal')}
                  </span>
                  <span className={`text-lg ${
                    theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
                  }`}>
                    €{totalPrice.toFixed(2)}
                  </span>
                </div>
                <p className={`text-xs ${
                  theme === 'dark' ? 'text-gray-500' : 'text-[#64748B]'
                }`}>
                  {t('vat')}
                </p>
              </div>

              <Button
                onClick={() => {
                  setIsCartOpen(false);
                  onCheckout();
                }}
                className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white h-12 transition-transform hover:scale-[1.02]"
                style={{ boxShadow: '0 2px 12px rgba(255, 107, 0, 0.25)' }}
              >
                {t('checkout')}
                <ArrowRight className="size-5 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
