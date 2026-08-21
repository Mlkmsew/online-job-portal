// ============================================
// Keyboard Shortcuts Guide Overlay
// Shows when user enables Keyboard Navigation Guide
// ============================================
import { motion, AnimatePresence } from 'framer-motion';
import { useAccessibility } from '../../context/AccessibilityContext';
import { FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const KeyboardShortcutsGuide = () => {
  const { t } = useTranslation();
  const { settings, updateSetting } = useAccessibility();

  const shortcuts = [
    { keys: ['Tab'], description: t('accessibility.shortcutMoveNext', { defaultValue: 'Move to next interactive element' }) },
    { keys: ['Shift', 'Tab'], description: t('accessibility.shortcutMovePrevious', { defaultValue: 'Move to previous interactive element' }) },
    { keys: ['Enter'], description: t('accessibility.shortcutActivate', { defaultValue: 'Activate button or link' }) },
    { keys: ['Space'], description: t('accessibility.shortcutToggle', { defaultValue: 'Toggle checkbox / select option' }) },
    { keys: ['Esc'], description: t('accessibility.shortcutClose', { defaultValue: 'Close dialog or dropdown' }) },
    { keys: ['↑', '↓'], description: t('accessibility.shortcutNavigate', { defaultValue: 'Navigate within menus or lists' }) },
    { keys: ['Home'], description: t('accessibility.shortcutFirstItem', { defaultValue: 'Go to first item' }) },
    { keys: ['End'], description: t('accessibility.shortcutLastItem', { defaultValue: 'Go to last item' }) },
    { keys: ['Ctrl', 'K'], description: t('accessibility.shortcutCommandPalette', { defaultValue: 'Open command palette (future)' }) },
    { keys: ['Alt', 'A'], description: t('accessibility.shortcutAccessibilityPanel', { defaultValue: 'Open accessibility panel' }) },
  ];

  return (
    <AnimatePresence>
      {settings.keyboardNavGuide && (
        <motion.div
          role="dialog"
          aria-label={t('accessibility.keyboardShortcutsGuideTitle', { defaultValue: 'Keyboard Shortcuts Guide' })}
          aria-modal="true"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="fixed bottom-6 right-3 sm:right-6 z-[70] w-[min(340px,calc(100vw-1.5rem))] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {t('accessibility.keyboardShortcutsTitle', { defaultValue: '⌨️ Keyboard Shortcuts' })}
            </h3>
            <button
              onClick={() => updateSetting('keyboardNavGuide', false)}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label={t('accessibility.closeKeyboardShortcutsGuide', { defaultValue: 'Close keyboard shortcuts guide' })}
            >
              <FiX />
            </button>
          </div>

          {/* Shortcuts List */}
          <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
            {shortcuts.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {s.description}
                </span>
                <div className="flex gap-1">
                  {s.keys.map((key) => (
                    <kbd
                      key={key}
                      className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded font-mono text-gray-700 dark:text-gray-300"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default KeyboardShortcutsGuide;
