import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import { useCart } from './CartContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { Alert } from './ui/alert';
import { CheckCircle2, Package, User, Mail, Phone, ArrowRight, FileText, AlertTriangle } from 'lucide-react';
import { getSupabaseClient } from '../utils/supabase/client';
import { toast } from 'sonner';

interface CheckoutSuccessPageProps {
  onNavigateHome: () => void;
  onNavigateToOrders?: () => void;
}

interface Order {
  id: string;
  paytrail_status: string;
  cart_snapshot?: any;
  customer_email?: string;
  customer_phone?: string;
  customer_first_name?: string;
  customer_last_name?: string;
  grand_total_cents?: number;
  created_at?: string;
}

export const CheckoutSuccessPage: React.FC<CheckoutSuccessPageProps> = ({
  onNavigateHome,
  onNavigateToOrders,
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { clearCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [paytrailParams, setPaytrailParams] = useState<Record<string, string>>({});

  const t = (key: string) => {
    const translations: Record<string, { fi: string; en: string }> = {
      // Hero section
      paymentSuccessful: { fi: 'Maksu onnistui', en: 'Payment successful' },
      thankYouMessage: { 
        fi: 'Kiitos tilauksestasi! Olemme vastaanottaneet maksusi.', 
        en: 'Thank you for your order! Your payment was received.' 
      },
      
      // Loading & errors
      loadingOrder: { fi: 'Noudetaan tilaustasi…', en: 'Loading your order…' },
      orderNotFound: { fi: 'Emme löytäneet tilausta', en: 'Order not found' },
      errorLoadingOrder: { fi: 'Virhe tilauksen lataamisessa', en: 'Error loading order' },
      
      // Order summary
      orderSummary: { fi: 'Tilausyhteenveto', en: 'Order Summary' },
      orderNumber: { fi: 'Tilausnumero', en: 'Order Number' },
      paymentStatus: { fi: 'Maksun tila', en: 'Payment Status' },
      paid: { fi: 'Maksettu', en: 'Paid' },
      pending: { fi: 'Odottaa', en: 'Pending' },
      
      // Items
      items: { fi: 'Tuotteet', en: 'Items' },
      quantity: { fi: 'Määrä', en: 'Quantity' },
      unitPrice: { fi: 'Yksikköhinta', en: 'Unit Price' },
      total: { fi: 'Yhteensä', en: 'Total' },
      
      // Totals
      subtotal: { fi: 'Välisumma', en: 'Subtotal' },
      vat: { fi: 'ALV 24%', en: 'VAT 24%' },
      grandTotal: { fi: 'Kokonaissumma', en: 'Grand Total' },
      
      // Customer details
      customerDetails: { fi: 'Asiakastiedot', en: 'Customer Details' },
      name: { fi: 'Nimi', en: 'Name' },
      email: { fi: 'Sähköposti', en: 'Email' },
      phone: { fi: 'Puhelin', en: 'Phone' },
      
      // Next steps
      nextSteps: { fi: 'Seuraavat vaiheet', en: 'Next Steps' },
      emailConfirmation: { 
        fi: 'Saat tilausvahvistuksen sähköpostitse.', 
        en: 'You will receive an order confirmation by email.' 
      },
      scheduleInstallation: { 
        fi: 'Voit varata asennusajan seuraavassa vaiheessa.', 
        en: 'You can schedule installation in the next step.' 
      },
      
      // Actions
      backToHome: { fi: 'Takaisin etusivulle', en: 'Back to Home' },
      viewOrder: { fi: 'Näytä tilaus', en: 'View Order' },
      
      // Warning
      paymentNotConfirmed: {
        fi: 'Maksun tilausta ei voitu vahvistaa. Ota yhteyttä asiakaspalveluun.',
        en: 'Payment status could not be confirmed. Please contact customer service.'
      },
    };
    return translations[key]?.[language] || key;
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Read Paytrail query parameters
        const params = new URLSearchParams(window.location.search);
        const paramsObj = Object.fromEntries(params.entries());
        setPaytrailParams(paramsObj);

        console.log('Paytrail success params:', paramsObj);

        const checkoutStatus = params.get('checkout-status');
        const checkoutReference = params.get('checkout-reference');
        const checkoutTransactionId = params.get('checkout-transaction-id');
        const checkoutAmount = params.get('checkout-amount');

        // Extract order_id from checkout-reference
        let orderId: string | null = null;
        if (checkoutReference && checkoutReference.startsWith('ORDER-')) {
          orderId = checkoutReference.replace('ORDER-', '');
        } else if (checkoutReference) {
          // Fallback: sometimes it might already be just the id
          orderId = checkoutReference;
        }

        if (!orderId) {
          console.error('Failed to extract orderId from checkout-reference:', checkoutReference);
          setError(t('orderNotFound'));
          setLoading(false);
          return;
        }

        console.log('Extracted orderId:', orderId);

        // Fetch order from Supabase
        const supabase = getSupabaseClient();
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle();

        console.log('Loaded order:', orderData);

        if (orderError) {
          console.error('Error fetching order:', orderError);
          setError(t('errorLoadingOrder'));
          setLoading(false);
          return;
        }

        if (!orderData) {
          setError(t('orderNotFound'));
          setLoading(false);
          return;
        }

        setOrder(orderData);

        // Determine if payment is successful based on DB fields (source of truth)
        const isPaid = 
          orderData.status === 'paid' || 
          orderData.paytrail_status === 'paid';

        console.log('Payment status check:', {
          checkoutStatus,
          orderStatus: orderData.status,
          paytrailStatus: orderData.paytrail_status,
          isPaid
        });

        // Clear cart if payment is confirmed
        if (isPaid) {
          console.log('Payment confirmed, clearing cart');
          clearCart();
          
          toast.success(
            language === 'fi'
              ? 'Tilaus vahvistettu!'
              : 'Order confirmed!'
          );
        } else {
          console.warn('Payment not confirmed, cart not cleared');
        }

        setLoading(false);
      } catch (err) {
        console.error('Error in fetchOrder:', err);
        setError(t('errorLoadingOrder'));
        setLoading(false);
      }
    };

    fetchOrder();
  }, [language]);

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-[#11141A]' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35] mx-auto mb-4" />
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            {t('loadingOrder')}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-[#11141A]' : 'bg-gray-50'
      }`}>
        <div className="max-w-md mx-auto px-4 text-center">
          <div className={`text-6xl mb-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>
            ⚠️
          </div>
          <h1 className={`text-2xl mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {error || t('orderNotFound')}
          </h1>
          <Button
            onClick={onNavigateHome}
            className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white"
          >
            {t('backToHome')}
          </Button>
        </div>
      </div>
    );
  }

  // Parse cart snapshot
  const cartSnapshot = order.cart_snapshot || {};
  const items = cartSnapshot.items || [];
  
  // Determine payment status (source of truth from DB)
  const isPaid = order.status === 'paid' || order.paytrail_status === 'paid';
  
  // Show warning if payment not confirmed
  const paymentNotConfirmed = !isPaid;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#11141A]' : 'bg-gray-50'} py-12 px-4`}>
      <div className="max-w-3xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className={`text-4xl mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {t('paymentSuccessful')}
          </h1>
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('thankYouMessage')}
          </p>
        </div>

        {/* Warning if payment not confirmed */}
        {paymentNotConfirmed && (
          <Alert className="mb-6 border-orange-500 bg-orange-50 dark:bg-orange-950/20">
            <AlertTriangle className="text-orange-600" />
            <div className="text-sm text-orange-800 dark:text-orange-200">
              {t('paymentNotConfirmed')}
            </div>
          </Alert>
        )}

        {/* Order Summary Card */}
        <Card className={`p-6 mb-6 ${
          theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 mb-6">
            <Package className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
            <h2 className={`text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('orderSummary')}
            </h2>
          </div>

          {/* Order Number & Status */}
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div>
              <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('orderNumber')}
              </p>
              <p className={`font-mono text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div>
              <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('paymentStatus')}
              </p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                isPaid
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {isPaid ? t('paid') : t('pending')}
              </span>
            </div>
          </div>

          <Separator className={theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'} />

          {/* Items List */}
          {items.length > 0 && (
            <div className="mt-6">
              <h3 className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('items')}
              </h3>
              <div className="space-y-3">
                {items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {item.name || `${item.brand || ''} ${item.model || ''}`.trim()}
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {item.qty || item.quantity} × €{((item.client_unit_price_cents || item.unit_price || 0) / 100).toFixed(2)}
                      </p>
                    </div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      €{(((item.client_unit_price_cents || item.unit_price || 0) / 100) * (item.qty || item.quantity || 1)).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator className={`my-6 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />

          {/* Totals */}
          <div className="space-y-2">
            {cartSnapshot.subtotal && (
              <div className="flex justify-between text-sm">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {t('subtotal')}
                </span>
                <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                  €{(cartSnapshot.subtotal / 100).toFixed(2)}
                </span>
              </div>
            )}
            {cartSnapshot.vat_amount && (
              <div className="flex justify-between text-sm">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {t('vat')}
                </span>
                <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                  €{(cartSnapshot.vat_amount / 100).toFixed(2)}
                </span>
              </div>
            )}
            <Separator className={theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'} />
            <div className="flex justify-between items-center pt-2">
              <span className={`text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('grandTotal')}
              </span>
              <span className="text-2xl text-[#FF6B35]">
                €{((order.grand_total_cents || 0) / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </Card>

        {/* Customer Details Card */}
        {(order.customer_first_name || order.customer_email || order.customer_phone) && (
          <Card className={`p-6 mb-6 ${
            theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <User className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
              <h2 className={`text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('customerDetails')}
              </h2>
            </div>

            <div className="space-y-3">
              {(order.customer_first_name || order.customer_last_name) && (
                <div className="flex items-center gap-3">
                  <User className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                  <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                    {order.customer_first_name} {order.customer_last_name}
                  </span>
                </div>
              )}
              {order.customer_email && (
                <div className="flex items-center gap-3">
                  <Mail className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                  <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                    {order.customer_email}
                  </span>
                </div>
              )}
              {order.customer_phone && (
                <div className="flex items-center gap-3">
                  <Phone className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                  <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                    {order.customer_phone}
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Next Steps Card */}
        <Card className={`p-6 mb-8 ${
          theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <FileText className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
            <h2 className={`text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('nextSteps')}
            </h2>
          </div>

          <div className="space-y-2">
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              ✓ {t('emailConfirmation')}
            </p>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              ✓ {t('scheduleInstallation')}
            </p>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={onNavigateHome}
            className="flex-1 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white h-12"
          >
            {t('backToHome')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          {onNavigateToOrders && (
            <Button
              onClick={onNavigateToOrders}
              variant="outline"
              className={`flex-1 h-12 ${
                theme === 'dark'
                  ? 'border-white/10 text-white hover:bg-white/5'
                  : 'border-gray-300 text-gray-900 hover:bg-gray-100'
              }`}
            >
              {t('viewOrder')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
