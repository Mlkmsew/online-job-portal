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

const AccessibilityPanel = () => {
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
        aria-label={`${label}: ${checked ? 'On' : 'Off'}`}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
          checked ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
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
                ? 'bg-primary-500 text-white border-primary-500'
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
        aria-label="Open Accessibility Settings"
        aria-expanded={isOpen}
        aria-controls="a11y-panel"
        className="fixed bottom-6 left-6 z-[60] w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all focus:outline-none focus:ring-4 focus:ring-primary-300"
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
            aria-label="Accessibility Settings"
            aria-modal="true"
            initial={{ opacity: 0, x: -100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-24 left-6 z-[60] w-[360px] max-h-[80vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <div className="flex items-center gap-2">
                <FaUniversalAccess className="text-xl" />
                <h2 className="text-lg font-bold">Accessibility</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetSettings}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Reset all accessibility settings"
                  title="Reset to defaults"
                >
                  <FiRefreshCw className="text-lg" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Close accessibility panel"
                >
                  <FiX className="text-lg" />
                </button>
              </div>
            </div>

            {/* Body - Scrollable */}
            <div className="overflow-y-auto flex-1 p-4 space-y-1">

              {/* ── Vision Section ── */}
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-1">
                👁️ Vision
              </p>

              <Select
                label="Font Size"
                icon={FiType}
                value={settings.fontSize}
                onChange={(val) => updateSetting('fontSize', val)}
                description="Adjust text size across the entire site"
                options={[
                  { value: 'small', label: 'Small' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'large', label: 'Large' },
                  { value: 'xlarge', label: 'X-Large' },
                ]}
              />

              <Select
                label="Font Style"
                icon={FaFont}
                value={settings.fontFamily}
                onChange={(val) => updateSetting('fontFamily', val)}
                description="Use a dyslexia-friendly font for easier reading"
                options={[
                  { value: 'default', label: 'Default' },
                  { value: 'dyslexia', label: 'Dyslexia' },
                  { value: 'mono', label: 'Monospace' },
                ]}
              />

              <Toggle
                label="High Contrast"
                icon={FaAdjust}
                checked={settings.highContrast}
                onChange={(val) => updateSetting('highContrast', val)}
                description="Increase color contrast for better visibility"
              />

              <Select
                label="Color Blind Mode"
                icon={FaLowVision}
                value={settings.colorBlindMode}
                onChange={(val) => updateSetting('colorBlindMode', val)}
                description="Apply color filters for color vision deficiencies"
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'protanopia', label: 'Red-blind' },
                  { value: 'deuteranopia', label: 'Green-blind' },
                  { value: 'tritanopia', label: 'Blue-blind' },
                ]}
              />

              <Toggle
                label="Reading Guide"
                icon={FaBookReader}
                checked={settings.readingGuide}
                onChange={(val) => updateSetting('readingGuide', val)}
                description="Show a horizontal ruler that follows the cursor"
              />

              <Toggle
                label="Focus Mode"
                icon={FiEye}
                checked={settings.focusMode}
                onChange={(val) => updateSetting('focusMode', val)}
                description="Dim non-essential content to reduce distraction"
              />

              <Select
                label="Line Spacing"
                icon={FiAlignLeft}
                value={settings.lineSpacing}
                onChange={(val) => updateSetting('lineSpacing', val)}
                options={[
                  { value: 'normal', label: 'Normal' },
                  { value: 'wide', label: 'Wide' },
                  { value: 'wider', label: 'Wider' },
                ]}
              />

              <Select
                label="Letter Spacing"
                icon={FiMaximize2}
                value={settings.letterSpacing}
                onChange={(val) => updateSetting('letterSpacing', val)}
                options={[
                  { value: 'normal', label: 'Normal' },
                  { value: 'wide', label: 'Wide' },
                  { value: 'wider', label: 'Wider' },
                ]}
              />

              <Select
                label="Cursor Size"
                icon={FiMousePointer}
                value={settings.cursorSize}
                onChange={(val) => updateSetting('cursorSize', val)}
                description="Enlarge the mouse cursor for better visibility"
                options={[
                  { value: 'default', label: 'Default' },
                  { value: 'large', label: 'Large' },
                  { value: 'xlarge', label: 'X-Large' },
                ]}
              />

              {/* ── Motor Section ── */}
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4">
                ✋ Motor & Interaction
              </p>

              <Toggle
                label="Reduce Motion"
                icon={FiZap}
                checked={settings.reducedMotion}
                onChange={(val) => updateSetting('reducedMotion', val)}
                description="Disable animations and transitions"
              />

              <Toggle
                label="Keyboard Shortcuts"
                icon={FaKeyboard}
                checked={settings.keyboardNavGuide}
                onChange={(val) => updateSetting('keyboardNavGuide', val)}
                description="Show keyboard navigation guide overlay"
              />

              {/* ── Cognitive Section ── */}
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4">
                🧠 Cognitive & Screen Reader
              </p>

              <Toggle
                label="Screen Reader Mode"
                icon={FiSettings}
                checked={settings.screenReaderMode}
                onChange={(val) => updateSetting('screenReaderMode', val)}
                description="Enhanced announcements for assistive technology"
              />
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-400">WCAG 2.2 AA Compliant</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AccessibilityPanel;
