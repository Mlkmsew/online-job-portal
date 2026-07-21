import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AnimatedSearch from '../components/home/AnimatedSearch';
import PopularCategories from '../components/home/PopularCategories';
import FeaturedJobs from '../components/home/FeaturedJobs';
import LatestJobs from '../components/home/LatestJobs';
import TopCompanies from '../components/home/TopCompanies';
import SuccessStories from '../components/home/SuccessStories';
import Statistics from '../components/home/Statistics';
import Testimonials from '../components/home/Testimonials';
import CareerBlog from '../components/home/CareerBlog';
import FAQ from '../components/home/FAQ';
import Newsletter from '../components/home/Newsletter';
import CTA from '../components/home/CTA';
import Footer from '../components/home/Footer';

const HomePage = () => (
  <main className="page-container">
    <section className="hero-section">
      <div className="hero-copy">
        <span className="eyebrow">EthioJob Portal</span>
        <h1>Connecting Ethiopian Youth with Employment Opportunities.</h1>
        <p>Search jobs, build your profile, and apply to tech, healthcare, finance, and government roles across Ethiopia.</p>
        <div className="hero-actions">
          <Link to="/jobs" className="btn btn-primary">Explore Jobs</Link>
          <Link to="/register" className="btn btn-secondary">Create Account</Link>
        </div>
      </div>
      <motion.div className="hero-visual" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <div className="hero-card">Modern job portal for Ethiopian youth</div>
      </motion.div>
    </section>

    <section className="container-custom -mt-12">
      <AnimatedSearch />
    </section>

    <section className="container-custom">
      <PopularCategories />
      <FeaturedJobs />
      <LatestJobs />
      <TopCompanies />
      <SuccessStories />
      <Statistics />
      <Testimonials />
      <CareerBlog />
      <FAQ />
      <Newsletter />
      <CTA />
    </section>

    <Footer />
  </main>
);

export default HomePage;
