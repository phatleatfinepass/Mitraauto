import React, { useEffect, useState } from 'react';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';
import { Card } from './ui/card';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PrivacyPolicyV1, PrivacyPolicyV2, PrivacyPolicyV3, PrivacyPolicyV4, PrivacyPolicyV5 } from './legal/PrivacyPolicyVersions';
import { TermsV1, TermsV2, TermsV3, TermsV4, TermsV5 } from './legal/TermsVersions';

interface LegalPageProps {
  initialSection?: 'privacy' | 'terms';
}

interface PrivacyVersion {
  version: string;
  date: string;
  dateKey: string;
  descriptionKey: string;
}

const privacyVersions: PrivacyVersion[] = [
  { 
    version: 'v1.0', 
    date: '2023-12-01',
    dateKey: 'legal.timeline.v1.date',
    descriptionKey: 'legal.timeline.v1.description'
  },
  { 
    version: 'v2.0', 
    date: '2025-03-10',
    dateKey: 'legal.timeline.v2.date',
    descriptionKey: 'legal.timeline.v2.description'
  },
  { 
    version: 'v3.0', 
    date: '2025-06-20',
    dateKey: 'legal.timeline.v3.date',
    descriptionKey: 'legal.timeline.v3.description'
  },
  { 
    version: 'v4.0', 
    date: '2025-09-15',
    dateKey: 'legal.timeline.v4.date',
    descriptionKey: 'legal.timeline.v4.description'
  },
  { 
    version: 'v5.0', 
    date: '2025-11-05',
    dateKey: 'legal.timeline.v5.date',
    descriptionKey: 'legal.timeline.v5.description'
  },
];

export function LegalPage({ initialSection }: LegalPageProps) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [selectedVersion, setSelectedVersion] = useState<number>(4); // Default to latest version (v5.0)

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

  const handleVersionSelect = (index: number) => {
    setSelectedVersion(index);
    // Smooth scroll to privacy section on version change
    setTimeout(() => {
      const element = document.getElementById('privacy');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handlePreviousVersion = () => {
    if (selectedVersion > 0) {
      handleVersionSelect(selectedVersion - 1);
    }
  };

  const handleNextVersion = () => {
    if (selectedVersion < privacyVersions.length - 1) {
      handleVersionSelect(selectedVersion + 1);
    }
  };

  // Render the appropriate Privacy Policy version
  const renderPrivacyVersion = () => {
    switch (selectedVersion) {
      case 0:
        return <PrivacyPolicyV1 t={t} />;
      case 1:
        return <PrivacyPolicyV2 t={t} />;
      case 2:
        return <PrivacyPolicyV3 t={t} />;
      case 3:
        return <PrivacyPolicyV4 t={t} />;
      case 4:
      default:
        return <PrivacyPolicyV5 t={t} />;
    }
  };

  // Render the appropriate Terms version
  const renderTermsVersion = () => {
    switch (selectedVersion) {
      case 0:
        return <TermsV1 t={t} />;
      case 1:
        return <TermsV2 t={t} />;
      case 2:
        return <TermsV3 t={t} />;
      case 3:
        return <TermsV4 t={t} />;
      case 4:
      default:
        return <TermsV5 t={t} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Chronicle Timeline Navigation */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8 py-6 sm:py-8">
          {/* Document History Title */}
          <h3 className="text-center text-xs sm:text-sm uppercase tracking-widest text-muted-foreground/60 mb-6 sm:mb-8">
            Document History
          </h3>
          
          {/* Timeline with Navigation */}
          <div className="relative mb-6 sm:mb-8 max-w-3xl mx-auto px-4 sm:px-8">
            <div className="flex items-center gap-4">
              {/* Left Chevron */}
              <button
                onClick={handlePreviousVersion}
                disabled={selectedVersion === 0}
                className={`
                  flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full 
                  flex items-center justify-center transition-all duration-300
                  ${selectedVersion === 0
                    ? 'bg-muted/50 text-muted-foreground/30 cursor-not-allowed'
                    : 'bg-[#FF6B35]/10 text-[#FF6B35] hover:bg-[#FF6B35]/20 hover:scale-110 active:scale-95'
                  }
                `}
                aria-label="Previous version"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Base Timeline Line */}
              <div className="flex-1 relative h-px bg-border">
                {/* Progress Line */}
                <div 
                  className="absolute top-0 left-0 h-full bg-[#FF6B35]/30 transition-all duration-700 ease-in-out"
                  style={{ 
                    width: `${(selectedVersion / (privacyVersions.length - 1)) * 100}%` 
                  }}
                />
                
                {/* Timeline Markers */}
                <div className="absolute inset-0 flex justify-between items-start">
                  {privacyVersions.map((version, index) => (
                    <button
                      key={version.date}
                      onClick={() => handleVersionSelect(index)}
                      className="group relative flex flex-col items-center min-w-0 flex-1"
                    >
                      {/* Vertical Marker */}
                      <div 
                        className={`
                          w-px transition-all duration-300
                          ${selectedVersion === index 
                            ? 'h-4 bg-[#FF6B35]' 
                            : selectedVersion > index
                              ? 'h-2.5 bg-[#FF6B35]/40 group-hover:h-4 group-hover:bg-[#FF6B35]/60'
                              : 'h-2.5 bg-border/60 group-hover:h-4 group-hover:bg-[#FF6B35]/30'
                          }
                        `}
                      />
                      
                      {/* Date Label - Always Visible */}
                      <span 
                        className={`
                          mt-2 text-[10px] sm:text-xs transition-all duration-300 text-center px-1
                          ${selectedVersion === index 
                            ? 'text-[#FF6B35]' 
                            : 'text-muted-foreground/70 group-hover:text-muted-foreground'
                          }
                        `}
                        style={{ 
                          wordBreak: 'break-word',
                          lineHeight: '1.2'
                        }}
                      >
                        {t(version.dateKey)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Chevron */}
              <button
                onClick={handleNextVersion}
                disabled={selectedVersion === privacyVersions.length - 1}
                className={`
                  flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full 
                  flex items-center justify-center transition-all duration-300
                  ${selectedVersion === privacyVersions.length - 1
                    ? 'bg-muted/50 text-muted-foreground/30 cursor-not-allowed'
                    : 'bg-[#FF6B35]/10 text-[#FF6B35] hover:bg-[#FF6B35]/20 hover:scale-110 active:scale-95'
                  }
                `}
                aria-label="Next version"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

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
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-4xl lg:text-5xl tracking-tight">
                  {t('legal.privacy.title')}
                </h1>
                <motion.span
                  key={selectedVersion}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] text-sm"
                >
                  {privacyVersions[selectedVersion].version}
                </motion.span>
              </div>
              <div className="h-1 w-20 bg-[#FF6B35] rounded-full mb-6" />
              <p className="text-lg text-muted-foreground mb-4">
                {t('legal.privacy.subtitle')}
              </p>
              <motion.div
                key={selectedVersion}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-muted-foreground space-y-1"
              >
                <p><strong>{t('legal.privacy.effective')}:</strong> {t(privacyVersions[selectedVersion].dateKey)}</p>
                <p><strong>{t('legal.privacy.lastUpdated')}:</strong> {t(privacyVersions[selectedVersion].dateKey)}</p>
                <p className="mt-3 text-xs italic text-[#FF6B35]">
                  {t(privacyVersions[selectedVersion].descriptionKey)}
                </p>
              </motion.div>
            </div>

            <motion.div
              key={selectedVersion}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {renderPrivacyVersion()}
            </motion.div>
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
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-4xl lg:text-5xl tracking-tight">
                  {t('legal.terms.title')}
                </h1>
                <motion.span
                  key={selectedVersion}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] text-sm"
                >
                  {privacyVersions[selectedVersion].version}
                </motion.span>
              </div>
              <div className="h-1 w-20 bg-[#FF6B35] rounded-full mb-6" />
              <p className="text-lg text-muted-foreground mb-4">
                {t('legal.terms.subtitle')}
              </p>
              <motion.div
                key={selectedVersion}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-muted-foreground space-y-1"
              >
                <p><strong>{t('legal.terms.effective')}:</strong> {t(privacyVersions[selectedVersion].dateKey)}</p>
                <p><strong>{t('legal.terms.lastUpdated')}:</strong> {t(privacyVersions[selectedVersion].dateKey)}</p>
                <p className="mt-3 text-xs italic text-[#FF6B35]">
                  {t(privacyVersions[selectedVersion].descriptionKey)}
                </p>
              </motion.div>
            </div>

            <motion.div
              key={selectedVersion}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {renderTermsVersion()}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Paytrail Payment Service Provider Section */}
      <section id="paytrail" className="py-24 lg:py-32 scroll-mt-16 bg-muted/30">
        <div className="container mx-auto max-w-4xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-12">
              <h1 className="text-4xl lg:text-5xl tracking-tight mb-4">
                {t('legal.paytrail.title')}
              </h1>
              <div className="h-1 w-20 bg-[#FF6B35] rounded-full mb-6" />
              <p className="text-lg text-muted-foreground mb-4">
                {t('legal.paytrail.subtitle')}
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>{t('legal.paytrail.effective')}:</strong> {t('legal.paytrail.effectiveDate')}</p>
                <p><strong>{t('legal.paytrail.lastUpdated')}:</strong> {t('legal.paytrail.effectiveDate')}</p>
              </div>
            </div>

            <Card className="border rounded-2xl p-8 lg:p-12">
              <div className="space-y-6 text-muted-foreground">
                <p className="text-base leading-relaxed">
                  {t('legal.paytrail.intro')}
                </p>
                
                <div className="mt-6 pt-6 border-t border-border space-y-2">
                  <p className="font-medium text-foreground text-lg">{t('legal.paytrail.company')}</p>
                  <p><strong>{t('legal.paytrail.businessId')}:</strong> {t('legal.paytrail.businessIdValue')}</p>
                  <p>{t('legal.paytrail.address1')}</p>
                  <p>{t('legal.paytrail.address2')}</p>
                  <p>{t('legal.paytrail.address3')}</p>
                  <p className="mt-4">
                    <a 
                      href={t('legal.paytrail.website')}
                      className="text-[#FF6B35] hover:underline inline-flex items-center gap-1"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('legal.paytrail.website')}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
