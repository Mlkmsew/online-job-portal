import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiBriefcase, FiUsers, FiEdit2, FiMail, FiSearch, FiFilter, FiRefreshCcw, FiPlus, FiX, FiCheckCircle, FiMapPin, FiGlobe, FiPhone, FiShield, FiUser, FiFileText, FiFacebook, FiLinkedin, FiInstagram, FiSend } from 'react-icons/fi';
import { format } from 'date-fns';
import { fetchAdminCompanies, approveCompany, rejectCompany, verifyCompany } from '../../../store/slices/adminSlice';
import toast from 'react-hot-toast';

const ManageCompanies = () => {
  const dispatch = useDispatch();
  const { companies, loading } = useSelector((state) => state.admin);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [verificationFilter, setVerificationFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [documentPreview, setDocumentPreview] = useState({ open: false, title: '', url: '' });

  useEffect(() => {
    dispatch(fetchAdminCompanies());
  }, [dispatch]);

  const statusLabel = (company) => {
    if (!company.isApproved && company.isActive === false) return 'Rejected';
    return company.isApproved ? 'Approved' : 'Pending';
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const searchPayload = [company.name, company.industry, company.email, company.owner?.firstName, company.owner?.lastName, company.owner?.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (searchText && !searchPayload.includes(searchText.toLowerCase())) return false;

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
    const industries = Array.from(new Set(companies.map((company) => company.industry).filter(Boolean)));
    return industries.sort();
  }, [companies]);

  const summary = useMemo(() => {
    const approved = companies.filter((company) => company.isApproved).length;
    const verified = companies.filter((company) => company.isVerified).length;
    const pending = companies.filter((company) => !company.isApproved && company.isActive !== false).length;
    const rejected = companies.filter((company) => !company.isApproved && company.isActive === false).length;

    return {
      total: companies.length,
      approved,
      verified,
      pending,
      rejected,
    };
  }, [companies]);

  const handleApprove = async (companyId) => {
    try {
      await dispatch(approveCompany(companyId)).unwrap();
      toast.success('Company approved successfully');
      if (selectedCompany?._id === companyId) {
        setSelectedCompany((current) => current ? { ...current, isApproved: true, isActive: true } : current);
      }
    } catch (error) {
      toast.error(error?.message || (typeof error === 'string' ? error : 'Unable to approve company'));
    }
  };

  const handleReject = async (companyId, reason) => {
    const trimmedReason = reason?.trim();

    if (!trimmedReason) {
      toast.error('Please enter a rejection reason before rejecting this company.');
      return;
    }

    try {
      await dispatch(rejectCompany({ companyId, reason: trimmedReason })).unwrap();
      toast.success('Company rejected successfully');
      if (selectedCompany?._id === companyId) {
        setSelectedCompany((current) => current ? { ...current, isApproved: false, isActive: false, rejectionReason: trimmedReason } : current);
        setIsReviewOpen(false);
        setRejectionReason('');
      }
    } catch (error) {
      toast.error(error?.message || (typeof error === 'string' ? error : 'Unable to reject company'));
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

  const handleOpenReview = (company) => {
    setSelectedCompany(company);
    setRejectionReason(company.rejectionReason || '');
    setIsReviewOpen(true);
  };

  const openDocumentPreview = (title, url) => {
    if (!url) return;
    setDocumentPreview({ open: true, title, url });
  };

  const closeDocumentPreview = () => {
    setDocumentPreview({ open: false, title: '', url: '' });
  };

  const handleManageJobs = (company) => {
    navigate(`/companies/${company._id}?view=jobs`);
  };

  const handleViewApplicants = (company) => {
    navigate(`/companies/${company._id}?view=applicants`);
  };

  const handleEditCompany = (company) => {
    navigate(`/companies/${company._id}?view=edit`);
  };

  const handleMessageCompany = (company) => {
    if (company.email) {
      window.location.href = `mailto:${company.email}`;
    } else {
      toast('No company email available');
    }
  };

  const handleApplyFilters = () => {
    const params = {};
    if (searchText.trim()) params.search = searchText.trim();
    if (statusFilter !== 'All') params.status = statusFilter;
    if (verificationFilter !== 'All') params.isVerified = verificationFilter === 'Verified' ? 'true' : 'false';
    if (industryFilter !== 'All') params.industry = industryFilter;
    dispatch(fetchAdminCompanies(params));
  };

  const resetFilters = () => {
    setSearchText('');
    setStatusFilter('All');
    setVerificationFilter('All');
    setIndustryFilter('All');
    dispatch(fetchAdminCompanies());
  };

  return (
    <div className="space-y-6">
      <div className="card p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Companies</h1>
          <p className="text-gray-600 mt-2">Approve new company profiles and update business listings.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary inline-flex items-center gap-2 px-4 py-3"
          onClick={() => navigate('/admin/companies/new')}
        >
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
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input mt-2"
            >
              <option>All</option>
              <option>Approved</option>
              <option>Pending</option>
              <option>Rejected</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-gray-500">Verification</span>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="input mt-2"
            >
              <option>All</option>
              <option>Verified</option>
              <option>Unverified</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-gray-500">Industries</span>
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="input mt-2"
            >
              <option>All</option>
              {industryOptions.map((industry) => (
                <option key={industry}>{industry}</option>
              ))}
            </select>
          </label>

          <button type="button" className="btn btn-primary inline-flex items-center justify-center gap-2 px-4 py-3"
            onClick={handleApplyFilters}
          >
            <FiFilter /> Filter
          </button>

          <button type="button" className="btn btn-outline inline-flex items-center justify-center gap-2 px-4 py-3"
            onClick={resetFilters}
          >
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
                        <button type="button" onClick={() => handleOpenReview(company)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-600" aria-label="View details">
                          <FiEye />
                        </button>
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
                <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                  No companies match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {documentPreview.open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/55 p-4">
          <div className="w-full max-w-6xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{documentPreview.title}</h3>
              <button type="button" onClick={closeDocumentPreview} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600">
                <FiX />
              </button>
            </div>
            <div className="bg-gray-50 p-4 dark:bg-slate-900">
              {documentPreview.url.toLowerCase().includes('.pdf') ? (
                <iframe src={documentPreview.url} title={documentPreview.title} className="h-[70vh] w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-700" />
              ) : (
                <img src={documentPreview.url} alt={documentPreview.title} className="max-h-[70vh] w-full rounded-2xl object-contain" />
              )}
            </div>
          </div>
        </div>
      ) : null}

      {isReviewOpen && selectedCompany ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4">
          <div className="h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-slate-950">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-slate-950">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">Company Review</p>
                <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{selectedCompany.name}</h2>
              </div>
              <button type="button" onClick={() => setIsReviewOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600" aria-label="Close review panel">
                <FiX />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-slate-900">
                  {selectedCompany.coverImage ? (
                    <img src={selectedCompany.coverImage} alt={`${selectedCompany.name} cover`} className="h-40 w-full object-cover" />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-sm text-white/80">
                      No cover image
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-2xl bg-white/90 px-3 py-2 backdrop-blur-sm">
                    {selectedCompany.logo ? (
                      <img src={selectedCompany.logo} alt={`${selectedCompany.name} logo`} className="h-12 w-12 rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                        <FiBriefcase className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{selectedCompany.name}</p>
                      <p className="text-xs text-gray-500">{selectedCompany.industry || 'Industry not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">Overview</p>
                <div className="mt-3 space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-start gap-2">
                    <FiFileText className="mt-0.5 h-4 w-4 text-primary-500" />
                    <span>{selectedCompany.description || 'No company description provided yet.'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMapPin className="h-4 w-4 text-primary-500" />
                    <span>{selectedCompany.location?.city || 'City not set'}, {selectedCompany.location?.region || 'Region not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiGlobe className="h-4 w-4 text-primary-500" />
                    <span>{selectedCompany.website || 'Website not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMail className="h-4 w-4 text-primary-500" />
                    <span>{selectedCompany.email || 'Company email not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiPhone className="h-4 w-4 text-primary-500" />
                    <span>{selectedCompany.phone || 'Phone number not set'}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">Social Links</p>
                <div className="mt-3 grid gap-2 text-sm text-gray-700 dark:text-gray-300">
                  {selectedCompany.socialLinks?.linkedin ? (
                    <a href={selectedCompany.socialLinks.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700 hover:border-primary-300 hover:text-primary-600 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-300">
                      <FiLinkedin className="h-4 w-4" />
                      <span>{selectedCompany.socialLinks.linkedin}</span>
                    </a>
                  ) : (
                    <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:bg-slate-900 dark:text-gray-300">LinkedIn: Not set</div>
                  )}

                  {selectedCompany.socialLinks?.facebook ? (
                    <a href={selectedCompany.socialLinks.facebook} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700 hover:border-primary-300 hover:text-primary-600 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-300">
                      <FiFacebook className="h-4 w-4" />
                      <span>{selectedCompany.socialLinks.facebook}</span>
                    </a>
                  ) : (
                    <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:bg-slate-900 dark:text-gray-300">Facebook: Not set</div>
                  )}

                  {selectedCompany.socialLinks?.telegram ? (
                    <a href={selectedCompany.socialLinks.telegram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700 hover:border-primary-300 hover:text-primary-600 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-300">
                      <FiSend className="h-4 w-4" />
                      <span>{selectedCompany.socialLinks.telegram}</span>
                    </a>
                  ) : (
                    <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:bg-slate-900 dark:text-gray-300">Telegram: Not set</div>
                  )}

                  {selectedCompany.socialLinks?.instagram ? (
                    <a href={selectedCompany.socialLinks.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700 hover:border-primary-300 hover:text-primary-600 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-300">
                      <FiInstagram className="h-4 w-4" />
                      <span>{selectedCompany.socialLinks.instagram}</span>
                    </a>
                  ) : (
                    <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:bg-slate-900 dark:text-gray-300">Instagram: Not set</div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">Recruiter</p>
                <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <FiUser className="h-4 w-4 text-primary-500" />
                    <span>{selectedCompany.recruiter?.hrManagerName || 'Recruiter not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiShield className="h-4 w-4 text-primary-500" />
                    <span>{selectedCompany.recruiter?.position || 'Position not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMail className="h-4 w-4 text-primary-500" />
                    <span>{selectedCompany.recruiter?.email || 'Recruiter email not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiPhone className="h-4 w-4 text-primary-500" />
                    <span>{selectedCompany.recruiter?.phone || 'Recruiter phone not set'}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">Verification Documents</p>
                <div className="mt-3 grid gap-2">
                  {selectedCompany.businessLicense ? (
                    <button
                      type="button"
                      onClick={() => openDocumentPreview('Business License', selectedCompany.businessLicense)}
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs text-gray-700 transition hover:border-primary-300 hover:text-primary-600 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-300 dark:hover:border-primary-400 dark:hover:text-primary-300"
                    >
                      License: {selectedCompany.businessLicense.split('/').pop()}
                    </button>
                  ) : (
                    <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:bg-slate-900 dark:text-gray-300">
                      License: Not uploaded
                    </div>
                  )}

                  {selectedCompany.tinCertificate ? (
                    <button
                      type="button"
                      onClick={() => openDocumentPreview('TIN Certificate', selectedCompany.tinCertificate)}
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs text-gray-700 transition hover:border-primary-300 hover:text-primary-600 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-300 dark:hover:border-primary-400 dark:hover:text-primary-300"
                    >
                      TIN: {selectedCompany.tinCertificate.split('/').pop()}
                    </button>
                  ) : (
                    <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:bg-slate-900 dark:text-gray-300">
                      TIN: Not uploaded
                    </div>
                  )}

                  {selectedCompany.companyRegistration ? (
                    <button
                      type="button"
                      onClick={() => openDocumentPreview('Company Registration', selectedCompany.companyRegistration)}
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs text-gray-700 transition hover:border-primary-300 hover:text-primary-600 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-300 dark:hover:border-primary-400 dark:hover:text-primary-300"
                    >
                      Registration: {selectedCompany.companyRegistration.split('/').pop()}
                    </button>
                  ) : (
                    <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:bg-slate-900 dark:text-gray-300">
                      Registration: Not uploaded
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">Admin Decision</p>
                <div className="mt-3 space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Rejection reason
                    <textarea
                      value={rejectionReason}
                      onChange={(event) => setRejectionReason(event.target.value)}
                      rows="4"
                      placeholder="Enter the reason this company is being rejected..."
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-gray-700 dark:bg-slate-900 dark:text-white"
                    />
                  </label>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        handleApprove(selectedCompany._id);
                        setIsReviewOpen(false);
                      }}
                      className="btn btn-primary inline-flex items-center gap-2"
                    >
                      <FiCheckCircle />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(selectedCompany._id, rejectionReason)}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                      <FiX />
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsReviewOpen(false)}
                      className="btn btn-outline"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ManageCompanies;
