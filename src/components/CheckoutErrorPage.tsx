import React from 'react';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface CheckoutErrorPageProps {
  onRetryCheckout: () => void;
  onReturnHome: () => void;
}

export const CheckoutErrorPage: React.FC<CheckoutErrorPageProps> = ({ 
  onRetryCheckout, 
  onReturnHome 
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();

  const t = (key: string) => {
    const translations: Record<string, { fi: string; en: string }> = {
      title: { fi: 'Jotain meni pieleen', en: 'Something Went Wrong' },
      subtitle: { fi: 'Emme voineet käsitellä tilaustaasi', en: 'We could not process your order' },
      description: { 
        fi: 'Pahoittelemme, mutta tilauksesi käsittelyssä tapahtui virhe. Tämä voi johtua teknisestä ongelmasta tai puutteellisista tiedoista.', 
        en: 'We apologize, but an error occurred while processing your order. This may be due to a technical issue or incomplete information.' 
      },
      possibleReasons: { fi: 'Mahdollisia syitä', en: 'Possible reasons' },
      reason1: { fi: 'Tekninen virhe maksupalvelussa', en: 'Technical error in payment service' },
      reason2: { fi: 'Tilaustiedot ovat puutteelliset tai virheelliset', en: 'Order information is incomplete or incorrect' },
      reason3: { fi: 'Verkkoyhteysvirhe', en: 'Network connection error' },
      reason4: { fi: 'Tilaus ei löytynyt järjestelmästämme', en: 'Order not found in our system' },
      whatToDo: { fi: 'Mitä tehdä?', en: 'What to do?' },
      step1: { fi: 'Yritä uudelleen muutaman minuutin kuluttua', en: 'Try again in a few minutes' },
      step2: { fi: 'Varmista, että kaikki tiedot on täytetty oikein', en: 'Make sure all information is filled in correctly' },
      step3: { fi: 'Tyhjennä selaimesi välimuisti ja evästeet', en: 'Clear your browser cache and cookies' },
      step4: { fi: 'Jos ongelma jatkuu, ota yhteyttä asiakaspalveluumme', en: 'If the problem persists, contact our customer support' },
      retryCheckout: { fi: 'Yritä uudelleen', en: 'Try Again' },
      returnHome: { fi: 'Palaa etusivulle', en: 'Return to Homepage' },
      supportTitle: { fi: 'Tarvitsetko apua?', en: 'Need help?' },
      supportDescription: { 
        fi: 'Asiakaspalvelumme on käytettävissäsi arkisin klo 9-17', 
        en: 'Our customer support is available weekdays 9 AM - 5 PM' 
      },
      email: { fi: 'Sähköposti', en: 'Email' },
      phone: { fi: 'Puhelin', en: 'Phone' },
    };
    return translations[key]?.[language] || key;
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#11141A]' : 'bg-white'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Error Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center size-20 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <AlertTriangle className="size-10 text-red-600 dark:text-red-500" />
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

        {/* Error Details Card */}
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

            {/* Possible Reasons Section */}
            <div className="mb-6">
              <h2 className={`text-lg mb-3 ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
                {t('possibleReasons')}
              </h2>
              <ul className="space-y-2">
                {[t('reason1'), t('reason2'), t('reason3'), t('reason4')].map((reason, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-[#64748B]'}`}>
                      {reason}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What to Do Section */}
            <div>
              <h2 className={`text-lg mb-3 ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
                {t('whatToDo')}
              </h2>
              <div className="space-y-3">
                {[t('step1'), t('step2'), t('step3'), t('step4')].map((step, index) => (
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
            </div>
          </Card>
        </motion.div>

        {/* Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className={`p-6 mb-8 ${
            theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-[#E2E8F0]'
          }`}>
            <h2 className={`text-lg mb-3 ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
              {t('supportTitle')}
            </h2>
            <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`}>
              {t('supportDescription')}
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`}>
                  {t('email')}:
                </span>
                <a 
                  href="mailto:info@mitraauto.fi" 
                  className="text-sm text-[#FF6B00] hover:underline"
                >
                  info@mitraauto.fi
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`}>
                  {t('phone')}:
                </span>
                <a 
                  href="tel:+358401234567" 
                  className="text-sm text-[#FF6B00] hover:underline"
                >
                  +358 40 123 4567
                </a>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            onClick={onRetryCheckout}
            className="bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white px-8"
          >
            <RefreshCw className="size-4 mr-2" />
            {t('retryCheckout')}
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
