import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import { useCart } from './CartContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { CheckCircle2, ArrowRight, AlertTriangle } from 'lucide-react';

interface CheckoutSuccessPageProps {
  onNavigateHome: () => void;
  onNavigateToOrders?: () => void;
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

  const orderId =
    reference && reference.startsWith('ORDER-')
      ? reference.substring('ORDER-'.length)
      : null;

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
  const hasClearedCartRef = useRef(false);

  const translations: Record<string, { fi: string; en: string }> = {
    loading: { fi: 'Ladataan...', en: 'Loading...' },
    paymentSuccessful: { fi: 'Kiitos tilauksestasi!', en: 'Order confirmed' },
    thankYouMessage: {
      fi: 'Maksusi vastaanotettiin onnistuneesti.',
      en: 'Your payment was received successfully.',
    },
    orderId: { fi: 'Tilauksen tunnus', en: 'Order ID' },
    provider: { fi: 'Maksupalvelu', en: 'Payment provider' },
    total: { fi: 'Yhteensä', en: 'Total' },
    transactionId: { fi: 'Tapahtuman tunnus', en: 'Transaction ID' },
    backToHome: { fi: 'Takaisin etusivulle', en: 'Back to home' },
    viewOrder: { fi: 'Näytä tilausvahvistus', en: 'View order summary' },
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
  }, []);

  const isSuccessfulPayment =
    checkoutInfo?.checkoutStatus === 'ok' &&
    Boolean(checkoutInfo?.orderId) &&
    checkoutInfo?.totalEuros != null;

  useEffect(() => {
    if (isSuccessfulPayment && !hasClearedCartRef.current) {
      clearCart();
      hasClearedCartRef.current = true;
    }
  }, [isSuccessfulPayment, clearCart]);

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

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#11141A]' : 'bg-gray-50'} py-12 px-4`}>
      <div className="max-w-2xl mx-auto">
        <Card className={`p-8 text-center ${
          theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-200'
        }`}>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className={`text-3xl font-semibold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {t('paymentSuccessful')}
          </h1>
          <p className={`mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            {t('thankYouMessage')}
          </p>

          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                {t('orderId')}
              </span>
              <span className="font-mono text-base">
                {checkoutInfo.orderId}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                {t('provider')}
              </span>
              <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                {checkoutInfo.provider || 'Paytrail'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                {t('total')}
              </span>
              <span className="text-2xl font-semibold text-[#FF6B35]">
                €{checkoutInfo.totalEuros}
              </span>
            </div>
            {checkoutInfo.transactionId && (
              <div className="flex items-center justify-between">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {t('transactionId')}
                </span>
                <span className="font-mono text-sm">
                  {checkoutInfo.transactionId}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            <Button
              onClick={onNavigateHome}
              className="flex-1 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white h-12"
            >
              {t('backToHome')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            {checkoutInfo.orderId && (
              <Button
                variant="outline"
                className={`flex-1 h-12 ${
                  theme === 'dark'
                    ? 'border-white/10 text-white hover:bg-white/5'
                    : 'border-gray-300 text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => {
                  if (onNavigateToOrders) {
                    onNavigateToOrders();
                    return;
                  }
                  window.location.href = `/orders/${checkoutInfo.orderId}`;
                }}
              >
                {t('viewOrder')}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
