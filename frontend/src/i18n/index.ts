/**
 * MoH Ambulance Mini App — i18n Configuration
 * -----------------------------------------------------------------------------
 * i18next + react-i18next initialization.
 * Primary language: Khmer (km) — Kantumruy Pro font.
 * Fallback: English (en).
 *
 * Resources are bundled statically (no HTTP backend) for offline WebView use.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import km from './locales/km.json';
import en from './locales/en.json';

export const defaultNS = 'translation';
export const supportedLngs = ['km', 'en'] as const;
export type SupportedLng = (typeof supportedLngs)[number];

export const resources = {
  km: { translation: km },
  en: { translation: en },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: 'km',
  fallbackLng: 'en',
  defaultNS,
  supportedLngs: [...supportedLngs],
  // Khmer does not use plural suffixes the way English does; keep it simple.
  interpolation: {
    escapeValue: false, // React already escapes by default
  },
  // Missing-key handler — logs in dev, silent in prod.
  saveMissing: import.meta.env?.DEV ?? false,
  missingKeyHandler: (_lngs, _ns, key) => {
    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[i18n] missing key: "${key}"`);
    }
  },
  react: {
    useSuspense: false,
  },
});

/**
 * Change the active language at runtime.
 * Also updates the <html lang> attribute for font / a11y selection.
 */
export async function changeLanguage(lng: SupportedLng): Promise<void> {
  await i18n.changeLanguage(lng);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
}

/**
 * Get the current language.
 */
export function getLanguage(): SupportedLng {
  return i18n.language as SupportedLng;
}

export default i18n;
