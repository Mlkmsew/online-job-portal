import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Companies = () => {
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
      <h1 className="heading-2 mb-8">Top Companies</h1>
      {loading ? <div className="text-center">Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {companies.map(company => (
            <Link key={company._id} to={`/companies/${company._id}`} className="card card-hover text-center">
              <h3 className="text-lg font-semibold mb-2">{company.name}</h3>
              <p className="text-sm text-gray-600">{company.industry}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Companies;
