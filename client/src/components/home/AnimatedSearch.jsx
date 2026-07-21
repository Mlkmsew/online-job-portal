import { useState } from 'react';
import api from '../../services/api';

const AnimatedSearch = () => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await api.get('/jobs', { params: { search: q, limit: 6 } });
      setResults(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="search-hero card p-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search jobs, skills or companies" className="input flex-1" />
        <button className="btn btn-primary">Search</button>
      </form>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
        {results.map(r => (
          <div key={r._id} className="p-2 border rounded">
            <div className="font-semibold">{r.title}</div>
            <div className="text-sm text-gray-500">{r.company?.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnimatedSearch;
