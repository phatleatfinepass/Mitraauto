import React, { useState } from 'react';
import { useLanguage } from '../../LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, MessageCircle, Search, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';

interface FAQPageProps {
  onBookingClick: () => void;
  onNavigate: (path: string) => void;
}

export function FAQPage({ onBookingClick, onNavigate }: FAQPageProps) {
  const { language } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const faqCategories = [
    {
      title: language === 'fi' ? 'Varaaminen' : 'Booking',
      questions: [
        {
          q: language === 'fi' ? 'Miten voin varata ajan?' : 'How can I book an appointment?',
          a: language === 'fi'
            ? 'Voit varata ajan verkossa klikkaamalla "Varaa aika" -painiketta sivustomme yläosassa. Valitse palvelu, päivä ja kellonaika, ja saat välittömän vahvistuksen sähköpostitse.'
            : 'You can book online by clicking the "Book Now" button at the top of our website. Choose your service, date, and time slot, and you\'ll receive instant confirmation via email.',
        },
        {
          q: language === 'fi' ? 'Kuinka kauan etukäteen minun tulisi varata?' : 'How far in advance should I book?',
          a: language === 'fi'
            ? 'Suosittelemme varaamaan vähintään [TBD] päivää etukäteen varmistaaksesi haluamasi aikavälin saatavuuden. Kiireellisille palveluille voimme usein majoittaa lyhyemmällä varoitusajalla.'
            : 'We recommend booking at least [TBD] days in advance to ensure your preferred time slot. For urgent services, we can often accommodate shorter notice.',
        },
        {
          q: language === 'fi' ? 'Voinko peruuttaa tai siirtää varaukseni?' : 'Can I cancel or reschedule my booking?',
          a: language === 'fi'
            ? 'Kyllä, voit peruuttaa tai siirtää varauksesi verkossa [TBD] tuntia ennen varattua aikaa ilman lisäkustannuksia. Soita meille, jos tarvitset apua.'
            : 'Yes, you can cancel or reschedule online up to [TBD] hours before your appointment with no charge. Call us if you need assistance.',
        },
      ],
    },
    {
      title: language === 'fi' ? 'Palvelut' : 'Services',
      questions: [
        {
          q: language === 'fi' ? 'Mitä palveluita tarjoatte?' : 'What services do you offer?',
          a: language === 'fi'
            ? 'Tarjoamme kattavan valikoiman autohuoltopalveluita: autohuolto ja korjaus, renkaanvaihto ja tasapainotus, rengashotelli, vikadiagnostiikka ja autopesu. Katso kaikki palvelumme Palvelut-sivulta.'
            : 'We offer a comprehensive range of car services: maintenance and repair, tire change and balancing, tire hotel storage, diagnostics, and car wash. See all services on our Services page.',
        },
        {
          q: language === 'fi' ? 'Kuinka kauan renkaanvaihto kestää?' : 'How long does a tire change take?',
          a: language === 'fi'
            ? 'Tyypillinen renkaanvaihto kestää noin [TBD] minuuttia. Tämä sisältää renkaiden vaihdon, tasapainotuksen ja ilmanpaineen tarkistuksen.'
            : 'A typical tire change takes approximately [TBD] minutes. This includes changing the tires, balancing, and checking air pressure.',
        },
        {
          q: language === 'fi' ? 'Käytättekö alkuperäisiä varaosia?' : 'Do you use genuine parts?',
          a: language === 'fi'
            ? 'Kyllä, käytämme alkuperäisiä varaosia tai laadukkaita vaihtoehtoisia osia luotettavilta toimittajilta. Keskustelemme kanssasi varaosavaihtoehdoista ennen huollon aloittamista.'
            : 'Yes, we use genuine OEM parts or high-quality alternatives from trusted suppliers. We\'ll discuss parts options with you before starting any work.',
        },
      ],
    },
    {
      title: language === 'fi' ? 'Hinnoittelu' : 'Pricing',
      questions: [
        {
          q: language === 'fi' ? 'Miten hinnoittelunne toimii?' : 'How does your pricing work?',
          a: language === 'fi'
            ? 'Hinnoittelumme on läpinäkyvää ja kilpailukykyistä. Saat tarkan hinta-arvion varauksen yhteydessä. Ei piilokustannuksia – maksat vain vahvistetun hinnan.'
            : 'Our pricing is transparent and competitive. You\'ll receive an exact price estimate during booking. No hidden fees – you pay only the confirmed price.',
        },
        {
          q: language === 'fi' ? 'Hyväksyttekö luottokortit?' : 'Do you accept credit cards?',
          a: language === 'fi'
            ? 'Kyllä, hyväksymme kaikki tärkeimmät maksutavat Paytrailin kautta: luottokortit, pankkikortit ja mobiilimaksut. Kaikki maksut ovat turvallisia ja salattuja.'
            : 'Yes, we accept all major payment methods via Paytrail: credit cards, debit cards, and mobile payments. All transactions are secure and encrypted.',
        },
        {
          q: language === 'fi' ? 'Tarjoatteko alennuksia?' : 'Do you offer discounts?',
          a: language === 'fi'
            ? 'Tarjoamme sesongittain kampanjoita ja kanta-asiakasalennuksia. Tilaa uutiskirjeemme pysyäksesi ajan tasalla tarjouksista.'
            : 'We offer seasonal promotions and loyalty discounts. Subscribe to our newsletter to stay updated on special offers.',
        },
      ],
    },
    {
      title: language === 'fi' ? 'Rengashotelli' : 'Tire Hotel',
      questions: [
        {
          q: language === 'fi' ? 'Mitä rengashotelli sisältää?' : 'What does tire hotel include?',
          a: language === 'fi'
            ? 'Rengashotellipalvelumme sisältää: turvallisen sisäsäilytyksen, UV-suojatut olosuhteet, kosteudenhallinnan ja vapaan saatavuuden kausivaihdossa. Renkaasi säilytetään optimaalisissa olosuhteissa.'
            : 'Our tire hotel service includes: secure indoor storage, UV-protected conditions, humidity control, and free access for seasonal changes. Your tires are stored in optimal conditions.',
        },
        {
          q: language === 'fi' ? 'Miten paljon rengassäilytys maksaa?' : 'How much does tire storage cost?',
          a: language === 'fi'
            ? 'Rengashotelli maksaa [TBD] €/kausi. Tämä sisältää kauden säilytyksen ja ilmaisen vaihtopalvelun seuraavassa kausivaihdossa.'
            : 'Tire hotel costs [TBD] €/season. This includes seasonal storage and free mounting service at your next seasonal change.',
        },
        {
          q: language === 'fi' ? 'Onko renkaat vakuutettu säilytyksen aikana?' : 'Are tires insured during storage?',
          a: language === 'fi'
            ? 'Kyllä, kaikki säilytetyt renkaat on katettu kattavalla vakuutuksella säilytyksen aikana.'
            : 'Yes, all stored tires are covered by comprehensive insurance during storage.',
        },
      ],
    },
    {
      title: language === 'fi' ? 'Sijainti & Pääsy' : 'Location & Access',
      questions: [
        {
          q: language === 'fi' ? 'Missä te sijaitsette?' : 'Where are you located?',
          a: language === 'fi'
            ? 'Olemme Helsingissä osoitteessa Hankasuontie 5, 00390 Helsinki. Helppo pääsy autolla ja julkisilla. Ilmainen pysäköinti asiakkaille.'
            : 'We\'re located in Helsinki at Hankasuontie 5, 00390 Helsinki. Easy access by car and public transport. Free parking for customers.',
        },
        {
          q: language === 'fi' ? 'Mitkä ovat aukioloaikanne?' : 'What are your opening hours?',
          a: language === 'fi'
            ? 'Olemme avoinna: Ma–Pe: 9:00–18:00, La: 10:00–17:00, Su: Suljettu. Verkkovaraus saatavilla 24/7.'
            : 'We\'re open: Mon–Fri: 9:00–18:00, Sat: 10:00–17:00, Sun: Closed. Online booking available 24/7.',
        },
        {
          q: language === 'fi' ? 'Onko odotustila saatavilla?' : 'Is there a waiting area?',
          a: language === 'fi'
            ? 'Kyllä, meillä on mukava odotustila ilmaisella Wi-Fi:llä, kahvilla ja viihteellä. Voit myös jättää autosi ja palata myöhemmin.'
            : 'Yes, we have a comfortable waiting area with free Wi-Fi, coffee, and entertainment. You can also drop off your car and return later.',
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
              {language === 'fi' ? 'Etusivu' : 'Home'} / {language === 'fi' ? 'UKK' : 'FAQ'}
            </div>

            {/* H1 - No Helsinki (FAQ page) */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              {language === 'fi' ? 'Usein kysytyt kysymykset' : 'Frequently Asked Questions'}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {language === 'fi'
                ? 'Löydä vastauksia yleisimpiin kysymyksiin palveluistamme, hinnoittelusta ja varaamisesta'
                : 'Find answers to common questions about our services, pricing, and booking'}
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="text"
                  placeholder={language === 'fi' ? 'Hae kysymyksiä...' : 'Search questions...'}
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
                  {language === 'fi' 
                    ? 'Ei tuloksia haulle. Kokeile erilaisia hakusanoja.'
                    : 'No results found. Try different search terms.'}
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
              {language === 'fi' ? 'Etkö löytänyt vastausta?' : 'Still have questions?'}
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              {language === 'fi'
                ? 'Ota yhteyttä, niin autamme sinua mielellämme'
                : 'Contact us and we\'ll be happy to help'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => onNavigate(language === 'fi' ? '/yhteystiedot' : '/en/contact')}
                className="px-8 py-6 text-lg"
              >
                {language === 'fi' ? 'Ota yhteyttä' : 'Contact Us'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onBookingClick}
                className="px-8 py-6 text-lg"
              >
                {language === 'fi' ? 'Varaa aika' : 'Book Now'}
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
            <p>Puhelin: [TBD] | Sähköposti: [TBD]</p>
          </div>
        </div>
      </section>
    </div>
  );
}
