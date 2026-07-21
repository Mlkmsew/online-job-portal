import { useEffect, useState } from 'react';
import api from '../../services/api';

const TopCompanies = () => {
  const [companies, setCompanies] = useState([]);
  useEffect(() => { const f=async()=>{try{const res=await api.get('/companies?isApproved=true'); setCompanies(Array.isArray(res.data) ? res.data : res.data?.data || [])}catch{}};f(); }, []);
  return (
    <section className="top-companies py-6">
      <h3 className="heading-3 mb-4">Top Companies</h3>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {companies.slice(0,6).map(c=> (
          <div key={c._id} className="p-3 border rounded text-center">{c.name}</div>
        ))}
      </div>
    </section>
  );
};
export default TopCompanies;
