import { commonTranslations } from './common';
import { siteTranslations } from './site';
import { catalogTranslations } from './catalog';
import { bookingTranslations } from './booking';
import { cmsTranslations } from './cms';
import { authTranslations } from './auth';
import { emergencyTranslations } from './emergency';
import { legalTranslations } from './legal';
import type { TranslationDictionary } from '../types';

export const translations = {
  ...commonTranslations,
  ...siteTranslations,
  ...catalogTranslations,
  ...bookingTranslations,
  ...cmsTranslations,
  ...authTranslations,
  ...emergencyTranslations,
  ...legalTranslations,
} satisfies TranslationDictionary;
