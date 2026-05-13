import { de } from './dictionaries/de';
import { en } from './dictionaries/en';
import { it } from './dictionaries/it';
import { sq } from './dictionaries/sq';
import { DEFAULT_LOCALE, isLocale, LOCALE_STORAGE_KEY } from './locales';

const dictionaries = { en, sq, de, it } as const;

type TranslationValues = Record<string, string | number>;

function lookup(dictionary: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((current, part) => {
    if (current && typeof current === 'object' && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, dictionary);
}

function interpolate(template: string, values?: TranslationValues): string {
  if (!values) return template;
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{{${key}}}`, String(value)),
    template,
  );
}

export function translate(key: string, values?: TranslationValues): string {
  const storedLocale = typeof window !== 'undefined'
    ? window.localStorage.getItem(LOCALE_STORAGE_KEY)
    : null;
  const locale = isLocale(storedLocale) ? storedLocale : DEFAULT_LOCALE;
  const value = lookup(dictionaries[locale], key);
  if (typeof value === 'string') return interpolate(value, values);

  const fallback = lookup(dictionaries[DEFAULT_LOCALE], key);
  if (typeof fallback === 'string') return interpolate(fallback, values);

  return key;
}
