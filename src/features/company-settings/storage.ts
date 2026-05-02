import { CompanySettingsResponse } from './types';

const COMPANY_SETTINGS_STORAGE_KEY = 'company_settings';

function readStoredSettings(): CompanySettingsResponse | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(COMPANY_SETTINGS_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CompanySettingsResponse;
  } catch {
    return null;
  }
}

export function persistCompanySettings(settings: CompanySettingsResponse): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COMPANY_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function clearStoredCompanySettings(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(COMPANY_SETTINGS_STORAGE_KEY);
}

export function getStoredCompanySettings(): CompanySettingsResponse | null {
  return readStoredSettings();
}

export function getStoredCompanyTimezone(fallback = 'UTC'): string {
  return readStoredSettings()?.timezone || fallback;
}

export function getStoredCompanyCurrency(fallback = 'EUR'): string {
  return readStoredSettings()?.currency || fallback;
}

export function getStoredCompanyLocale(fallback = 'en-US'): string {
  return readStoredSettings()?.locale || fallback;
}

export function getStoredCompanyDateFormat(fallback = 'YYYY-MM-DD'): string {
  return readStoredSettings()?.dateFormat || fallback;
}

export function getCurrencySymbol(currency: string, locale = 'en-US'): string {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);
    return parts.find((part) => part.type === 'currency')?.value || currency;
  } catch {
    return currency;
  }
}

export function formatCurrencyAmount(
  amount: number,
  currency: string,
  locale = 'en-US',
  minimumFractionDigits = 2,
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits: minimumFractionDigits,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(minimumFractionDigits)}`;
  }
}
