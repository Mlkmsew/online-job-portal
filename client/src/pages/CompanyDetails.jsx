import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const companySizeLabels = {
  '1-10': '10 employees',
  '11-50': '50 employees',
  '51-200': '200 employees',
  '201-500': '500 employees',
  '501-1000': '1000 employees',
  '1001-5000': '5000 employees',
  '5000+': '5000+ employees',
};

const CompanyDetails = () => {
  const { id } = useParams();
  const [company, setCompany] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await api.get(`/companies/${id}`);
        setCompany(data.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetch();
  }, [id]);

  if (!company) return <div className="section container-custom text-center">Loading...</div>;

  return (
    <div className="section container-custom">
      <div className="card max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="heading-2 mb-4">{company.name}</h1>
            <p className="text-gray-600 whitespace-pre-line">
              {company.description || 'No company description has been provided yet.'}
            </p>
          </div>
          <div className="h-24 w-24 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {company.logo ? (
              <img
                src={company.logo}
                alt={`${company.name} logo`}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-gray-500">
                No logo
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <strong>Industry:</strong>
            <p className="mt-1 text-gray-700">{company.industry || 'Not specified'}</p>
          </div>
          <div>
            <strong>Size:</strong>
            <p className="mt-1 text-gray-700">
              {companySizeLabels[company.companySize] || company.companySize || 'Not specified'}
            </p>
          </div>
          <div>
            <strong>Location:</strong>
            <p className="mt-1 text-gray-700">
              {company.location?.city ? `${company.location.city}, ` : ''}
              {company.location?.region || 'Not specified'}
            </p>
          </div>
          <div>
            <strong>Website:</strong>
            <p className="mt-1">
              {company.website ? (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-500 hover:underline"
                >
                  {company.website}
                </a>
              ) : (
                <span className="text-gray-700">Not specified</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;
