// ============================================
// Accessibility Panel - Floating Settings Hub
// Supports: Visual, Motor, Cognitive, Hearing
// ============================================
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccessibility } from '../../context/AccessibilityContext';
import {
  FiSettings, FiX, FiSun, FiMoon, FiType, FiEye, FiZap,
  FiAlignLeft, FiMaximize2, FiRefreshCw, FiMousePointer,
} from 'react-icons/fi';
import {
  FaUniversalAccess, FaFont, FaAdjust, FaLowVision,
  FaKeyboard, FaBookReader,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const AccessibilityPanel = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  const { settings, updateSetting, resetSettings } = useAccessibility();

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Toggle component
  const Toggle = ({ label, icon: Icon, checked, onChange, description }) => (
    <div className="flex items-center justify-between py-3 px-1 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      <div className="flex items-center gap-3">
        <Icon className="text-primary-500 text-lg flex-shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={`${label}: ${checked ? t('accessibility.on', { defaultValue: 'On' }) : t('accessibility.off', { defaultValue: 'Off' })}`}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
          checked ? 'bg-[#1769E0]' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  // Select component
  const Select = ({ label, icon: Icon, value, onChange, options, description }) => (
    <div className="py-3 px-1 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="text-primary-500 text-lg flex-shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 ml-8">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            aria-pressed={value === opt.value}
            className={`px-3 py-1 text-xs rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              value === opt.value
                ? 'bg-[#1769E0] text-white border-primary-500'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('accessibility.openSettings', { defaultValue: 'Open Accessibility Settings' })}
        aria-expanded={isOpen}
        aria-controls="a11y-panel"
        className="fixed bottom-6 left-6 z-[60] w-14 h-14 bg-[#1769E0] hover:bg-[#0D5BC4] text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all focus:outline-none focus:ring-4 focus:ring-primary-300"
      >
        <FaUniversalAccess className="text-2xl" />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="a11y-panel"
            ref={panelRef}
            role="dialog"
            aria-label={t('accessibility.settingsTitle', { defaultValue: 'Accessibility Settings' })}
            aria-modal="true"
            initial={{ opacity: 0, x: -100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-24 left-3 sm:left-6 z-[60] w-[min(360px,calc(100vw-1.5rem))] max-h-[80vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <div className="flex items-center gap-2">
                <FaUniversalAccess className="text-xl" />
                <h2 className="text-lg font-bold">{t('accessibility.title', { defaultValue: 'Accessibility' })}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetSettings}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label={t('accessibility.resetSettings', { defaultValue: 'Reset all accessibility settings' })}
                  title={t('accessibility.resetToDefaults', { defaultValue: 'Reset to defaults' })}
                >
                  <FiRefreshCw className="text-lg" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label={t('accessibility.closePanel', { defaultValue: 'Close accessibility panel' })}
                >
                  <FiX className="text-lg" />
                </button>
              </div>
            </div>

            {/* Body - Scrollable */}
            <div className="overflow-y-auto flex-1 p-4 space-y-1">

              {/* ── Vision Section ── */}
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-1">
                {t('accessibility.vision', { defaultValue: '👁️ Vision' })}
              </p>

              <Select
                label={t('accessibility.fontSize', { defaultValue: 'Font Size' })}
                icon={FiType}
                value={settings.fontSize}
                onChange={(val) => updateSetting('fontSize', val)}
                description={t('accessibility.fontSizeDesc', { defaultValue: 'Adjust text size across the entire site' })}
                options={[
                  { value: 'small', label: t('accessibility.sizeSmall', { defaultValue: 'Small' }) },
                  { value: 'medium', label: t('accessibility.sizeMedium', { defaultValue: 'Medium' }) },
                  { value: 'large', label: t('accessibility.sizeLarge', { defaultValue: 'Large' }) },
                  { value: 'xlarge', label: t('accessibility.sizeXLarge', { defaultValue: 'X-Large' }) },
                ]}
              />

              <Select
                label={t('accessibility.fontStyle', { defaultValue: 'Font Style' })}
                icon={FaFont}
                value={settings.fontFamily}
                onChange={(val) => updateSetting('fontFamily', val)}
                description={t('accessibility.fontStyleDesc', { defaultValue: 'Use a dyslexia-friendly font for easier reading' })}
                options={[
                  { value: 'default', label: t('accessibility.fontDefault', { defaultValue: 'Default' }) },
                  { value: 'dyslexia', label: t('accessibility.fontDyslexia', { defaultValue: 'Dyslexia' }) },
                  { value: 'mono', label: t('accessibility.fontMonospace', { defaultValue: 'Monospace' }) },
                ]}
              />

              <Toggle
                label={t('accessibility.highContrast', { defaultValue: 'High Contrast' })}
                icon={FaAdjust}
                checked={settings.highContrast}
                onChange={(val) => updateSetting('highContrast', val)}
                description={t('accessibility.highContrastDesc', { defaultValue: 'Increase color contrast for better visibility' })}
              />

              <Select
                label={t('accessibility.colorBlindMode', { defaultValue: 'Color Blind Mode' })}
                icon={FaLowVision}
                value={settings.colorBlindMode}
                onChange={(val) => updateSetting('colorBlindMode', val)}
                description={t('accessibility.colorBlindDesc', { defaultValue: 'Apply color filters for color vision deficiencies' })}
                options={[
                  { value: 'none', label: t('accessibility.colorNone', { defaultValue: 'None' }) },
                  { value: 'protanopia', label: t('accessibility.colorProtanopia', { defaultValue: 'Red-blind' }) },
                  { value: 'deuteranopia', label: t('accessibility.colorDeuteranopia', { defaultValue: 'Green-blind' }) },
                  { value: 'tritanopia', label: t('accessibility.colorTritanopia', { defaultValue: 'Blue-blind' }) },
                ]}
              />

              <Toggle
                label={t('accessibility.readingGuide', { defaultValue: 'Reading Guide' })}
                icon={FaBookReader}
                checked={settings.readingGuide}
                onChange={(val) => updateSetting('readingGuide', val)}
                description={t('accessibility.readingGuideDesc', { defaultValue: 'Show a horizontal ruler that follows the cursor' })}
              />

              <Toggle
                label={t('accessibility.focusMode', { defaultValue: 'Focus Mode' })}
                icon={FiEye}
                checked={settings.focusMode}
                onChange={(val) => updateSetting('focusMode', val)}
                description={t('accessibility.focusModeDesc', { defaultValue: 'Dim non-essential content to reduce distraction' })}
              />

              <Select
                label={t('accessibility.lineSpacing', { defaultValue: 'Line Spacing' })}
                icon={FiAlignLeft}
                value={settings.lineSpacing}
                onChange={(val) => updateSetting('lineSpacing', val)}
                options={[
                  { value: 'normal', label: t('accessibility.spacingNormal', { defaultValue: 'Normal' }) },
                  { value: 'wide', label: t('accessibility.spacingWide', { defaultValue: 'Wide' }) },
                  { value: 'wider', label: t('accessibility.spacingWider', { defaultValue: 'Wider' }) },
                ]}
              />

              <Select
                label={t('accessibility.letterSpacing', { defaultValue: 'Letter Spacing' })}
                icon={FiMaximize2}
                value={settings.letterSpacing}
                onChange={(val) => updateSetting('letterSpacing', val)}
                options={[
                  { value: 'normal', label: t('accessibility.spacingNormal', { defaultValue: 'Normal' }) },
                  { value: 'wide', label: t('accessibility.spacingWide', { defaultValue: 'Wide' }) },
                  { value: 'wider', label: t('accessibility.spacingWider', { defaultValue: 'Wider' }) },
                ]}
              />

              <Select
                label={t('accessibility.cursorSize', { defaultValue: 'Cursor Size' })}
                icon={FiMousePointer}
                value={settings.cursorSize}
                onChange={(val) => updateSetting('cursorSize', val)}
                description={t('accessibility.cursorSizeDesc', { defaultValue: 'Enlarge the mouse cursor for better visibility' })}
                options={[
                  { value: 'default', label: t('accessibility.cursorDefault', { defaultValue: 'Default' }) },
                  { value: 'large', label: t('accessibility.cursorLarge', { defaultValue: 'Large' }) },
                  { value: 'xlarge', label: t('accessibility.cursorXLarge', { defaultValue: 'X-Large' }) },
                ]}
              />

              {/* ── Motor Section ── */}
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4">
                {t('accessibility.motorSection', { defaultValue: '✋ Motor & Interaction' })}
              </p>

              <Toggle
                label={t('accessibility.reduceMotion', { defaultValue: 'Reduce Motion' })}
                icon={FiZap}
                checked={settings.reducedMotion}
                onChange={(val) => updateSetting('reducedMotion', val)}
                description={t('accessibility.reduceMotionDesc', { defaultValue: 'Disable animations and transitions' })}
              />

              <Toggle
                label={t('accessibility.keyboardShortcuts', { defaultValue: 'Keyboard Shortcuts' })}
                icon={FaKeyboard}
                checked={settings.keyboardNavGuide}
                onChange={(val) => updateSetting('keyboardNavGuide', val)}
                description={t('accessibility.keyboardShortcutsDesc', { defaultValue: 'Show keyboard navigation guide overlay' })}
              />

              {/* ── Cognitive Section ── */}
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4">
                {t('accessibility.cognitiveSection', { defaultValue: '🧠 Cognitive & Screen Reader' })}
              </p>

              <Toggle
                label={t('accessibility.screenReaderMode', { defaultValue: 'Screen Reader Mode' })}
                icon={FiSettings}
                checked={settings.screenReaderMode}
                onChange={(val) => updateSetting('screenReaderMode', val)}
                description={t('accessibility.screenReaderDesc', { defaultValue: 'Enhanced announcements for assistive technology' })}
              />
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-400">{t('accessibility.wcagCompliant', { defaultValue: 'WCAG 2.2 AA Compliant' })}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AccessibilityPanel;
