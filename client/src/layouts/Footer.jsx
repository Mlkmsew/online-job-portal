// ============================================
// Footer Component
// ============================================
import { Link } from 'react-router-dom';
import { FiBriefcase, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <FiBriefcase className="w-8 h-8 text-primary-500" />
              <span className="text-2xl font-bold text-white">EthioJob</span>
            </div>
            <p className="text-sm">
              Connecting Ethiopian Youth with Employment Opportunities
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/jobs" className="hover:text-primary-500 transition">Browse Jobs</Link></li>
              <li><Link to="/companies" className="hover:text-primary-500 transition">Companies</Link></li>
              <li><Link to="/about" className="hover:text-primary-500 transition">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary-500 transition">Contact</Link></li>
            </ul>
          </div>

          {/* For Job Seekers */}
          <div>
            <h3 className="text-white font-semibold mb-4">For Job Seekers</h3>
            <ul className="space-y-2">
              <li><Link to="/register" className="hover:text-primary-500 transition">Create Account</Link></li>
              <li><Link to="/jobs" className="hover:text-primary-500 transition">Search Jobs</Link></li>
              <li><Link to="/faq" className="hover:text-primary-500 transition">FAQ</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <FiMail className="text-primary-500" />
                <span className="text-sm">info@ethiojob.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <FiPhone className="text-primary-500" />
                <span className="text-sm">+251 11 555 1234</span>
              </li>
              <li className="flex items-center space-x-2">
                <FiMapPin className="text-primary-500" />
                <span className="text-sm">Addis Ababa, Ethiopia</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} EthioJob Portal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
