export const LOCALES = ['en', 'sq', 'de', 'it'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_STORAGE_KEY = 'worknest_locale';

export const LANGUAGE_OPTIONS: Array<{
  locale: Locale;
  labelKey: string;
  flagSrc: string;
}> = [
  { locale: 'en', labelKey: 'language.english', flagSrc: '/flags/gb.png' },
  { locale: 'sq', labelKey: 'language.albanian', flagSrc: '/flags/al.png' },
  { locale: 'de', labelKey: 'language.german', flagSrc: '/flags/de.svg' },
  { locale: 'it', labelKey: 'language.italian', flagSrc: '/flags/it.svg' },
];

export function isLocale(value: string | null | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}
