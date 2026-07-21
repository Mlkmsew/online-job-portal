// ============================================
// Reading Guide Component
// A horizontal ruler that follows the mouse cursor
// Helps users with dyslexia, low vision, or ADHD
// ============================================
import { useState, useEffect } from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';

const ReadingGuide = () => {
  const { settings } = useAccessibility();
  const [position, setPosition] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!settings.readingGuide) return;

    const handleMouseMove = (e) => {
      setPosition(e.clientY);
      setVisible(true);
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [settings.readingGuide]);

  if (!settings.readingGuide || !visible) return null;

  return (
    <>
      {/* Top overlay — dims content above the ruler */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 z-[9998] pointer-events-none bg-black/10 dark:bg-black/20 transition-all duration-75"
        style={{ height: `${position - 20}px` }}
      />
      {/* The reading ruler line */}
      <div
        aria-hidden="true"
        className="fixed left-0 right-0 z-[9999] pointer-events-none border-t-2 border-b-2 border-primary-500/50 transition-all duration-75"
        style={{
          top: `${position - 20}px`,
          height: '40px',
          background: 'rgba(15, 157, 88, 0.06)',
        }}
      />
      {/* Bottom overlay — dims content below the ruler */}
      <div
        aria-hidden="true"
        className="fixed bottom-0 left-0 right-0 z-[9998] pointer-events-none bg-black/10 dark:bg-black/20 transition-all duration-75"
        style={{ top: `${position + 20}px` }}
      />
    </>
  );
};

export default ReadingGuide;
