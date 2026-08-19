import { useState, useEffect } from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';

// Simple captions/transcript floating panel
const Captions = () => {
  const { settings } = useAccessibility();
  const [visible, setVisible] = useState(false);
  const [lines, setLines] = useState([]);

  // Placeholder: subscribe to window events for captions/transcripts
  useEffect(() => {
    const handler = (e) => {
      if (e?.detail?.transcript) {
        setLines((s) => [...s.slice(-4), e.detail.transcript]);
        setVisible(true);
        setTimeout(() => setVisible(false), 8000);
      }
    };
    window.addEventListener('ethiojob:transcript', handler);
    return () => window.removeEventListener('ethiojob:transcript', handler);
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-live="polite"
      className={`fixed bottom-24 right-3 sm:right-6 z-60 w-[min(28rem,calc(100vw-1.5rem))] bg-black/85 text-white p-3 rounded-lg shadow-lg text-sm ${
        settings.fontSize === 'xlarge' ? 'text-lg' : ''
      }`}
    >
      {lines.slice().reverse().map((l, idx) => (
        <div key={idx} className="truncate">{l}</div>
      ))}
    </div>
  );
};

export default Captions;
