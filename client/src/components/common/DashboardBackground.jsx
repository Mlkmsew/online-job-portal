import { useEffect, useRef, useState } from 'react';

/**
 * DashboardBackground Component
 * Renders ONE unified global background color system across all dashboards (Admin, Employer, Job Seeker).
 * Light mode: #F7F9FC soft blue-ivory base.
 * Dark mode: #0B1220 deep navy base.
 */
const DashboardBackground = ({ variant = 'jobseeker' }) => {
  const mouseRef = useRef({ x: 50, y: 50 });
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e) => setReducedMotion(e.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMotionChange);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMotionChange);
      }
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    let animationFrameId;
    let ticking = false;

    const handleMouseMove = (e) => {
      const xPercent = Math.round((e.clientX / window.innerWidth) * 100);
      const yPercent = Math.round((e.clientY / window.innerHeight) * 100);
      mouseRef.current = { x: xPercent, y: yPercent };

      if (!ticking) {
        animationFrameId = requestAnimationFrame(() => {
          setMousePos(mouseRef.current);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [reducedMotion]);

  // Admin: clean, premium neutral gradient background for admin UI.
  if (variant === 'admin') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-colors duration-300 dark:bg-[#0B1220]">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #EEF2F8 0%, #E2E9F5 100%)' }}
        />
        <div
          className="absolute inset-0 hidden dark:block"
          style={{ background: 'linear-gradient(135deg, #0B1220 0%, #080E1A 100%)' }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#F7F9FC] dark:bg-[#0B1220] transition-colors duration-300">
      {/* 1. Global Base Ambient Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F7F9FC] via-[#EEF3FA] to-[#E4ECF7] dark:from-[#0B1220] dark:via-[#101A2E] dark:to-[#080E1A]" />

      {/* 2. Soft Ambient Blurred Orbs */}
      <div className="absolute inset-0 overflow-hidden opacity-60 dark:opacity-40">
        <div
          className={`absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full blur-[110px] bg-[#1769E0]/10 dark:bg-[#3B82F6]/15 ${
            reducedMotion ? '' : 'animate-pulse'
          }`}
        />
        <div
          className={`absolute top-1/3 -right-32 h-[600px] w-[600px] rounded-full blur-[130px] bg-[#3B82F6]/08 dark:bg-[#4D8DF0]/12 ${
            reducedMotion ? '' : 'animate-pulse'
          }`}
          style={{ animationDuration: '9s' }}
        />
      </div>

      {/* 3. Low Opacity (0.03) Subtle Skyline Watermark Overlay */}
      <div
        className="absolute top-0 left-0 right-0 h-[220px] bg-contain bg-top bg-repeat-x opacity-[0.03] dark:opacity-[0.05] mix-blend-multiply dark:mix-blend-screen"
        style={{ backgroundImage: "url('/images/addis-skyline.svg')" }}
      />

      {/* 4. Throttled Mouse Following Light Glow */}
      {!reducedMotion && (
        <div
          className="absolute inset-0 transition-opacity duration-700 ease-out"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}% ${mousePos.y}%, rgba(23, 105, 224, 0.05), transparent 80%)`,
          }}
        />
      )}
    </div>
  );
};

export default DashboardBackground;
