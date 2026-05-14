import { useState } from 'react';
import { useLanguage } from '../../../i18n/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, MessageCircle, Search, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';

interface FAQPageProps {
  onBookingClick: () => void;
  onNavigate: (path: string) => void;
}

export function FAQPage({ onBookingClick, onNavigate }: FAQPageProps) {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const faqCategories = [
    {
      title: t('faqPage.categories.booking'),
      questions: [
        {
          q: t('faqPage.booking.book.q'),
          a: t('faqPage.booking.book.a'),
        },
        {
          q: t('faqPage.booking.advance.q'),
          a: t('faqPage.booking.advance.a'),
        },
        {
          q: t('faqPage.booking.cancel.q'),
          a: t('faqPage.booking.cancel.a'),
        },
      ],
    },
    {
      title: t('faqPage.categories.services'),
      questions: [
        {
          q: t('faqPage.services.offer.q'),
          a: t('faqPage.services.offer.a'),
        },
        {
          q: t('faqPage.services.tireChange.q'),
          a: t('faqPage.services.tireChange.a'),
        },
        {
          q: t('faqPage.services.parts.q'),
          a: t('faqPage.services.parts.a'),
        },
      ],
    },
    {
      title: t('faqPage.categories.pricing'),
      questions: [
        {
          q: t('faqPage.pricing.how.q'),
          a: t('faqPage.pricing.how.a'),
        },
        {
          q: t('faqPage.pricing.cards.q'),
          a: t('faqPage.pricing.cards.a'),
        },
        {
          q: t('faqPage.pricing.discounts.q'),
          a: t('faqPage.pricing.discounts.a'),
        },
      ],
    },
    {
      title: t('faqPage.categories.tireHotel'),
      questions: [
        {
          q: t('faqPage.tireHotel.include.q'),
          a: t('faqPage.tireHotel.include.a'),
        },
        {
          q: t('faqPage.tireHotel.cost.q'),
          a: t('faqPage.tireHotel.cost.a'),
        },
        {
          q: t('faqPage.tireHotel.insured.q'),
          a: t('faqPage.tireHotel.insured.a'),
        },
      ],
    },
    {
      title: t('faqPage.categories.location'),
      questions: [
        {
          q: t('faqPage.location.where.q'),
          a: t('faqPage.location.where.a'),
        },
        {
          q: t('faqPage.location.hours.q'),
          a: t('faqPage.location.hours.a'),
        },
        {
          q: t('faqPage.location.waiting.q'),
          a: t('faqPage.location.waiting.a'),
        },
      ],
    },
  ];

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(
      item =>
        searchTerm.length < 2 ||
        item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.a.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  let questionIndex = 0;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Breadcrumb */}
            <div className="text-sm text-muted-foreground mb-4">
              {t('faqPage.breadcrumb.home')} / {t('faqPage.breadcrumb.faq')}
            </div>

            {/* H1 - No Helsinki (FAQ page) */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              {t('faqPage.title')}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {t('faqPage.subtitle')}
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('faqPage.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {filteredCategories.map((category, catIndex) => (
              <motion.div
                key={catIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: catIndex * 0.1 }}
                className="mb-12"
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <MessageCircle className="w-6 h-6 text-accent" />
                  {category.title}
                </h2>

                <div className="space-y-3">
                  {category.questions.map((item) => {
                    const currentIndex = questionIndex++;
                    const isOpen = openIndex === currentIndex;

                    return (
                      <Card key={currentIndex} className="overflow-hidden">
                        <button
                          onClick={() => toggleQuestion(currentIndex)}
                          className="w-full text-left p-6 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <h3 className="font-semibold text-lg pr-4">{item.q}</h3>
                            <ChevronDown
                              className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${
                                isOpen ? 'transform rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <CardContent className="px-6 pb-6 pt-0">
                                <p className="text-muted-foreground leading-relaxed">{item.a}</p>
                              </CardContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    );
                  })}
                </div>
              </motion.div>
            ))}

            {filteredCategories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {t('faqPage.noResults')}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Still have questions? */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-3xl mx-auto text-center"
          >
            <MessageCircle className="w-16 h-16 text-accent mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('faqPage.stillHaveQuestions')}
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              {t('faqPage.contactHelp')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => onNavigate(t('faqPage.contactLink'))}
                className="px-8 py-6 text-lg"
              >
                {t('faqPage.contactUs')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onBookingClick}
                className="px-8 py-6 text-lg"
              >
                {t('faqPage.bookNow')}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* NAP Info Footer */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-2">Mitra Auto Oy</p>
            <p>Hankasuontie 5, 00390 Helsinki</p>
            <p>{t('faqPage.phoneEmail')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
