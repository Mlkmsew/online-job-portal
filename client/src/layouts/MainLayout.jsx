// ============================================
// Main Layout - For Public Pages
// Includes: Skip Navigation, Accessibility Panel,
// Reading Guide, Keyboard Shortcuts Guide
// ============================================
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import SkipNavigation from '../components/common/SkipNavigation';
import AccessibilityPanel from '../components/common/AccessibilityPanel';
import ReadingGuide from '../components/common/ReadingGuide';
import KeyboardShortcutsGuide from '../components/common/KeyboardShortcutsGuide';
import Captions from '../components/common/Captions';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip link for keyboard users */}
      <SkipNavigation />

      <Navbar />

      {/* Main content landmark with skip target */}
      <main id="main-content" className="flex-1" role="main" tabIndex={-1}>
        <Outlet />
      </main>

      <Footer />

      {/* Floating accessibility tools */}
      <AccessibilityPanel />
      <Captions />
      <ReadingGuide />
      <KeyboardShortcutsGuide />
    </div>
  );
};

export default MainLayout;
