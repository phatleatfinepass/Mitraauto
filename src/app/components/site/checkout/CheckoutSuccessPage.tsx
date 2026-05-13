import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../ThemeContext';
import { useLanguage } from '../../LanguageContext';
import { useCart } from '../cart/CartContext';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Separator } from '../../ui/separator';
import { CheckCircle2, ArrowRight, AlertTriangle, Package, CreditCard, Calendar } from 'lucide-react';
import { getSupabaseClient } from '../../../utils/supabase/client';
import { projectId } from '../../../utils/supabase/info';
import { parseCheckoutReference } from '../../../utils/paytrail';
import { clearCheckoutDraft } from './CheckoutPage';
import { toast } from 'sonner';

interface CheckoutSuccessPageProps {
  onNavigateHome: () => void;
  onNavigateToOrders?: () => void;
}

interface Order {
  id: string;
  paytrail_status: string;
  status?: string;
  created_at?: string;
  paytrail_transaction_id?: string;
  paytrail_stamp?: string;
  paytrail_reference?: string;
}

interface CheckoutInfo {
  checkoutStatus: string | null;
  transactionId: string | null;
  stamp: string | null;
  account: string | null;
  amountCents: number | null;
  totalEuros: string | null;
  reference: string | null;
  orderId: string | null;
  provider: string | null;
  signature: string | null;
  rawParams: Record<string, string>;
}

const parseCheckoutParams = (search: string): CheckoutInfo => {
  const params = new URLSearchParams(search);
  const reference = params.get('checkout-reference');
  const amountStr = params.get('checkout-amount');
  const parsedAmount = amountStr ? parseInt(amountStr, 10) : null;
  const amountCents =
    typeof parsedAmount === 'number' && Number.isFinite(parsedAmount)
      ? parsedAmount
      : null;
  const totalEuros = amountCents != null ? (amountCents / 100).toFixed(2) : null;

  const parsedReference = parseCheckoutReference(reference);
  const parsedStamp = parseCheckoutReference(params.get('checkout-stamp'));
  const orderId = parsedReference.normalizedOrderId ?? parsedStamp.normalizedOrderId;

  return {
    checkoutStatus: params.get('checkout-status'),
    transactionId: params.get('checkout-transaction-id'),
    stamp: params.get('checkout-stamp'),
    account: params.get('checkout-account'),
    amountCents,
    totalEuros,
    reference,
    orderId,
    provider: params.get('checkout-provider'),
    signature: params.get('signature'),
    rawParams: Object.fromEntries(params.entries()),
  };
};

export const CheckoutSuccessPage: React.FC<CheckoutSuccessPageProps> = ({
  onNavigateHome,
  onNavigateToOrders,
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { clearCart } = useCart();
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [finalizingPayment, setFinalizingPayment] = useState(false);
  const hasClearedCartRef = useRef(false);
  const hasFinalizedRef = useRef(false);

  const translations: Record<string, { fi: string; en: string }> = {
    loading: { fi: 'Ladataan...', en: 'Loading...' },
    paymentSuccessful: { fi: 'Kiitos tilauksestasi!', en: 'Order confirmed' },
    thankYouMessage: {
      fi: 'Maksusi vastaanotettiin onnistuneesti.',
      en: 'Your payment was received successfully.',
    },
    orderId: { fi: 'Tilausnumero', en: 'Order Number' },
    provider: { fi: 'Maksupalvelu', en: 'Payment Provider' },
    total: { fi: 'Yhteensä', en: 'Total' },
    transactionId: { fi: 'Maksutapahtuman tunnus', en: 'Transaction ID' },
    paymentStatus: { fi: 'Maksun tila', en: 'Payment Status' },
    orderDate: { fi: 'Tilauspäivä', en: 'Order Date' },
    paid: { fi: 'Maksettu', en: 'Paid' },
    backToHome: { fi: 'Takaisin etusivulle', en: 'Back to home' },
    unverifiedTitle: {
      fi: 'Emme voineet vahvistaa tilaustasi',
      en: 'We could not verify your order',
    },
    unverifiedMessage: {
      fi: 'Tilauksen tietoja ei löytynyt Paytrailin palauttamista parametreista. Otathan yhteyttä asiakaspalveluun.',
      en: 'We could not read the necessary Paytrail parameters. Please contact support.',
    },
  };

  const t = (key: string) => translations[key]?.[language] || key;

  useEffect(() => {
    const info = parseCheckoutParams(window.location.search);
    console.log('=== CHECKOUT SUCCESS DEBUG ===');
    console.log('Paytrail redirect params:', info.rawParams);
    setCheckoutInfo(info);
    
    // Fetch order details immediately
    if (info.orderId) {
      fetchOrderDetails(info.orderId, info.transactionId);
    }
  }, []);

  const isSuccessfulPayment =
    checkoutInfo?.checkoutStatus === 'ok' &&
    Boolean(checkoutInfo?.orderId) &&
    checkoutInfo?.totalEuros != null;

  useEffect(() => {
    if (isSuccessfulPayment && !hasClearedCartRef.current) {
      clearCart();
      clearCheckoutDraft();
      hasClearedCartRef.current = true;
    }
  }, [isSuccessfulPayment, clearCart]);

  useEffect(() => {
    if (!checkoutInfo || checkoutInfo.checkoutStatus !== 'ok' || hasFinalizedRef.current) {
      return;
    }

    hasFinalizedRef.current = true;

    const finalizePayment = async () => {
      setFinalizingPayment(true);
      try {
        const webhookUrl = `https://${projectId}.functions.supabase.co/payments_paytrail_webhook${window.location.search}`;
        const response = await fetch(webhookUrl, {
          method: 'GET',
        });

        const payload = await response.json().catch(() => null);
        console.log('Paytrail finalize response:', response.status, payload);

        if (!response.ok) {
          console.error('Failed to finalize Paytrail payment on success page', payload);
        } else if (checkoutInfo.orderId) {
          await fetchOrderDetails(checkoutInfo.orderId, checkoutInfo.transactionId);
        }
      } catch (error) {
        console.error('Paytrail success finalization failed:', error);
      } finally {
        setFinalizingPayment(false);
      }
    };

    void finalizePayment();
  }, [checkoutInfo]);

  // Fetch order details
  const fetchOrderDetails = async (orderId: string, transactionId: string | null) => {
    if (order) return; // Already loaded
    
    setLoadingOrder(true);
    try {
      const supabase = getSupabaseClient();
      
      // Try to fetch by order ID first
      let { data: orderData, error } = await supabase
        .from('orders')
        .select('id, paytrail_status, status, created_at, paytrail_transaction_id, paytrail_stamp, paytrail_reference')
        .eq('id', orderId)
        .maybeSingle();

      // If not found by ID, try by transaction ID
      if (!orderData && transactionId) {
        const result = await supabase
          .from('orders')
          .select('id, paytrail_status, status, created_at, paytrail_transaction_id, paytrail_stamp, paytrail_reference')
          .eq('paytrail_transaction_id', transactionId)
          .maybeSingle();
        orderData = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error fetching order:', error);
      } else if (orderData) {
        setOrder(orderData);
      }
    } catch (err) {
      console.error('Error fetching order:', err);
    } finally {
      setLoadingOrder(false);
    }
  };

  if (!checkoutInfo) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-[#11141A]' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35] mx-auto mb-4" />
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            {t('loading')}
          </p>
        </div>
      </div>
    );
  }

  if (!isSuccessfulPayment) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${
        theme === 'dark' ? 'bg-[#11141A]' : 'bg-gray-50'
      }`}>
        <Card className={`max-w-xl w-full p-8 text-center ${
          theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-200'
        }`}>
          <div className="flex justify-center mb-4">
            <AlertTriangle className="text-orange-500 w-12 h-12" />
          </div>
          <h1 className={`text-2xl font-semibold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {t('unverifiedTitle')}
          </h1>
          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
            {t('unverifiedMessage')}
          </p>
          <Button
            onClick={onNavigateHome}
            className="mt-6 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white"
          >
            {t('backToHome')}
          </Button>
        </Card>
      </div>
    );
  }

  // Helper to capitalize first letter
  const capitalizeFirstLetter = (str: string) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#11141A]' : 'bg-gray-50'} py-12 px-4`}>
      <div className="max-w-2xl mx-auto">
        <Card className={`p-8 ${
          theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-200'
        }`}>
          {/* Centered Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100">
              <CheckCircle2 className="w-16 h-16 text-green-600" />
            </div>
          </div>

          {/* Centered Title and Message */}
          <div className="text-center mb-8">
            <h1 className={`text-3xl font-semibold mb-3 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {t('paymentSuccessful')}
            </h1>
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
              {t('thankYouMessage')}
            </p>
          </div>

          {/* Order Details */}
          {loadingOrder ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35] mx-auto mb-2" />
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                {t('loading')}
              </p>
            </div>
          ) : finalizingPayment ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35] mx-auto mb-2" />
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                {language === 'fi' ? 'Vahvistetaan maksua...' : 'Finalizing payment...'}
              </p>
            </div>
          ) : (
            <div className={`rounded-lg p-6 mb-6 space-y-4 ${
              theme === 'dark' ? 'bg-[#252525]' : 'bg-gray-50'
            }`}>
              {/* Order ID */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Package className="w-4 h-4" />
                  {t('orderId')}
                </span>
                <span className={`font-mono text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {checkoutInfo.orderId}
                </span>
              </div>

              <Separator className={theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'} />

              {/* Transaction ID */}
              {checkoutInfo.transactionId && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      <CreditCard className="w-4 h-4" />
                      {t('transactionId')}
                    </span>
                    <span className={`font-mono text-xs break-all ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {checkoutInfo.transactionId}
                    </span>
                  </div>
                  <Separator className={theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'} />
                </>
              )}

              {/* Payment Status */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {t('paymentStatus')}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-700 w-fit">
                  {t('paid')}
                </span>
              </div>

              <Separator className={theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'} />

              {/* Provider */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {t('provider')}
                </span>
                <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                  {checkoutInfo.provider ? capitalizeFirstLetter(checkoutInfo.provider) : 'Paytrail'}
                </span>
              </div>

              <Separator className={theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'} />

              {/* Order Date */}
              {order?.created_at && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Calendar className="w-4 h-4" />
                      {t('orderDate')}
                    </span>
                    <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                      {new Date(order.created_at).toLocaleDateString(language === 'fi' ? 'fi-FI' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <Separator className={theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'} />
                </>
              )}

              {/* Total */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {t('total')}
                </span>
                <span className="text-2xl font-semibold text-[#FF6B35]">
                  €{checkoutInfo.totalEuros}
                </span>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={onNavigateHome}
              className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white h-12"
            >
              {t('backToHome')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
