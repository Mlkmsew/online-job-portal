import { useEffect, useState } from 'react';
import api from '../../services/api';

const LatestJobs = () => {
  const [jobs, setJobs] = useState([]);
  useEffect(() => { const f = async () => { try { const res = await api.get('/jobs', { params: { limit: 9 } }); setJobs(Array.isArray(res.data) ? res.data : res.data?.data || []); } catch {} }; f(); }, []);
  return (
    <section className="latest-jobs py-6">
      <h3 className="heading-3 mb-4">Latest Jobs</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {jobs.map(j => (
          <div key={j._id} className="p-4 border rounded">
            <div className="font-semibold">{j.title}</div>
            <div className="text-sm text-gray-500">{j.company?.name}</div>
          </div>
        ))}
      </div>
    </section>
  );
};
export default LatestJobs;
