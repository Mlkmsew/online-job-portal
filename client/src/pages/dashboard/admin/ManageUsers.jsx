import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminUsers, toggleUserSuspension } from '../../../store/slices/adminSlice';
import toast from 'react-hot-toast';

const ManageUsers = () => {
  const dispatch = useDispatch();
  const { users, loading } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAdminUsers());
  }, [dispatch]);

  const handleToggleSuspension = async (userId) => {
    try {
      await dispatch(toggleUserSuspension(userId)).unwrap();
      toast.success('User status updated successfully');
    } catch (error) {
      toast.error(error?.message || (typeof error === 'string' ? error : 'Unable to update user status'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <p className="text-gray-600 mt-2">Review user accounts and perform admin actions.</p>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading users...</p>}

      <div className="grid gap-4">
        {users.length > 0 ? (
          users.map((user) => (
            <div key={user._id} className="card flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{user.firstName} {user.lastName}</h2>
                <p className="text-gray-500">{user.email}</p>
                <p className="text-sm text-gray-600">Role: {user.role}</p>
              </div>
              <button
                onClick={() => handleToggleSuspension(user._id)}
                className="btn btn-sm btn-outline"
              >
                {user.isSuspended ? 'Activate' : 'Suspend'}
              </button>
            </div>
          ))
        ) : (
          <div className="card">
            <p className="text-gray-600">No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;
