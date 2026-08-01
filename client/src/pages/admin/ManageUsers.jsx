import { useEffect, useState } from 'react';
import api from '../../services/api';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/admin/users');
        const allUsers = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setUsers(allUsers.filter((user) => user.role !== 'admin'));
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
      <h2 className="text-2xl font-semibold mb-4">Manage Users</h2>
      {loading ? <div>Loading...</div> : (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u._id} className="card p-3 flex justify-between items-center">
              <div>
                <div className="font-semibold">{u.firstName} {u.lastName}</div>
                <div className="text-sm text-gray-500">{u.email} • {u.role}</div>
              </div>
              <div className="space-x-2">
                <button className="btn btn-sm">View</button>
                <button className="btn btn-sm">Suspend</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
