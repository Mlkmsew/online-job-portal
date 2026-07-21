import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminCompanies, approveCompany, verifyCompany } from '../../../store/slices/adminSlice';
import toast from 'react-hot-toast';

const ManageCompanies = () => {
  const dispatch = useDispatch();
  const { companies, loading } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAdminCompanies());
  }, [dispatch]);

  const handleApprove = async (companyId) => {
    try {
      await dispatch(approveCompany(companyId)).unwrap();
      toast.success('Company approval status updated');
    } catch (error) {
      toast.error(error?.message || (typeof error === 'string' ? error : 'Unable to update approval status'));
    }
  };

  const handleVerify = async (companyId) => {
    try {
      await dispatch(verifyCompany(companyId)).unwrap();
      toast.success('Company verification status updated');
    } catch (error) {
      toast.error(error?.message || (typeof error === 'string' ? error : 'Unable to update verification status'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-3xl font-bold">Manage Companies</h1>
        <p className="text-gray-600 mt-2">Approve new company profiles and update business listings.</p>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading companies...</p>}

      <div className="grid gap-4">
        {companies.length > 0 ? (
          companies.map((company) => (
            <div key={company._id} className="card flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{company.name}</h2>
                  <p className="text-gray-500">{company.industry || 'Industry not specified'}</p>
                  <p className="text-sm text-gray-600">Owner: {company.owner?.firstName} {company.owner?.lastName}</p>
                </div>
                <div className="space-x-2">
                  <span className="badge badge-outline">{company.isApproved ? 'Approved' : 'Pending'}</span>
                  <span className="badge badge-outline">{company.isVerified ? 'Verified' : 'Unverified'}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleApprove(company._id)} className="btn btn-sm btn-primary">
                  {company.isApproved ? 'Unapprove' : 'Approve'}
                </button>
                <button onClick={() => handleVerify(company._id)} className="btn btn-sm btn-secondary">
                  {company.isVerified ? 'Unverify' : 'Verify'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="card">
            <p className="text-gray-600">No companies found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCompanies;
