import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import { useCart } from './CartContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { AlertCircle, ShoppingCart, Info, ArrowLeft, Home } from 'lucide-react';
import { getSupabaseClient } from '../utils/supabase/client';
import { parseCheckoutReference } from '../utils/paytrail';

interface CheckoutCancelPageProps {
  onNavigateHome: () => void;
  onNavigateToCheckout: () => void;
}

interface Order {
  id: string;
  paytrail_status: string;
  cart_snapshot?: any;
  grand_total_cents?: number;
}

export const CheckoutCancelPage: React.FC<CheckoutCancelPageProps> = ({
  onNavigateHome,
  onNavigateToCheckout,
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { items, totalPrice } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [paytrailParams, setPaytrailParams] = useState<Record<string, string>>({});

  const t = (key: string) => {
    const translations: Record<string, { fi: string; en: string }> = {
      // Hero section
      paymentCancelled: { fi: 'Maksu keskeytettiin', en: 'Payment was cancelled' },
      paymentCancelledSubtitle: { fi: 'Maksua ei suoritettu loppuun', en: 'Payment was not completed' },
      cancelMessage: {
        fi: 'Maksua ei suoritettu loppuun. Voit tarkistaa tietosi ja yrittää uudelleen.',
        en: 'Your payment was not completed. You can review your details and try again.'
      },

      // Order info
      cartSummary: { fi: 'Ostoskorin yhteenveto', en: 'Cart Summary' },
      itemsInCart: { fi: 'tuotetta korissa', en: 'items in cart' },
      totalAmount: { fi: 'Kokonaissumma', en: 'Total Amount' },
      notCharged: { fi: 'Ei veloitettu', en: 'Not charged' },

      // Helpful hints
      helpfulHints: { fi: 'Hyvä tietää', en: 'Good to Know' },
      accidentalCancel: {
        fi: 'Jos maksu keskeytyi vahingossa, voit palata kassalle ja yrittää uudelleen.',
        en: 'If the payment was cancelled by accident, you can return to checkout and try again.'
      },
      orderNotCharged: {
        fi: 'Tilausta ei ole vielä veloitettu.',
        en: 'The order has not been charged yet.'
      },
      cartPreserved: {
        fi: 'Tuotteesi ovat edelleen ostoskorissa.',
        en: 'Your items are still in the cart.'
      },

      // Actions
      returnToCheckout: { fi: 'Palaa kassalle', en: 'Return to Checkout' },
      backToHome: { fi: 'Takaisin etusivulle', en: 'Back to Home' },
    };
    return translations[key]?.[language] || key;
  };

  useEffect(() => {
    const fetchOrderInfo = async () => {
      try {
        // Read Paytrail query parameters
        const params = new URLSearchParams(window.location.search);
        const paramsObj = Object.fromEntries(params.entries());
        setPaytrailParams(paramsObj);

        console.log('Paytrail cancel params:', paramsObj);

        const checkoutReference = params.get('checkout-reference');
        const checkoutStatus = params.get('checkout-status');
        const checkoutTransactionId = params.get('checkout-transaction-id');
        const checkoutStamp = params.get('checkout-stamp');

        console.log('=== CHECKOUT CANCEL DEBUG ===');
        console.log('checkout-reference:', checkoutReference);
        console.log('checkout-transaction-id:', checkoutTransactionId);
        console.log('checkout-stamp:', checkoutStamp);

        const supabase = getSupabaseClient();
        let foundOrder = null;

        // Try multiple lookup strategies (same as success page)
        
        // Strategy 1: By transaction ID
        if (checkoutTransactionId && !foundOrder) {
          const { data } = await supabase
            .from('orders')
            .select('*')
            .eq('paytrail_transaction_id', checkoutTransactionId)
            .maybeSingle();
          
          if (data) {
            console.log('Found order by transaction ID');
            foundOrder = data;
          }
        }

        // Strategy 2: By stamp
        if (checkoutStamp && !foundOrder) {
          const { data } = await supabase
            .from('orders')
            .select('*')
            .eq('paytrail_stamp', checkoutStamp)
            .maybeSingle();
          
          if (data) {
            console.log('Found order by stamp');
            foundOrder = data;
          }
        }

        // Strategy 3: By reference-derived ID
        if (checkoutReference && !foundOrder) {
          const parsedReference = parseCheckoutReference(checkoutReference);
          const orderId = parsedReference.normalizedOrderId;

          if (orderId) {
            const { data } = await supabase
              .from('orders')
              .select('*')
              .eq('id', orderId)
              .maybeSingle();
            
            if (data) {
              console.log('Found order by ID from reference');
              foundOrder = data;
            }
          }
        }

        if (foundOrder) {
          console.log('Loaded order for cancel page:', foundOrder.id);
          setOrder(foundOrder);
        } else {
          console.warn('Could not find order on cancel page (non-critical)');
        }

        // IMPORTANT: Cart is NOT cleared on cancel page
        console.log('Payment cancelled - cart preserved for retry');
      } catch (err) {
        console.error('Error in fetchOrderInfo:', err);
        // Non-critical error, just log it
      }
    };

    fetchOrderInfo();
  }, []);

  // Determine what to show in the summary
  const cartSnapshot = order?.cart_snapshot;
  const displayItems = cartSnapshot?.items || items;
  const displayTotal = order?.grand_total_cents 
    ? (order.grand_total_cents / 100) 
    : totalPrice;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#11141A]' : 'bg-gray-50'} py-12 px-4`}>
      <div className="max-w-2xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-4">
            <AlertCircle className="w-12 h-12 text-orange-600" />
          </div>
          <h1 className={`text-4xl mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {t('paymentCancelled')}
          </h1>
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('paymentCancelledSubtitle')}
          </p>
        </div>

        {/* Cancel Message Card */}
        <Card className={`p-6 mb-6 ${
          theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-200'
        }`}>
          <p className={`text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {t('cancelMessage')}
          </p>
        </Card>

        {/* Cart Summary (if available) */}
        {displayItems && displayItems.length > 0 && (
          <Card className={`p-6 mb-6 ${
            theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
              <h2 className={`text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('cartSummary')}
              </h2>
            </div>

            <div className="mb-4">
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {displayItems.length} {t('itemsInCart')}
              </p>
            </div>

            <Separator className={`mb-4 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />

            {/* Items List */}
            <div className="space-y-3 mb-4">
              {displayItems.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {item.name || 
                       (item.product ? `${item.product.brand || ''} ${item.product.model || ''}`.trim() : '') ||
                       `${item.brand || ''} ${item.model || ''}`.trim()}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {item.qty || item.quantity || 1} × €{(
                        item.price || 
                        (item.client_unit_price_cents ? item.client_unit_price_cents / 100 : 0) ||
                        0
                      ).toFixed(2)}
                    </p>
                  </div>
                  <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    €{(
                      (item.price || (item.client_unit_price_cents ? item.client_unit_price_cents / 100 : 0) || 0) * 
                      (item.qty || item.quantity || 1)
                    ).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <Separator className={`mb-4 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />

            {/* Total */}
            <div className="flex justify-between items-center">
              <div>
                <p className={`text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {t('totalAmount')}
                </p>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('notCharged')}
                </p>
              </div>
              <span className={`text-2xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} line-through`}>
                €{displayTotal.toFixed(2)}
              </span>
            </div>
          </Card>
        )}

        {/* Helpful Hints Card */}
        <Card className={`p-6 mb-8 ${
          theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <Info className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
            <h2 className={`text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('helpfulHints')}
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  theme === 'dark' ? 'bg-gray-400' : 'bg-gray-600'
                }`} />
              </div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('accidentalCancel')}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  theme === 'dark' ? 'bg-gray-400' : 'bg-gray-600'
                }`} />
              </div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('orderNotCharged')}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  theme === 'dark' ? 'bg-gray-400' : 'bg-gray-600'
                }`} />
              </div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('cartPreserved')}
              </p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={onNavigateToCheckout}
            className="flex-1 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white h-12"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('returnToCheckout')}
          </Button>
          <Button
            onClick={onNavigateHome}
            variant="outline"
            className={`flex-1 h-12 ${
              theme === 'dark'
                ? 'border-white/10 text-white hover:bg-white/5'
                : 'border-gray-300 text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Home className="w-4 h-4 mr-2" />
            {t('backToHome')}
          </Button>
        </div>
      </div>
    </div>
  );
};
