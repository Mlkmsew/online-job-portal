// ============================================
// Skip Navigation Component
// Allows keyboard users to skip directly to main content
// ============================================
const SkipNavigation = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-6 focus:py-3 focus:bg-primary-500 focus:text-white focus:rounded-lg focus:shadow-lg focus:text-lg focus:font-semibold focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all"
    >
      Skip to Main Content
    </a>
  );
};

export default SkipNavigation;
