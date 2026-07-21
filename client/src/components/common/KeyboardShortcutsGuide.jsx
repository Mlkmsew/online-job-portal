// ============================================
// Keyboard Shortcuts Guide Overlay
// Shows when user enables Keyboard Navigation Guide
// ============================================
import { motion, AnimatePresence } from 'framer-motion';
import { useAccessibility } from '../../context/AccessibilityContext';
import { FiX } from 'react-icons/fi';

const shortcuts = [
  { keys: ['Tab'], description: 'Move to next interactive element' },
  { keys: ['Shift', 'Tab'], description: 'Move to previous interactive element' },
  { keys: ['Enter'], description: 'Activate button or link' },
  { keys: ['Space'], description: 'Toggle checkbox / select option' },
  { keys: ['Esc'], description: 'Close dialog or dropdown' },
  { keys: ['↑', '↓'], description: 'Navigate within menus or lists' },
  { keys: ['Home'], description: 'Go to first item' },
  { keys: ['End'], description: 'Go to last item' },
  { keys: ['Ctrl', 'K'], description: 'Open command palette (future)' },
  { keys: ['Alt', 'A'], description: 'Open accessibility panel' },
];

const KeyboardShortcutsGuide = () => {
  const { settings, updateSetting } = useAccessibility();

  return (
    <AnimatePresence>
      {settings.keyboardNavGuide && (
        <motion.div
          role="dialog"
          aria-label="Keyboard Shortcuts Guide"
          aria-modal="true"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="fixed bottom-6 right-6 z-[70] w-[340px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              ⌨️ Keyboard Shortcuts
            </h3>
            <button
              onClick={() => updateSetting('keyboardNavGuide', false)}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Close keyboard shortcuts guide"
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
