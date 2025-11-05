import React, { useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { FileText, Download } from 'lucide-react';
import { motion } from 'motion/react';

interface LegalPageProps {
  initialSection?: 'privacy' | 'terms';
}

export function LegalPage({ initialSection }: LegalPageProps) {
  const { t } = useLanguage();

  useEffect(() => {
    if (initialSection) {
      setTimeout(() => {
        const element = document.getElementById(initialSection);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [initialSection]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0D10] to-[#151A22]">
      {/* Navigation Bar */}
      <div className="sticky top-0 z-40 bg-[#0B0D10]/80 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <nav className="flex items-center justify-center gap-8 py-4">
            <a
              href="#privacy"
              className="text-sm font-medium text-white/70 hover:text-[#0B6BFF] transition-colors"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('privacy')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {t('legal.nav.privacy')}
            </a>
            <span className="text-white/30">|</span>
            <a
              href="#terms"
              className="text-sm font-medium text-white/70 hover:text-[#0B6BFF] transition-colors"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('terms')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {t('legal.nav.terms')}
            </a>
          </nav>
        </div>
      </div>

      {/* Privacy Policy Section */}
      <section id="privacy" className="py-24 lg:py-32 scroll-mt-16">
        <div className="container mx-auto max-w-4xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-12">
              <h1 className="text-4xl lg:text-5xl text-white tracking-tight mb-4">
                {t('legal.privacy.title')}
              </h1>
              <div className="h-1 w-20 bg-[#0B6BFF] rounded-full mb-6" />
              <p className="text-lg text-white/60">
                {t('legal.privacy.subtitle')}
              </p>
            </div>

            <Card className="bg-white/5 border-white/10 rounded-2xl p-8 lg:p-12 backdrop-blur-sm">
              <div className="space-y-8 text-white/80">
                {/* 1. Data Controller */}
                <div>
                  <h2 className="text-2xl text-white mb-4">{t('legal.privacy.controller.title')}</h2>
                  <p className="mb-3">{t('legal.privacy.controller.intro')}</p>
                  <ul className="space-y-2 ml-6 list-disc">
                    <li><strong>{t('legal.privacy.controller.company')}:</strong> Mitra Auto Oy</li>
                    <li><strong>{t('legal.privacy.controller.businessId')}:</strong> 3408833-8</li>
                    <li><strong>{t('legal.privacy.controller.address')}:</strong> Hankasuontie 5, 00390 Helsinki</li>
                    <li><strong>{t('legal.privacy.controller.email')}:</strong> <a href="mailto:info.mitra.auto@gmail.com" className="text-[#0B6BFF] hover:underline">info.mitra.auto@gmail.com</a></li>
                    <li><strong>{t('legal.privacy.controller.phone')}:</strong> <a href="tel:+358407777163" className="text-[#0B6BFF] hover:underline">+358 40 777 7163</a></li>
                  </ul>
                </div>

                {/* 2. What Data We Collect */}
                <div>
                  <h2 className="text-2xl text-white mb-4">{t('legal.privacy.dataCollected.title')}</h2>
                  <p className="mb-3">{t('legal.privacy.dataCollected.intro')}</p>
                  <ul className="space-y-2 ml-6 list-disc">
                    <li>{t('legal.privacy.dataCollected.item1')}</li>
                    <li>{t('legal.privacy.dataCollected.item2')}</li>
                    <li>{t('legal.privacy.dataCollected.item3')}</li>
                    <li>{t('legal.privacy.dataCollected.item4')}</li>
                    <li>{t('legal.privacy.dataCollected.item5')}</li>
                    <li>{t('legal.privacy.dataCollected.item6')}</li>
                  </ul>
                </div>

                {/* 3. Legal Basis */}
                <div>
                  <h2 className="text-2xl text-white mb-4">{t('legal.privacy.legalBasis.title')}</h2>
                  <p className="mb-3">{t('legal.privacy.legalBasis.intro')}</p>
                  <ul className="space-y-2 ml-6 list-disc">
                    <li><strong>{t('legal.privacy.legalBasis.contract')}:</strong> {t('legal.privacy.legalBasis.contractDesc')}</li>
                    <li><strong>{t('legal.privacy.legalBasis.consent')}:</strong> {t('legal.privacy.legalBasis.consentDesc')}</li>
                    <li><strong>{t('legal.privacy.legalBasis.legitimate')}:</strong> {t('legal.privacy.legalBasis.legitimateDesc')}</li>
                  </ul>
                </div>

                {/* 4. How We Use Data */}
                <div>
                  <h2 className="text-2xl text-white mb-4">{t('legal.privacy.dataUse.title')}</h2>
                  <p className="mb-3">{t('legal.privacy.dataUse.intro')}</p>
                  <ul className="space-y-2 ml-6 list-disc">
                    <li>{t('legal.privacy.dataUse.item1')}</li>
                    <li>{t('legal.privacy.dataUse.item2')}</li>
                    <li>{t('legal.privacy.dataUse.item3')}</li>
                    <li>{t('legal.privacy.dataUse.item4')}</li>
                    <li>{t('legal.privacy.dataUse.item5')}</li>
                  </ul>
                </div>

                {/* 5. Disclosure & Sharing */}
                <div>
                  <h2 className="text-2xl text-white mb-4">{t('legal.privacy.sharing.title')}</h2>
                  <p className="mb-3">{t('legal.privacy.sharing.intro')}</p>
                  <ul className="space-y-2 ml-6 list-disc">
                    <li>{t('legal.privacy.sharing.item1')}</li>
                    <li>{t('legal.privacy.sharing.item2')}</li>
                  </ul>
                  <p className="mt-3 font-semibold">{t('legal.privacy.sharing.noSell')}</p>
                </div>

                {/* 6. International Transfers */}
                <div>
                  <h2 className="text-2xl text-white mb-4">{t('legal.privacy.transfers.title')}</h2>
                  <p>{t('legal.privacy.transfers.desc')}</p>
                </div>

                {/* 7. Data Retention */}
                <div>
                  <h2 className="text-2xl text-white mb-4">{t('legal.privacy.retention.title')}</h2>
                  <p className="mb-3">{t('legal.privacy.retention.intro')}</p>
                  <ul className="space-y-2 ml-6 list-disc">
                    <li>{t('legal.privacy.retention.item1')}</li>
                    <li>{t('legal.privacy.retention.item2')}</li>
                  </ul>
                </div>

                {/* 8. Your Rights */}
                <div>
                  <h2 className="text-2xl text-white mb-4">{t('legal.privacy.rights.title')}</h2>
                  <p className="mb-3">{t('legal.privacy.rights.intro')}</p>
                  <ul className="space-y-2 ml-6 list-disc">
                    <li><strong>{t('legal.privacy.rights.access')}:</strong> {t('legal.privacy.rights.accessDesc')}</li>
                    <li><strong>{t('legal.privacy.rights.correction')}:</strong> {t('legal.privacy.rights.correctionDesc')}</li>
                    <li><strong>{t('legal.privacy.rights.erasure')}:</strong> {t('legal.privacy.rights.erasureDesc')}</li>
                    <li><strong>{t('legal.privacy.rights.restriction')}:</strong> {t('legal.privacy.rights.restrictionDesc')}</li>
                    <li><strong>{t('legal.privacy.rights.portability')}:</strong> {t('legal.privacy.rights.portabilityDesc')}</li>
                    <li><strong>{t('legal.privacy.rights.object')}:</strong> {t('legal.privacy.rights.objectDesc')}</li>
                  </ul>
                  <p className="mt-3">{t('legal.privacy.rights.contact')}</p>
                </div>

                {/* 9. Automated Decisions */}
                <div>
                  <h2 className="text-2xl text-white mb-4">{t('legal.privacy.automated.title')}</h2>
                  <p>{t('legal.privacy.automated.desc')}</p>
                </div>

                {/* 10. Cookies & Tracking */}
                <div>
                  <h2 className="text-2xl text-white mb-4">{t('legal.privacy.cookies.title')}</h2>
                  <p className="mb-3">{t('legal.privacy.cookies.intro')}</p>
                  <ul className="space-y-2 ml-6 list-disc">
                    <li><strong>{t('legal.privacy.cookies.essential')}:</strong> {t('legal.privacy.cookies.essentialDesc')}</li>
                    <li><strong>{t('legal.privacy.cookies.analytics')}:</strong> {t('legal.privacy.cookies.analyticsDesc')}</li>
                    <li><strong>{t('legal.privacy.cookies.marketing')}:</strong> {t('legal.privacy.cookies.marketingDesc')}</li>
                  </ul>
                </div>

                {/* 11. Changes to Policy */}
                <div>
                  <h2 className="text-2xl text-white mb-4">{t('legal.privacy.changes.title')}</h2>
                  <p className="mb-3">{t('legal.privacy.changes.desc')}</p>
                  <p className="font-semibold">{t('legal.privacy.changes.effective')}: {t('legal.privacy.changes.date')}</p>
                </div>
              </div>

              {/* Download Button */}
              <div className="mt-8 pt-8 border-t border-white/10">
                <Button
                  variant="outline"
                  className="border-[#0B6BFF]/30 text-[#0B6BFF] hover:bg-[#0B6BFF]/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('legal.downloadPdf')}
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Terms & Conditions Section */}
      <section id="terms" className="py-24 lg:py-32 scroll-mt-16">
        <div className="container mx-auto max-w-4xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-12">
              <h1 className="text-4xl lg:text-5xl text-white tracking-tight mb-4">
                {t('legal.terms.title')}
              </h1>
              <div className="h-1 w-20 bg-[#0B6BFF] rounded-full mb-6" />
              <p className="text-lg text-white/60">
                {t('legal.terms.subtitle')}
              </p>
            </div>

            <Card className="bg-white/5 border-white/10 rounded-2xl p-8 lg:p-12 backdrop-blur-sm">
              <div className="space-y-8 text-white/80">
                {/* 1. Definitions */}
                <div>
                  <h2 className="text-2xl text-white mb-4">{t('legal.terms.definitions.title')}</h2>
                  <p className="mb-3">{t('legal.terms.definitions.intro')}</p>
                  <ul className="space-y-2 ml-6 list-disc">
                    <li><strong>{t('legal.terms.definitions.customer')}:</strong> {t('legal.terms.definitions.customerDesc')}</li>
                    <li><strong>{t('legal.terms.definitions.vehicle')}:</strong> {t('legal.terms.definitions.vehicleDesc')}</li>
                    <li><strong>{t('legal.terms.definitions.service')}:</strong> {t('legal.terms.definitions.serviceDesc')}</li>
                    <li><strong>{t('legal.terms.definitions.product')}:</strong> {t('legal.terms.definitions.productDesc')}</li>
                    <li><strong>{t('legal.terms.definitions.booking')}:</strong> {t('legal.terms.definitions.bookingDesc')}</li>
                    <li><strong>{t('legal.terms.definitions.serviceHistory')}:</strong> {t('legal.terms.definitions.serviceHistoryDesc')}</li>
                  </ul>
                </div>

                {/* 2. Scope of Services */}
                <div>
                  <h2 className="text-2xl text-white mb-4">{t('legal.terms.scope.title')}</h2>
                  <p className="mb-3">{t('legal.terms.scope.intro')}</p>
                  <ul className="space-y-2 ml-6 list-disc">
                    <li>{t('legal.terms.scope.item1')}</li>
                    <li>{t('legal.terms.scope.item2')}</li>
                    <li>{t('legal.terms.scope.item3')}</li>
                    <li>{t('legal.terms.scope.item4')}</li>
                  </ul>
                </div>

                {/* 3. Customer Obligations */}
                <div>
                  <h2 className="text-2xl text-white mb-4">{t('legal.terms.obligations.title')}</h2>
                  <p className="mb-3">{t('legal.terms.obligations.intro')}</p>
                  <ul className="space-y-2 ml-6 list-disc">
                    <li>{t('legal.terms.obligations.item1')}</li>
                    <li>{t('legal.terms.obligations.item2')}</li>
                    <li>{t('legal.terms.obligations.item3')}</li>
                    <li>{t('legal.terms.obligations.item4')}</li>
                  </ul>
                </div>

                {/* 4. Bookings & Cancellation */}
                <div>
                  <h2 className="text-2xl text-white mb-4">{t('legal.terms.bookings.title')}</h2>
                  <p className="mb-3">{t('legal.terms.bookings.intro')}</p>
                  <ul className="space-y-2 ml-6 list-disc">
                    <li><strong>{t('legal.terms.bookings.process')}:</strong> {t('legal.terms.bookings.processDesc')}</li>
                    <li><strong>{t('legal.terms.bookings.cancellation')}:</strong> {t('legal.terms.bookings.cancellationDesc')}</li>
                    <li><strong>{t('legal.terms.bookings.rescheduling')}:</strong> {t('legal.terms.bookings.reschedulingDesc')}</li>
                    <li><strong>{t('legal.terms.bookings.noShow')}:</strong> {t('legal.terms.bookings.noShowDesc')}</li>
                  </ul>
                </div>

                {/* 5. Price & Payment */}
                <div>
                  <h2 className="text-2xl text-white mb-4">{t('legal.terms.payment.title')}</h2>
                  <p className="mb-3">{t('legal.terms.payment.intro')}</p>
                  <ul className="space-y-2 ml-6 list-disc">
                    <li>{t('legal.terms.payment.item1')}</li>
                    <li>{t('legal.terms.payment.item2')}</li>
                    <li>{t('legal.terms.payment.item3')}</li>
                    <li>{t('legal.terms.payment.item4')}</li>
                  </ul>
                </div>

                {/* 6. Delivery & Stock */}
                <div>
                  <h2 className="text-2xl text-white mb-4">{t('legal.terms.delivery.title')}</h2>
                  <p className="mb-3">{t('legal.terms.delivery.intro')}</p>
                  <ul className="space-y-2 ml-6 list-disc">
                    <li>{t('legal.terms.delivery.item1')}</li>
                    <li>{t('legal.terms.delivery.item2')}</li>
                    <li>{t('legal.terms.delivery.item3')}</li>
                  </ul>
                </div>

                {/* 7. Use of Vehicle Data */}
                <div>
                  <h2 className="text-2xl text-white mb-4">{t('legal.terms.vehicleData.title')}</h2>
                  <p>{t('legal.terms.vehicleData.desc')}</p>
                </div>

                {/* 8. Warranty & Liability */}
                <div>
                  <h2 className="text-2xl text-white mb-4">{t('legal.terms.warranty.title')}</h2>
                  <p className="mb-3">{t('legal.terms.warranty.intro')}</p>
                  <ul className="space-y-2 ml-6 list-disc">
                    <li><strong>{t('legal.terms.warranty.service')}:</strong> {t('legal.terms.warranty.serviceDesc')}</li>
                    <li><strong>{t('legal.terms.warranty.products')}:</strong> {t('legal.terms.warranty.productsDesc')}</li>
                    <li><strong>{t('legal.terms.warranty.limitation')}:</strong> {t('legal.terms.warranty.limitationDesc')}</li>
                    <li><strong>{t('legal.terms.warranty.indirect')}:</strong> {t('legal.terms.warranty.indirectDesc')}</li>
                  </ul>
                </div>

                {/* 9. Intellectual Property */}
                <div>
                  <h2 className="text-2xl text-white mb-4">{t('legal.terms.ip.title')}</h2>
                  <p>{t('legal.terms.ip.desc')}</p>
                </div>

                {/* 10. Governing Law */}
                <div>
                  <h2 className="text-2xl text-white mb-4">{t('legal.terms.law.title')}</h2>
                  <p className="mb-3">{t('legal.terms.law.intro')}</p>
                  <ul className="space-y-2 ml-6 list-disc">
                    <li><strong>{t('legal.terms.law.governing')}:</strong> {t('legal.terms.law.governingDesc')}</li>
                    <li><strong>{t('legal.terms.law.disputes')}:</strong> {t('legal.terms.law.disputesDesc')}</li>
                    <li><strong>{t('legal.terms.law.consumer')}:</strong> {t('legal.terms.law.consumerDesc')}</li>
                  </ul>
                </div>

                {/* 11. Amendment */}
                <div>
                  <h2 className="text-2xl text-white mb-4">{t('legal.terms.amendment.title')}</h2>
                  <p className="mb-3">{t('legal.terms.amendment.desc')}</p>
                  <p className="font-semibold">{t('legal.terms.amendment.effective')}: {t('legal.terms.amendment.date')}</p>
                </div>
              </div>

              {/* Download Button */}
              <div className="mt-8 pt-8 border-t border-white/10">
                <Button
                  variant="outline"
                  className="border-[#0B6BFF]/30 text-[#0B6BFF] hover:bg-[#0B6BFF]/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('legal.downloadPdf')}
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
