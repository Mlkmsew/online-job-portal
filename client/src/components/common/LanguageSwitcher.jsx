// ============================================
// Language Switcher Component - Multi-language Support
// ============================================
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaGlobe, FaCheck } from 'react-icons/fa';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'am', name: 'አማርኛ', flag: '🇪🇹' },
  { code: 'or', name: 'Afaan Oromo', flag: '🇪🇹' },
];

const normalizeLanguageCode = (code) => {
  if (!code) return 'en';
  if (code.startsWith('am')) return 'am';
  if (code.startsWith('or')) return 'or';
  return 'en';
};

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const normalizedLanguage = normalizeLanguageCode(i18n.language);
  const currentLanguage = languages.find(lang => lang.code === normalizedLanguage) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (code) => {
    const normalized = normalizeLanguageCode(code);
    i18n.changeLanguage(normalized);
    setIsOpen(false);
  };

  useEffect(() => {
    const normalized = normalizeLanguageCode(i18n.language);
    if (normalized !== i18n.language) {
      i18n.changeLanguage(normalized);
    }
  }, [i18n]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Select Language"
      >
        <FaGlobe className="text-gray-600 dark:text-gray-300" />
        <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-200">
          {currentLanguage.flag} {currentLanguage.name}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full px-4 py-2 text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                lang.code === normalizedLanguage ? 'bg-teal-50 dark:bg-teal-900/20' : ''
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">{lang.flag}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {lang.name}
                </span>
              </span>
              {lang.code === normalizedLanguage && (
                <FaCheck className="text-teal-600 dark:text-teal-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
