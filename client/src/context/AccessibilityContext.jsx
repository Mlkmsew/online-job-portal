// ============================================
// Accessibility Context - Manages All A11y Preferences
// Supports: Visual, Motor, Cognitive, Hearing disabilities
// WCAG 2.2 AA Compliant
// ============================================
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AccessibilityContext = createContext(null);

// Default accessibility settings
const DEFAULT_SETTINGS = {
  fontSize: 'medium',           // 'small' | 'medium' | 'large' | 'xlarge'
  fontFamily: 'default',        // 'default' | 'dyslexia' | 'mono'
  highContrast: false,          // WCAG AAA contrast mode
  reducedMotion: false,         // Disable animations for vestibular disorders
  focusMode: false,             // Dims non-essential content
  readingGuide: false,          // Horizontal reading ruler
  lineSpacing: 'normal',       // 'normal' | 'wide' | 'wider'
  letterSpacing: 'normal',     // 'normal' | 'wide' | 'wider'
  cursorSize: 'default',       // 'default' | 'large' | 'xlarge'
  screenReaderMode: false,     // Enhanced ARIA live regions
  keyboardNavGuide: false,     // Show keyboard shortcut overlay
  colorBlindMode: 'none',     // 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
};

// Font size CSS variable mappings
const FONT_SIZE_MAP = {
  small: '14px',
  medium: '16px',
  large: '18px',
  xlarge: '22px',
};

const LINE_SPACING_MAP = {
  normal: '1.5',
  wide: '1.8',
  wider: '2.2',
};

const LETTER_SPACING_MAP = {
  normal: '0em',
  wide: '0.05em',
  wider: '0.1em',
};

export const AccessibilityProvider = ({ children }) => {
  // Load saved preferences from localStorage
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('a11y-settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Live announcements for screen readers
  const [announcement, setAnnouncement] = useState('');

  // Apply settings to the DOM whenever they change
  useEffect(() => {
    const root = document.documentElement;

    // Font size
    root.style.setProperty('--a11y-font-size', FONT_SIZE_MAP[settings.fontSize]);

    // Line spacing
    root.style.setProperty('--a11y-line-height', LINE_SPACING_MAP[settings.lineSpacing]);

    // Letter spacing
    root.style.setProperty('--a11y-letter-spacing', LETTER_SPACING_MAP[settings.letterSpacing]);

    // Font family
    if (settings.fontFamily === 'dyslexia') {
      root.classList.add('font-dyslexia');
      root.classList.remove('font-mono-a11y');
    } else if (settings.fontFamily === 'mono') {
      root.classList.add('font-mono-a11y');
      root.classList.remove('font-dyslexia');
    } else {
      root.classList.remove('font-dyslexia', 'font-mono-a11y');
    }

    // High contrast
    root.classList.toggle('high-contrast', settings.highContrast);

    // Reduced motion
    root.classList.toggle('reduce-motion', settings.reducedMotion);

    // Focus mode
    root.classList.toggle('focus-mode', settings.focusMode);

    // Cursor size
    root.classList.toggle('cursor-large', settings.cursorSize === 'large');
    root.classList.toggle('cursor-xlarge', settings.cursorSize === 'xlarge');

    // Color blind filters
    root.classList.remove('cb-protanopia', 'cb-deuteranopia', 'cb-tritanopia');
    if (settings.colorBlindMode !== 'none') {
      root.classList.add(`cb-${settings.colorBlindMode}`);
    }

    // Screen reader mode — add enhanced ARIA live region
    root.classList.toggle('sr-enhanced', settings.screenReaderMode);

    // Persist to localStorage
    localStorage.setItem('a11y-settings', JSON.stringify(settings));
  }, [settings]);

  // Detect OS-level preferences on mount
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersHighContrast = window.matchMedia('(prefers-contrast: more)');

    if (prefersReducedMotion.matches && !settings.reducedMotion) {
      updateSetting('reducedMotion', true);
    }
    if (prefersHighContrast.matches && !settings.highContrast) {
      updateSetting('highContrast', true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update a single setting
  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Reset all settings to defaults
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    announce('Accessibility settings reset to defaults.');
  }, []);

  // Screen reader live announcement
  const announce = useCallback((message) => {
    setAnnouncement('');
    // Small timeout so the DOM clears and re-announces
    setTimeout(() => setAnnouncement(message), 100);
  }, []);

  const value = {
    settings,
    updateSetting,
    resetSettings,
    announce,
    announcement,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      {/* Screen Reader Live Region — always present, visually hidden */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </AccessibilityContext.Provider>
  );
};

// Custom hook
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export default AccessibilityContext;
