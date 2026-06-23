import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useCart } from '../cart/CartContext';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Separator } from '../../ui/separator';
import { AlertCircle, ShoppingCart, Info, ArrowLeft, Home } from 'lucide-react';
import { getSupabaseClient } from '../../../utils/supabase/client';
import { parseCheckoutReference } from '../../../utils/paytrail';
import { calculateLinePricing } from '../../../utils/pricing';

const VAT_RATE = 0.255;
const VAT_MULTIPLIER = 1 + VAT_RATE;

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
  const { t } = useLanguage();
  const { items, totalPrice } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [paytrailParams, setPaytrailParams] = useState<Record<string, string>>({});

  const checkoutCancelText = (key: string) => t(`checkoutCancel.${key}`);

  useEffect(() => {
    const fetchOrderInfo = async () => {
      try {
        // Read Paytrail query parameters
        const params = new URLSearchParams(window.location.search);
        const paramsObj = Object.fromEntries(params.entries());
        setPaytrailParams(paramsObj);

        const checkoutReference = params.get('checkout-reference');
        const checkoutTransactionId = params.get('checkout-transaction-id');
        const checkoutStamp = params.get('checkout-stamp');

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
              foundOrder = data;
            }
          }
        }

        if (foundOrder) {
          setOrder(foundOrder);
        }
      } catch (err) {
        console.error('Error in fetchOrderInfo');
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
    : (totalPrice * VAT_MULTIPLIER);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#11141A]' : 'bg-gray-50'} py-12 px-4`}>
      <div className="max-w-2xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-4">
            <AlertCircle className="w-12 h-12 text-orange-600" />
          </div>
          <h1 className={`text-4xl mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {checkoutCancelText('paymentCancelled')}
          </h1>
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {checkoutCancelText('paymentCancelledSubtitle')}
          </p>
        </div>

        {/* Cancel Message Card */}
        <Card className={`p-6 mb-6 ${
          theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-200'
        }`}>
          <p className={`text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {checkoutCancelText('cancelMessage')}
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
                {checkoutCancelText('cartSummary')}
              </h2>
            </div>

            <div className="mb-4">
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {displayItems.length} {checkoutCancelText('itemsInCart')}
              </p>
            </div>

            <Separator className={`mb-4 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />

            {/* Items List */}
            <div className="space-y-3 mb-4">
              {displayItems.map((item: any, index: number) => {
                const qty = Number(item?.qty || item?.quantity || 1);
                const snapshotUnitPrice = item?.client_unit_price_cents ? (Number(item.client_unit_price_cents) / 100) : null;
                const baseUnit = Number(item?.base_price ?? item?.price ?? 0);
                const linePricing = calculateLinePricing(baseUnit, qty, item?.pricing_rules ?? item?.product?.pricing_rules ?? null);
                const effectiveUnit = snapshotUnitPrice ?? (linePricing.effectiveUnitPriceEur * VAT_MULTIPLIER);
                const lineTotal = effectiveUnit * qty;

                return (
                    <div key={index} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {item.name ||
                           (item.product ? `${item.product.brand || ''} ${item.product.model || ''}`.trim() : '') ||
                           `${item.brand || ''} ${item.model || ''}`.trim()}
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {qty} × €{effectiveUnit.toFixed(2)}
                        </p>
                      </div>
                      <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        €{lineTotal.toFixed(2)}
                      </p>
                    </div>
                );
              })}
            </div>

            <Separator className={`mb-4 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />

            {/* Total */}
            <div className="flex justify-between items-center">
              <div>
                <p className={`text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {checkoutCancelText('totalAmount')}
                </p>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {checkoutCancelText('notCharged')}
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
              {checkoutCancelText('helpfulHints')}
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
                {checkoutCancelText('accidentalCancel')}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  theme === 'dark' ? 'bg-gray-400' : 'bg-gray-600'
                }`} />
              </div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {checkoutCancelText('orderNotCharged')}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  theme === 'dark' ? 'bg-gray-400' : 'bg-gray-600'
                }`} />
              </div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {checkoutCancelText('cartPreserved')}
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
            {checkoutCancelText('returnToCheckout')}
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
            {checkoutCancelText('backToHome')}
          </Button>
        </div>
      </div>
    </div>
  );
};
