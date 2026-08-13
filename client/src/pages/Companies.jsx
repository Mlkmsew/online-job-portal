import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import TrustedCompanyCard from '../components/home/TrustedCompanyCard';

const Companies = () => {
  const { t } = useTranslation();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await api.get('/companies');
        setCompanies(Array.isArray(res.data) ? res.data : res.data?.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  return (
    <div className="section container-custom">
      <h1 className="heading-2 mb-8">{t('home.featuredCompanies')}</h1>
      {loading ? <div className="text-center">{t('common.loading')}</div> : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {companies.map(company => (
            <TrustedCompanyCard key={company._id} company={company} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Companies;
