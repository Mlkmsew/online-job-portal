import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PopularCategories from '../components/home/PopularCategories';
import LatestJobs from '../components/home/LatestJobs';
// TopCompanies intentionally omitted from homepage
import SuccessStories from '../components/home/SuccessStories';
import Testimonials from '../components/home/Testimonials';
import CareerBlog from '../components/home/CareerBlog';
import FAQ from '../components/home/FAQ';
import Newsletter from '../components/home/Newsletter';
import CTA from '../components/home/CTA';
import Footer from '../components/home/Footer';

const HomePage = () => {
  const { t } = useTranslation();

  return (
    <main className="page-container">
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">{t('common.appName')}</span>
          <h1>{t('home.heroTitle')}</h1>
          <p>{t('home.heroSubtitle')}</p>
          <div className="hero-actions">
            <Link to="/jobs" className="btn btn-primary">{t('home.heroActionExplore')}</Link>
            <Link to="/register" className="btn btn-secondary">{t('home.heroActionCreate')}</Link>
          </div>
        </div>
        <motion.div className="hero-visual" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="hero-card">{t('home.heroCard')}</div>
        </motion.div>
      </section>

    {/* Large search component removed from public homepage */}

    <section className="container-custom">
      <PopularCategories />
      <LatestJobs />
      {/* TopCompanies removed from public homepage */}
      <SuccessStories />
      <Testimonials />
      <CareerBlog />
      <FAQ />
      <Newsletter />
      <CTA />
    </section>

    <Footer />
  </main>
);
};
export default HomePage;
