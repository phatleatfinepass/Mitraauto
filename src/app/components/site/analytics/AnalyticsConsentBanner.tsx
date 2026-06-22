import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';
import { Button } from '../../ui/button';
import {
  canShowClarityConsent,
  readClarityConsent,
  setClarityConsent,
} from '../../../lib/clarity';

export function AnalyticsConsentBanner() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const refreshVisibility = () => {
      setVisible(canShowClarityConsent() && readClarityConsent() === null);
    };
    const openSettings = () => {
      setVisible(canShowClarityConsent());
    };

    refreshVisibility();
    window.addEventListener('mitra:open-analytics-consent', openSettings);
    return () => {
      window.removeEventListener('mitra:open-analytics-consent', openSettings);
    };
  }, []);

  if (!visible) {
    return null;
  }

  const handleChoice = (consent: 'granted' | 'denied') => {
    setClarityConsent(consent);
    setVisible(false);
  };

  return (
    <section
      aria-label={t('analyticsConsent.title')}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-4 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/88"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">{t('analyticsConsent.title')}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              {t('analyticsConsent.description')}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => handleChoice('denied')}>
            {t('analyticsConsent.decline')}
          </Button>
          <Button type="button" onClick={() => handleChoice('granted')}>
            {t('analyticsConsent.accept')}
          </Button>
        </div>
      </div>
    </section>
  );
}
