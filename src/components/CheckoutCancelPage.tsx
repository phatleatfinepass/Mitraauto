import React from 'react';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { XCircle, ArrowLeft, ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';

interface CheckoutCancelPageProps {
  onReturnToCart: () => void;
  onReturnHome: () => void;
}

export const CheckoutCancelPage: React.FC<CheckoutCancelPageProps> = ({ 
  onReturnToCart, 
  onReturnHome 
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();

  const t = (key: string) => {
    const translations: Record<string, { fi: string; en: string }> = {
      title: { fi: 'Maksu peruutettu', en: 'Payment Cancelled' },
      subtitle: { fi: 'Tilaustasi ei ole vahvistettu', en: 'Your order has not been confirmed' },
      description: { 
        fi: 'Peruutit maksun tai maksu epäonnistui. Tuotteesi ovat edelleen ostoskorissasi, ja voit jatkaa ostoksia tai yrittää maksaa uudelleen.', 
        en: 'You cancelled the payment or the payment failed. Your items are still in your cart, and you can continue shopping or try to pay again.' 
      },
      whatHappened: { fi: 'Mitä tapahtui?', en: 'What happened?' },
      reason1: { fi: 'Peruutit maksun Paytrail-sivulla', en: 'You cancelled the payment on the Paytrail page' },
      reason2: { fi: 'Maksu epäonnistui teknisen virheen vuoksi', en: 'Payment failed due to a technical error' },
      reason3: { fi: 'Maksutapahtuma aikakatkaistiin', en: 'Payment transaction timed out' },
      nextSteps: { fi: 'Mitä tehdä seuraavaksi?', en: 'What to do next?' },
      option1: { fi: 'Palaa ostoskoriin ja yritä maksaa uudelleen', en: 'Return to cart and try to pay again' },
      option2: { fi: 'Jatka ostoksia ja lisää tuotteita', en: 'Continue shopping and add more products' },
      option3: { fi: 'Ota yhteyttä asiakaspalveluun, jos tarvitset apua', en: 'Contact customer support if you need help' },
      returnToCart: { fi: 'Palaa ostoskoriin', en: 'Return to Cart' },
      returnHome: { fi: 'Palaa etusivulle', en: 'Return to Homepage' },
      needHelp: { fi: 'Tarvitsetko apua?', en: 'Need help?' },
      contactUs: { fi: 'Ota yhteyttä', en: 'Contact us' },
    };
    return translations[key]?.[language] || key;
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#11141A]' : 'bg-white'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Cancel Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center size-20 rounded-full bg-orange-100 dark:bg-orange-900/20 mb-4">
            <XCircle className="size-10 text-orange-600 dark:text-orange-500" />
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

        {/* Description Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className={`p-6 mb-6 ${
            theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-[#E2E8F0]'
          }`}>
            <p className={`text-sm mb-6 ${
              theme === 'dark' ? 'text-gray-300' : 'text-[#64748B]'
            }`}>
              {t('description')}
            </p>

            {/* What Happened Section */}
            <div className="mb-6">
              <h2 className={`text-lg mb-3 ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
                {t('whatHappened')}
              </h2>
              <ul className="space-y-2">
                {[t('reason1'), t('reason2'), t('reason3')].map((reason, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-[#64748B]'}`}>
                      {reason}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Next Steps Section */}
            <div>
              <h2 className={`text-lg mb-3 ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
                {t('nextSteps')}
              </h2>
              <div className="space-y-3">
                {[t('option1'), t('option2'), t('option3')].map((option, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`flex-shrink-0 size-6 rounded-full flex items-center justify-center text-xs ${
                      theme === 'dark' 
                        ? 'bg-[#FF6B00]/20 text-[#FF6B00]' 
                        : 'bg-[#FF6B00]/10 text-[#FF6B00]'
                    }`}>
                      {index + 1}
                    </div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-[#64748B]'}`}>
                      {option}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`text-center p-6 rounded-lg mb-8 ${
            theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-gray-50'
          }`}
        >
          <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`}>
            {t('needHelp')}
          </p>
          <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
            {t('contactUs')}: <a href="mailto:info@mitraauto.fi" className="text-[#FF6B00] hover:underline">info@mitraauto.fi</a>
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            onClick={onReturnToCart}
            className="bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white px-8"
          >
            <ShoppingCart className="size-4 mr-2" />
            {t('returnToCart')}
          </Button>
          
          <Button
            onClick={onReturnHome}
            variant="outline"
            className={`px-8 ${
              theme === 'dark'
                ? 'border-white/10 text-white hover:bg-white/5'
                : 'border-[#E2E8F0] text-[#0F172A] hover:bg-gray-50'
            }`}
          >
            <ArrowLeft className="size-4 mr-2" />
            {t('returnHome')}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
