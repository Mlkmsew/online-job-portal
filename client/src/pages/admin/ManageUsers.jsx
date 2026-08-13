import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const ManageUsers = () => {
  const { t } = useTranslation();
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
      <h2 className="text-2xl font-semibold mb-4">{t('admin.manageUsers.title') || 'Manage Users'}</h2>
      {loading ? <div>{t('common.loading')}</div> : (
        <div className="space-y-3">
          {users.map(u => {
            const companyId = u.company?._id || u.companyId;
            const to = u.role === 'employer' && companyId ? `/companies/${companyId}` : `/admin/users/${u._id}`;
            return (
              <Link key={u._id} to={to} className="card p-3 flex justify-between items-center hover:shadow-md transition">
                <div>
                  <div className="font-semibold">{u.firstName} {u.lastName}</div>
                  <div className="text-sm text-gray-500">{u.email} • {u.role}</div>
                </div>
                <div className="space-x-2">
                  <button className="btn btn-sm">{t('admin.manageUsers.view') || 'View'}</button>
                  <button className="btn btn-sm">{t('admin.manageUsers.suspend') || 'Suspend'}</button>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
