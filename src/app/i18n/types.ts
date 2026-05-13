export type Language = 'fi' | 'en';

export type TranslationEntry = Record<Language, string>;

export type TranslationDictionary = Record<string, TranslationEntry>;
