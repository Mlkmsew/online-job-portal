import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiUsers, FiBriefcase, FiHome, FiCheckCircle } from 'react-icons/fi';
import { fetchAdminStats } from '../../../store/slices/adminSlice';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { stats, loading } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAdminStats());
  }, [dispatch]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Users</p>
              <p className="text-3xl font-bold">{stats?.overview?.totalUsers ?? 0}</p>
            </div>
            <FiUsers className="w-12 h-12 text-primary-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Companies</p>
              <p className="text-3xl font-bold">{stats?.overview?.totalCompanies ?? 0}</p>
            </div>
            <FiHome className="w-12 h-12 text-secondary-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Jobs</p>
              <p className="text-3xl font-bold">{stats?.overview?.totalJobs ?? 0}</p>
            </div>
            <FiBriefcase className="w-12 h-12 text-accent" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Applications</p>
              <p className="text-3xl font-bold">{stats?.overview?.totalApplications ?? 0}</p>
            </div>
            <FiCheckCircle className="w-12 h-12 text-success" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Pending Companies</h2>
          <p className="text-gray-600">{stats?.overview?.pendingCompanies ?? 0} companies awaiting approval.</p>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Growth Snapshot</h2>
          <p className="text-gray-600">Users and jobs growth are tracked monthly for admin review.</p>
        </div>
      </div>
      {loading && <p className="text-sm text-gray-500 mt-4">Loading admin stats...</p>}
    </div>
  );
};

export default AdminDashboard;
