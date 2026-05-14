import { commonTranslations } from './common';
import { siteTranslations } from './site';
import { catalogTranslations } from './catalog';
import { bookingTranslations } from './booking';
import { checkoutTranslations } from './checkout';
import { cmsTranslations } from './cms';
import { authTranslations } from './auth';
import { emergencyTranslations } from './emergency';
import { legalTranslations } from './legal';
import { adminTranslations } from './admin';
import { cmsPwaTranslations } from './cmsPwa';
import type { TranslationDictionary } from '../types';

export const translations = {
  ...commonTranslations,
  ...siteTranslations,
  ...catalogTranslations,
  ...bookingTranslations,
  ...checkoutTranslations,
  ...cmsTranslations,
  ...authTranslations,
  ...emergencyTranslations,
  ...legalTranslations,
  ...adminTranslations,
  ...cmsPwaTranslations,
} satisfies TranslationDictionary;
