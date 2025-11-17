import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { CheckCircle2, Package, CreditCard, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface CheckoutSuccessPageProps {
  onReturnHome: () => void;
}

export const CheckoutSuccessPage: React.FC<CheckoutSuccessPageProps> = ({ onReturnHome }) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get order ID from sessionStorage
    const storedOrderId = sessionStorage.getItem('mitra_last_order_id');
    
    if (storedOrderId) {
      setOrderId(storedOrderId);
    }
    
    // Simulate loading order details
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    // Clear cart from localStorage since payment was successful
    localStorage.removeItem('mitra-auto-cart');
  }, []);

  const t = (key: string) => {
    const translations: Record<string, { fi: string; en: string }> = {
      title: { fi: 'Tilaus vastaanotettu!', en: 'Order Received!' },
      subtitle: { fi: 'Kiitos tilauksestasi', en: 'Thank you for your order' },
      processingPayment: { fi: 'Käsittelemme maksuasi...', en: 'Processing your payment...' },
      paymentConfirmed: { fi: 'Maksu vahvistettu', en: 'Payment confirmed' },
      orderNumber: { fi: 'Tilausnumero', en: 'Order number' },
      confirmationEmail: { fi: 'Lähetämme tilausvahvistuksen sähköpostiisi pian.', en: 'We will send an order confirmation to your email shortly.' },
      nextSteps: { fi: 'Seuraavat vaiheet', en: 'Next steps' },
      step1: { fi: 'Saat tilausvahvistuksen sähköpostitse', en: 'You will receive an order confirmation by email' },
      step2: { fi: 'Käsittelemme tilauksesi 1-2 arkipäivän kuluessa', en: 'We will process your order within 1-2 business days' },
      step3: { fi: 'Toimitus 1-3 arkipäivää käsittelyn jälkeen', en: 'Delivery within 1-3 business days after processing' },
      returnHome: { fi: 'Palaa etusivulle', en: 'Return to Homepage' },
      orderDetails: { fi: 'Tilauksen tiedot', en: 'Order Details' },
      paymentMethod: { fi: 'Maksutapa', en: 'Payment Method' },
      paytrailPayment: { fi: 'Paytrail-maksu', en: 'Paytrail Payment' },
      estimatedDelivery: { fi: 'Arvioitu toimitusaika', en: 'Estimated delivery' },
      businessDays: { fi: '1-3 arkipäivää', en: '1-3 business days' },
      needHelp: { fi: 'Tarvitsetko apua?', en: 'Need help?' },
      contactSupport: { fi: 'Ota yhteyttä asiakaspalveluumme', en: 'Contact our customer support' },
    };
    return translations[key]?.[language] || key;
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#11141A]' : 'bg-white'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className={`size-12 animate-spin mb-4 ${
              theme === 'dark' ? 'text-[#FF6B00]' : 'text-[#FF6B00]'
            }`} />
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}>
              {t('processingPayment')}
            </p>
          </div>
        ) : (
          <>
            {/* Success Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center justify-center size-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                <CheckCircle2 className="size-10 text-green-600 dark:text-green-500" />
              </div>
              
              <h1 className={`text-3xl sm:text-4xl mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
              }`}>
                {t('title')}
              </h1>
              
              <p className={`text-lg ${
                theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
              }`}>
                {t('subtitle')}
              </p>
            </motion.div>

            {/* Order Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className={`p-6 mb-6 ${
                theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-[#E2E8F0]'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <Package className={`size-5 ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`} />
                  <h2 className={`text-lg ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
                    {t('orderDetails')}
                  </h2>
                </div>

                <div className="space-y-4">
                  {orderId && (
                    <div className="flex justify-between items-center">
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}>
                        {t('orderNumber')}
                      </span>
                      <span className={`font-mono text-sm ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
                        {orderId.substring(0, 8).toUpperCase()}
                      </span>
                    </div>
                  )}

                  <Separator className={theme === 'dark' ? 'bg-white/10' : 'bg-[#E2E8F0]'} />

                  <div className="flex justify-between items-center">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}>
                      {t('paymentMethod')}
                    </span>
                    <div className="flex items-center gap-2">
                      <CreditCard className="size-4" />
                      <span className={theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}>
                        {t('paytrailPayment')}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}>
                      {t('estimatedDelivery')}
                    </span>
                    <div className="flex items-center gap-2">
                      <Clock className="size-4" />
                      <span className={theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}>
                        {t('businessDays')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`mt-6 p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-blue-900/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
                }`}>
                  <p className={`text-sm ${theme === 'dark' ? 'text-blue-200' : 'text-blue-900'}`}>
                    {t('confirmationEmail')}
                  </p>
                </div>
              </Card>
            </motion.div>

            {/* Next Steps Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className={`p-6 mb-6 ${
                theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-[#E2E8F0]'
              }`}>
                <h2 className={`text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
                  {t('nextSteps')}
                </h2>

                <div className="space-y-3">
                  {[t('step1'), t('step2'), t('step3')].map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`flex-shrink-0 size-6 rounded-full flex items-center justify-center text-xs ${
                        theme === 'dark' 
                          ? 'bg-[#FF6B00]/20 text-[#FF6B00]' 
                          : 'bg-[#FF6B00]/10 text-[#FF6B00]'
                      }`}>
                        {index + 1}
                      </div>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-[#64748B]'}`}>
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Support Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className={`text-center p-6 rounded-lg mb-8 ${
                theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-gray-50'
              }`}
            >
              <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`}>
                {t('needHelp')}
              </p>
              <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
                {t('contactSupport')}: <a href="mailto:info@mitraauto.fi" className="text-[#FF6B00] hover:underline">info@mitraauto.fi</a>
              </p>
            </motion.div>

            {/* Return Home Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex justify-center"
            >
              <Button
                onClick={onReturnHome}
                className="bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white px-8"
              >
                <ArrowLeft className="size-4 mr-2" />
                {t('returnHome')}
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};
