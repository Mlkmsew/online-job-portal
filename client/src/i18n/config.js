// ============================================
// i18next Configuration - Multilingual Support
// ============================================
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation Resources
import enTranslations from './locales/en.json';
import amTranslations from './locales/am.json';
import omTranslations from './locales/om.json';

const resources = {
  en: { translation: enTranslations },
  am: { translation: amTranslations },
  om: { translation: omTranslations },
};

const savedLang = localStorage.getItem('selectedLanguage') || localStorage.getItem('i18nextLng');
const initialLang = ['en', 'am', 'om'].includes(savedLang) ? savedLang : 'en';

if (savedLang && savedLang !== initialLang) {
  localStorage.setItem('selectedLanguage', initialLang);
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: ['en', 'am', 'om'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    fallbackLng: 'en',
    lng: initialLang,
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'selectedLanguage',
    },
    parseMissingKeyHandler: (key, defaultValue) => {
      if (defaultValue !== undefined) return defaultValue;
      // Safety net: never render a raw translation key in the UI.
      const segments = String(key || '').split('.').filter(Boolean);
      const last = segments[segments.length - 1] || '';
      return last
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (char) => char.toUpperCase())
        .trim();
    },
  });

export default i18n;

