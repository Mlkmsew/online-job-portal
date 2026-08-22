import '@testing-library/jest-dom';
import i18n from './i18n/config';

// Initialize the real translation resources so components under test render
// the same localized output as production instead of raw i18next keys.
if (!i18n.isInitialized) {
  await new Promise((resolve) => {
    i18n.on('initialized', resolve);
  });
}
