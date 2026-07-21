import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

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
      <div className="card max-w-4xl mx-auto">
        <h1 className="heading-2 mb-4">{company.name}</h1>
        <p className="text-gray-600 mb-6">{company.description}</p>
        <div className="grid grid-cols-2 gap-4">
          <div><strong>Industry:</strong> {company.industry}</div>
          <div><strong>Size:</strong> {company.companySize}</div>
          <div><strong>Location:</strong> {company.location?.region}</div>
          <div><strong>Website:</strong> <a href={company.website} className="text-primary-500">{company.website}</a></div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;
