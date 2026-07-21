import { useEffect, useState } from 'react';
import api from '../../services/api';

const ManageCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/admin/companies');
        setCompanies(Array.isArray(res.data) ? res.data : res.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Manage Companies</h2>
      {loading ? <div>Loading...</div> : (
        <div className="space-y-3">
          {companies.map(c => (
            <div key={c._id} className="card p-3 flex justify-between items-center">
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-sm text-gray-500">Owner: {c.owner?.firstName} {c.owner?.lastName}</div>
              </div>
              <div className="space-x-2">
                <button className="btn btn-sm">Approve</button>
                <button className="btn btn-sm">Verify</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageCompanies;
