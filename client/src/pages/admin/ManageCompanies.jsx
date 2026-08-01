import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiBriefcase, FiUsers, FiEdit2, FiMail, FiSearch, FiFilter, FiRefreshCcw, FiPlus } from 'react-icons/fi';
import { format } from 'date-fns';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ManageCompanies = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [verificationFilter, setVerificationFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');

  const fetchCompanies = async (filters = {}) => {
    setLoading(true);
    try {
      const response = await api.get('/admin/companies', { params: filters });
      const companyData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setCompanies(companyData);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const statusLabel = (company) => {
    if (!company.isApproved && company.isActive === false) return 'Rejected';
    return company.isApproved ? 'Approved' : 'Pending';
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const payload = [company.name, company.industry, company.email, company.owner?.firstName, company.owner?.lastName, company.owner?.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (searchText && !payload.includes(searchText.toLowerCase())) return false;
      if (statusFilter !== 'All') {
        if (statusFilter === 'Approved' && !company.isApproved) return false;
        if (statusFilter === 'Pending' && (company.isApproved || company.isActive === false)) return false;
        if (statusFilter === 'Rejected' && !(company.isActive === false && !company.isApproved)) return false;
      }
      if (verificationFilter !== 'All') {
        if (verificationFilter === 'Verified' && !company.isVerified) return false;
        if (verificationFilter === 'Unverified' && company.isVerified) return false;
      }
      if (industryFilter !== 'All' && company.industry !== industryFilter) return false;
      return true;
    });
  }, [companies, searchText, statusFilter, verificationFilter, industryFilter]);

  const industryOptions = useMemo(() => {
    return Array.from(new Set(companies.map((company) => company.industry).filter(Boolean))).sort();
  }, [companies]);

  const summary = useMemo(() => {
    const approved = companies.filter((company) => company.isApproved).length;
    const verified = companies.filter((company) => company.isVerified).length;
    const pending = companies.filter((company) => !company.isApproved && company.isActive !== false).length;
    const rejected = companies.filter((company) => !company.isApproved && company.isActive === false).length;
    return { total: companies.length, approved, verified, pending, rejected };
  }, [companies]);

  const toggleCompanyApproval = async (companyId) => {
    try {
      await api.put(`/admin/companies/${companyId}/approve`);
      toast.success('Company approval status updated');
      fetchCompanies();
    } catch (err) {
      console.error(err);
      toast.error('Unable to update company approval');
    }
  };

  const toggleCompanyVerification = async (companyId) => {
    try {
      await api.put(`/admin/companies/${companyId}/verify`);
      toast.success('Company verification status updated');
      fetchCompanies();
    } catch (err) {
      console.error(err);
      toast.error('Unable to update company verification');
    }
  };

  const handleApplyFilters = () => {
    const params = {};
    if (searchText.trim()) params.search = searchText.trim();
    if (statusFilter !== 'All') params.status = statusFilter;
    if (verificationFilter !== 'All') params.isVerified = verificationFilter === 'Verified' ? 'true' : 'false';
    if (industryFilter !== 'All') params.industry = industryFilter;
    fetchCompanies(params);
  };

  const handleResetFilters = () => {
    setSearchText('');
    setStatusFilter('All');
    setVerificationFilter('All');
    setIndustryFilter('All');
    fetchCompanies();
  };

  const handleAddCompany = () => navigate('/admin/companies/new');
  const handleManageJobs = (company) => navigate(`/admin/companies/${company._id}/jobs`);
  const handleViewApplicants = (company) => navigate(`/admin/companies/${company._id}/applicants`);
  const handleEditCompany = (company) => navigate(`/admin/companies/${company._id}/edit`);
  const handleMessageCompany = (company) => {
    if (company.email) window.location.href = `mailto:${company.email}`;
    else toast('No company email available');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="card p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Companies</h1>
          <p className="text-gray-600 mt-2">Approve new company profiles and update business listings.</p>
        </div>
        <button type="button" className="btn btn-primary inline-flex items-center gap-2 px-4 py-3" onClick={handleAddCompany}>
          <FiPlus /> Add New Company
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="card p-5 border border-gray-200 bg-white shadow-sm">
          <p className="text-sm text-gray-500">Total Companies</p>
          <p className="mt-3 text-3xl font-semibold">{summary.total}</p>
        </div>
        <div className="card p-5 border border-gray-200 bg-white shadow-sm">
          <p className="text-sm text-gray-500">Verified Companies</p>
          <p className="mt-3 text-3xl font-semibold">{summary.verified}</p>
        </div>
        <div className="card p-5 border border-gray-200 bg-white shadow-sm">
          <p className="text-sm text-gray-500">Pending Companies</p>
          <p className="mt-3 text-3xl font-semibold">{summary.pending}</p>
        </div>
        <div className="card p-5 border border-gray-200 bg-white shadow-sm">
          <p className="text-sm text-gray-500">Rejected Companies</p>
          <p className="mt-3 text-3xl font-semibold">{summary.rejected}</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto_auto] items-end">
          <label className="block">
            <span className="sr-only">Search</span>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search company name, owner, email..."
                className="input pl-10"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm text-gray-500">Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input mt-2">
              <option>All</option>
              <option>Approved</option>
              <option>Pending</option>
              <option>Rejected</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-gray-500">Verification</span>
            <select value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value)} className="input mt-2">
              <option>All</option>
              <option>Verified</option>
              <option>Unverified</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-gray-500">Industries</span>
            <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} className="input mt-2">
              <option>All</option>
              {industryOptions.map((industry) => (
                <option key={industry}>{industry}</option>
              ))}
            </select>
          </label>

          <button type="button" className="btn btn-primary inline-flex items-center justify-center gap-2 px-4 py-3" onClick={handleApplyFilters}>
            <FiFilter /> Filter
          </button>
          <button type="button" className="btn btn-outline inline-flex items-center justify-center gap-2 px-4 py-3" onClick={handleResetFilters}>
            <FiRefreshCcw /> Reset
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Company</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Industry</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Owner / Contact</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Verification</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Jobs</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Applicants</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Joined Date</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan="9" className="px-4 py-8 text-center text-gray-500">Loading companies...</td>
              </tr>
            ) : filteredCompanies.length > 0 ? (
              filteredCompanies.map((company) => {
                const ownerName = [company.owner?.firstName, company.owner?.lastName].filter(Boolean).join(' ') || 'No owner assigned';
                const ownerContact = company.owner?.email || company.phone || 'No contact available';
                const totalJobs = company.totalJobs ?? company.jobs?.length ?? 0;
                const applicantsCount = company.jobs?.reduce((sum, job) => sum + (job.applicantsCount || 0), 0) || 0;

                return (
                  <tr key={company._id}>
                    <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                      <div className="space-y-1">
                        <div>{company.name}</div>
                        <div className="text-xs text-gray-500">{company.email || company.website || 'No email provided'}</div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">{company.industry || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                      <div>{ownerName}</div>
                      <div className="text-xs text-gray-500">{ownerContact}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusLabel(company) === 'Approved' ? 'bg-emerald-100 text-emerald-700' : statusLabel(company) === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {statusLabel(company)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${company.isVerified ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-700'}`}>
                        {company.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-gray-700">{totalJobs}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-gray-700">{applicantsCount}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">{company.createdAt ? format(new Date(company.createdAt), 'MMM dd, yyyy') : '—'}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                      <div className="flex items-center justify-center gap-2">
                        <Link to={`/companies/${company._id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-600" aria-label="View details">
                          <FiEye />
                        </Link>
                        <button type="button" onClick={() => handleManageJobs(company)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-600" aria-label="Manage jobs">
                          <FiBriefcase />
                        </button>
                        <button type="button" onClick={() => handleViewApplicants(company)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-600" aria-label="View applicants">
                          <FiUsers />
                        </button>
                        <button type="button" onClick={() => handleEditCompany(company)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-600" aria-label="Edit company">
                          <FiEdit2 />
                        </button>
                        <button type="button" onClick={() => handleMessageCompany(company)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-600" aria-label="Message company">
                          <FiMail />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="px-4 py-8 text-center text-gray-500">No companies match the selected filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageCompanies;
