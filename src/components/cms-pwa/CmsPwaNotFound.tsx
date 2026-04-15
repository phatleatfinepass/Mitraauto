import React from 'react';
import { BrokenCar404 } from '../BrokenCar404';
import { useLanguage } from '../LanguageContext';
import { publicSiteUrl, pwaPath } from '../../config/runtime';

export function CmsPwaNotFound({ path }: { path: string }) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0E1117] px-5 py-10 text-white">
      <div className="mx-auto grid min-h-[70vh] w-full max-w-6xl items-center gap-10 lg:grid-cols-[minmax(280px,420px)_minmax(320px,1fr)]">
        <div className="order-2 lg:order-1">
          <BrokenCar404 dark />
        </div>

        <div className="order-1 lg:order-2">
          <p className="text-sm font-medium text-[#FF6B35]">{t('notFound.badge')}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{t('notFound.pwaTitle')}</h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/65 sm:text-lg">{t('notFound.pwaBody')}</p>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
            <span className="font-medium text-white">{t('notFound.pathLabel')}</span> {path}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={pwaPath('/')}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#FF6B35] px-5 py-2 text-sm font-medium text-[#11141A]"
            >
              {t('notFound.backCmsPwa')}
            </a>
            <a
              href={publicSiteUrl}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 px-5 py-2 text-sm font-medium text-white"
            >
              {t('notFound.goWebsite')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
