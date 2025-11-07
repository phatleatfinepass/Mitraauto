import React from 'react';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import { Button } from './ui/button';
import { CheckCircle, Package, Mail, ArrowRight, Home } from 'lucide-react';
import { motion } from 'motion/react';

interface OrderSuccessPageProps {
  onContinueShopping: () => void;
  onViewOrders?: () => void;
}

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({ 
  onContinueShopping,
  onViewOrders 
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();

  const orderNumber = `MA${Date.now().toString().slice(-8)}`;

  const t = (key: string) => {
    const translations: Record<string, { fi: string; en: string }> = {
      orderConfirmed: { fi: 'Tilaus vahvistettu!', en: 'Order Confirmed!' },
      thankYou: { fi: 'Kiitos tilauksestasi', en: 'Thank you for your order' },
      orderNumber: { fi: 'Tilausnumero', en: 'Order Number' },
      confirmationEmail: { fi: 'Saat tilausvahvistuksen sähköpostiisi lähiminuutteina', en: 'You will receive an order confirmation email shortly' },
      nextSteps: { fi: 'Seuraavat vaiheet', en: 'Next Steps' },
      step1Title: { fi: 'Tilausvahvistus', en: 'Order Confirmation' },
      step1Desc: { fi: 'Lähetämme tilausvahvistuksen sähköpostiisi', en: 'We will send an order confirmation to your email' },
      step2Title: { fi: 'Valmistelu', en: 'Preparation' },
      step2Desc: { fi: 'Tuotteesi pakataan ja valmistell aan toimitusta varten', en: 'Your products will be packed and prepared for delivery' },
      step3Title: { fi: 'Toimitus', en: 'Delivery' },
      step3Desc: { fi: 'Tilauksesi toimitetaan antamaasi osoitteeseen', en: 'Your order will be delivered to your address' },
      continueShopping: { fi: 'Jatka ostoksia', en: 'Continue Shopping' },
      viewOrders: { fi: 'Näytä tilaukset', en: 'View Orders' },
      backToHome: { fi: 'Takaisin etusivulle', en: 'Back to Home' },
    };
    return translations[key]?.[language] || key;
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${
      theme === 'dark' ? 'bg-[#11141A]' : 'bg-white'
    }`}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15,
              delay: 0.2 
            }}
            className="flex justify-center mb-6"
          >
            <div className="size-24 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="size-12 text-green-600" />
            </div>
          </motion.div>

          {/* Title */}
          <h1 className={`text-3xl sm:text-4xl mb-3 ${
            theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
          }`}>
            {t('orderConfirmed')}
          </h1>

          <p className={`text-lg mb-8 ${
            theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
          }`}>
            {t('thankYou')}
          </p>

          {/* Order Number */}
          <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full mb-8 ${
            theme === 'dark' ? 'bg-[#1C1C1E] border border-white/10' : 'bg-gray-50 border border-[#E2E8F0]'
          }`}>
            <Package className={`size-5 ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`} />
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`}>
              {t('orderNumber')}:
            </span>
            <span className={`text-lg ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
              {orderNumber}
            </span>
          </div>

          {/* Email Confirmation */}
          <div className={`flex items-start gap-3 p-4 rounded-xl mb-8 ${
            theme === 'dark' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
          }`}>
            <Mail className={`size-5 mt-0.5 flex-shrink-0 ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <p className={`text-sm text-left ${
              theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
            }`}>
              {t('confirmationEmail')}
            </p>
          </div>

          {/* Next Steps */}
          <div className="mb-8">
            <h2 className={`text-xl mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
            }`}>
              {t('nextSteps')}
            </h2>

            <div className="space-y-4">
              {[
                {
                  number: '1',
                  title: t('step1Title'),
                  description: t('step1Desc'),
                },
                {
                  number: '2',
                  title: t('step2Title'),
                  description: t('step2Desc'),
                },
                {
                  number: '3',
                  title: t('step3Title'),
                  description: t('step3Desc'),
                },
              ].map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className={`flex items-start gap-4 p-4 rounded-xl text-left ${
                    theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-gray-50'
                  }`}
                >
                  <div className="size-8 rounded-full bg-[#FF6B00] flex items-center justify-center flex-shrink-0 text-white">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-sm mb-1 ${
                      theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
                    }`}>
                      {step.title}
                    </h3>
                    <p className={`text-xs ${
                      theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={onContinueShopping}
              className="bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white h-12 px-6"
            >
              {t('continueShopping')}
              <ArrowRight className="size-5 ml-2" />
            </Button>
            
            <Button
              onClick={onContinueShopping}
              variant="outline"
              className={`h-12 px-6 ${
                theme === 'dark'
                  ? 'border-white/20 hover:bg-white/5 text-white'
                  : 'border-[#E2E8F0] hover:bg-gray-50 text-[#0F172A]'
              }`}
            >
              <Home className="size-5 mr-2" />
              {t('backToHome')}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
