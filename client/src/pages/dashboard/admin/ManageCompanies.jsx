import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiEye, FiBriefcase, FiUsers, FiEdit2, FiMail, FiSearch, FiFilter, FiRefreshCcw, FiPlus, FiX, FiCheckCircle, FiMapPin, FiGlobe, FiPhone, FiShield, FiUser, FiFileText, FiFacebook, FiLinkedin, FiInstagram, FiSend } from 'react-icons/fi';
import { format } from 'date-fns';
import { fetchAdminCompanies, approveCompany, rejectCompany, verifyCompany } from '../../../store/slices/adminSlice';
import toast from 'react-hot-toast';

const ManageCompanies = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
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

  const statusType = (company) => {
    if (!company.isApproved && company.isActive === false) return 'rejected';
    return company.isApproved ? 'approved' : 'pending';
  };

  const statusLabel = (company) => {
    const type = statusType(company);
    if (type === 'rejected') return t('admin.status.rejected') || 'Rejected';
    if (type === 'approved') return t('admin.status.approved') || 'Approved';
    return t('admin.status.pending') || 'Pending';
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
      toast.success(t('admin.manageCompanies.approveSuccess') || 'Company approved successfully');
      if (selectedCompany?._id === companyId) {
        setSelectedCompany((current) => current ? { ...current, isApproved: true, isActive: true } : current);
      }
    } catch (error) {
      toast.error(error?.message || (typeof error === 'string' ? error : t('admin.manageCompanies.approveFailed')));
    }
  };

  const handleReject = async (companyId, reason) => {
    const trimmedReason = reason?.trim();

    if (!trimmedReason) {
      toast.error(t('admin.manageCompanies.rejectReasonRequired') || 'Please enter a rejection reason before rejecting this company.');
      return;
    }

    try {
      await dispatch(rejectCompany({ companyId, reason: trimmedReason })).unwrap();
      toast.success(t('admin.manageCompanies.rejectSuccess') || 'Company rejected successfully');
      if (selectedCompany?._id === companyId) {
        setSelectedCompany((current) => current ? { ...current, isApproved: false, isActive: false, rejectionReason: trimmedReason } : current);
        setIsReviewOpen(false);
        setRejectionReason('');
      }
    } catch (error) {
      toast.error(error?.message || (typeof error === 'string' ? error : t('admin.manageCompanies.rejectFailed')));
    }
  };

  const handleVerify = async (companyId) => {
    try {
      await dispatch(verifyCompany(companyId)).unwrap();
      toast.success(t('admin.manageCompanies.verifySuccess') || 'Company verification status updated');
    } catch (error) {
      toast.error(error?.message || (typeof error === 'string' ? error : t('admin.manageCompanies.verifyFailed')));
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
      toast(t('admin.manageCompanies.noCompanyEmail') || 'No company email available');
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
          <h1 className="text-3xl font-bold">{t('admin.manageCompanies.title') || 'Manage Companies'}</h1>
          <p className="text-gray-600 mt-2">{t('admin.manageCompanies.subtitle') || 'Approve new company profiles and update business listings.'}</p>
        </div>
        <button
          type="button"
          className="btn btn-primary inline-flex items-center gap-2 px-4 py-3"
          onClick={() => navigate('/admin/companies/new')}
        >
          <FiPlus /> {t('admin.manageCompanies.addNew') || 'Add New Company'}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="card p-5 border border-gray-200 bg-white shadow-sm">
          <p className="text-sm text-gray-500">{t('admin.manageCompanies.totalCompanies') || 'Total Companies'}</p>
          <p className="mt-3 text-3xl font-semibold">{summary.total}</p>
        </div>
        <div className="card p-5 border border-gray-200 bg-white shadow-sm">
          <p className="text-sm text-gray-500">{t('admin.manageCompanies.verifiedCompanies') || 'Verified Companies'}</p>
          <p className="mt-3 text-3xl font-semibold">{summary.verified}</p>
        </div>
        <div className="card p-5 border border-gray-200 bg-white shadow-sm">
          <p className="text-sm text-gray-500">{t('admin.manageCompanies.pendingCompanies') || 'Pending Companies'}</p>
          <p className="mt-3 text-3xl font-semibold">{summary.pending}</p>
        </div>
        <div className="card p-5 border border-gray-200 bg-white shadow-sm">
          <p className="text-sm text-gray-500">{t('admin.manageCompanies.rejectedCompanies') || 'Rejected Companies'}</p>
          <p className="mt-3 text-3xl font-semibold">{summary.rejected}</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto_auto] items-end">
          <label className="block">
            <span className="sr-only">{t('admin.manageCompanies.search') || 'Search'}</span>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={t('admin.manageCompanies.searchPlaceholder') || 'Search company name, owner, email...'}
                className="input pl-10"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm text-gray-500">{t('admin.manageCompanies.status') || 'Status'}</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input mt-2">
              <option value="All">{t('admin.status.all') || 'All'}</option>
              <option value="Approved">{t('admin.status.approved') || 'Approved'}</option>
              <option value="Pending">{t('admin.status.pending') || 'Pending'}</option>
              <option value="Rejected">{t('admin.status.rejected') || 'Rejected'}</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-gray-500">{t('admin.manageCompanies.verification') || 'Verification'}</span>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="input mt-2"
            >
              <option value="All">{t('admin.status.all') || 'All'}</option>
              <option value="Verified">{t('admin.status.verified') || 'Verified'}</option>
              <option value="Unverified">{t('admin.status.unverified') || 'Unverified'}</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-gray-500">{t('admin.manageCompanies.industries') || 'Industries'}</span>
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="input mt-2"
            >
              <option value="All">{t('admin.status.all') || 'All'}</option>
              {industryOptions.map((industry) => (
                <option key={industry}>{industry}</option>
              ))}
            </select>
          </label>

          <button type="button" className="btn btn-primary inline-flex items-center justify-center gap-2 px-4 py-3"
            onClick={handleApplyFilters}
          >
            <FiFilter /> {t('admin.manageCompanies.filter') || 'Filter'}
          </button>

          <button type="button" className="btn btn-outline inline-flex items-center justify-center gap-2 px-4 py-3"
            onClick={resetFilters}
          >
            <FiRefreshCcw /> {t('admin.manageCompanies.reset') || 'Reset'}
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">{t('admin.manageCompanies.company') || 'Company'}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">{t('admin.manageCompanies.industry') || 'Industry'}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">{t('admin.manageCompanies.ownerContact') || 'Owner / Contact'}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">{t('admin.manageCompanies.status') || 'Status'}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">{t('admin.manageCompanies.verification') || 'Verification'}</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">{t('admin.manageCompanies.jobs') || 'Jobs'}</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">{t('admin.manageCompanies.applicants') || 'Applicants'}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">{t('admin.manageCompanies.joinedDate') || 'Joined Date'}</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">{t('admin.manageCompanies.actions') || 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan="9" className="px-4 py-8 text-center text-gray-500">{t('admin.manageCompanies.loading') || 'Loading companies...'}</td>
              </tr>
            ) : filteredCompanies.length > 0 ? (
              filteredCompanies.map((company) => {
                const ownerName = [company.owner?.firstName, company.owner?.lastName].filter(Boolean).join(' ') || t('admin.manageCompanies.noOwner') || 'No owner assigned';
                const ownerContact = company.owner?.email || company.phone || t('admin.manageCompanies.noContact') || 'No contact available';
                const totalJobs = company.totalJobs ?? company.jobs?.length ?? 0;
                const applicantsCount = company.jobs?.reduce((sum, job) => sum + (job.applicantsCount || 0), 0) || 0;
                const type = statusType(company);

                return (
                  <tr key={company._id}>
                    <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                      <div className="space-y-1">
                        <div>{company.name}</div>
                        <div className="text-xs text-gray-500">{company.email || company.website || t('admin.manageCompanies.noEmail') || 'No email provided'}</div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">{company.industry || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                      <div>{ownerName}</div>
                      <div className="text-xs text-gray-500">{ownerContact}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${type === 'approved' ? 'bg-[#DCF2E8] text-[#065F46]' : type === 'rejected' ? 'bg-[#FEE2E2] text-[#B91C1C]' : 'bg-[#FEF3C7] text-[#92400E]'}`}>
                        {statusLabel(company)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${company.isVerified ? 'bg-[#DCF2E8] text-[#065F46]' : 'bg-[#F1F5F9] text-[#4B5563]'}`}>
                        {company.isVerified ? (t('admin.status.verified') || 'Verified') : (t('admin.status.unverified') || 'Unverified')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-gray-700">{totalJobs}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-gray-700">{applicantsCount}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">{company.createdAt ? format(new Date(company.createdAt), 'MMM dd, yyyy') : '—'}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                      <div className="flex items-center justify-center gap-2">
                        <button type="button" onClick={() => handleOpenReview(company)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-600" aria-label={t('admin.manageCompanies.viewDetails') || 'View details'}>
                          <FiEye />
                        </button>
                        <button type="button" onClick={() => handleManageJobs(company)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-600" aria-label={t('admin.manageCompanies.manageJobs') || 'Manage jobs'}>
                          <FiBriefcase />
                        </button>
                        <button type="button" onClick={() => handleViewApplicants(company)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-600" aria-label={t('admin.manageCompanies.viewApplicants') || 'View applicants'}>
                          <FiUsers />
                        </button>
                        <button type="button" onClick={() => handleEditCompany(company)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-600" aria-label={t('admin.manageCompanies.editCompany') || 'Edit company'}>
                          <FiEdit2 />
                        </button>
                        <button type="button" onClick={() => handleMessageCompany(company)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-600" aria-label={t('admin.manageCompanies.messageCompany') || 'Message company'}>
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
                  {t('admin.manageCompanies.noCompanies') || 'No companies match the selected filters.'}
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
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">{t('admin.manageCompanies.companyReview') || 'Company Review'}</p>
                <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{selectedCompany.name}</h2>
              </div>
              <button type="button" onClick={() => setIsReviewOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600" aria-label={t('admin.manageCompanies.close') || 'Close review panel'}>
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
                      {t('admin.manageCompanies.noCoverImage') || 'No cover image'}
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
                      <p className="text-xs text-gray-500">{selectedCompany.industry || t('admin.manageCompanies.industryNotSpecified') || 'Industry not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">{t('admin.manageCompanies.overview') || 'Overview'}</p>
                <div className="mt-3 space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-start gap-2">
                    <FiFileText className="mt-0.5 h-4 w-4 text-primary-500" />
                    <span>{selectedCompany.description || t('admin.manageCompanies.noDescription') || 'No company description provided yet.'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMapPin className="h-4 w-4 text-primary-500" />
                    <span>{selectedCompany.location?.city || t('admin.manageCompanies.cityNotSet') || 'City not set'}, {selectedCompany.location?.region || t('admin.manageCompanies.regionNotSet') || 'Region not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiGlobe className="h-4 w-4 text-primary-500" />
                    <span>{selectedCompany.website || t('admin.manageCompanies.websiteNotSet') || 'Website not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMail className="h-4 w-4 text-primary-500" />
                    <span>{selectedCompany.email || t('admin.manageCompanies.emailNotSet') || 'Company email not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiPhone className="h-4 w-4 text-primary-500" />
                    <span>{selectedCompany.phone || t('admin.manageCompanies.phoneNotSet') || 'Phone number not set'}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">{t('admin.manageCompanies.socialLinks') || 'Social Links'}</p>
                <div className="mt-3 grid gap-2 text-sm text-gray-700 dark:text-gray-300">
                  {selectedCompany.socialLinks?.linkedin ? (
                    <a href={selectedCompany.socialLinks.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700 hover:border-primary-300 hover:text-primary-600 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-300">
                      <FiLinkedin className="h-4 w-4" />
                      <span>{selectedCompany.socialLinks.linkedin}</span>
                    </a>
                  ) : (
                    <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:bg-slate-900 dark:text-gray-300">{t('admin.manageCompanies.linkedinNotSet') || 'LinkedIn: Not set'}</div>
                  )}

                  {selectedCompany.socialLinks?.facebook ? (
                    <a href={selectedCompany.socialLinks.facebook} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700 hover:border-primary-300 hover:text-primary-600 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-300">
                      <FiFacebook className="h-4 w-4" />
                      <span>{selectedCompany.socialLinks.facebook}</span>
                    </a>
                  ) : (
                    <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:bg-slate-900 dark:text-gray-300">{t('admin.manageCompanies.facebookNotSet') || 'Facebook: Not set'}</div>
                  )}

                  {selectedCompany.socialLinks?.telegram ? (
                    <a href={selectedCompany.socialLinks.telegram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700 hover:border-primary-300 hover:text-primary-600 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-300">
                      <FiSend className="h-4 w-4" />
                      <span>{selectedCompany.socialLinks.telegram}</span>
                    </a>
                  ) : (
                    <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:bg-slate-900 dark:text-gray-300">{t('admin.manageCompanies.telegramNotSet') || 'Telegram: Not set'}</div>
                  )}

                  {selectedCompany.socialLinks?.instagram ? (
                    <a href={selectedCompany.socialLinks.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700 hover:border-primary-300 hover:text-primary-600 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-300">
                      <FiInstagram className="h-4 w-4" />
                      <span>{selectedCompany.socialLinks.instagram}</span>
                    </a>
                  ) : (
                    <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:bg-slate-900 dark:text-gray-300">{t('admin.manageCompanies.instagramNotSet') || 'Instagram: Not set'}</div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">{t('admin.manageCompanies.recruiter') || 'Recruiter'}</p>
                <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <FiUser className="h-4 w-4 text-primary-500" />
                    <span>{selectedCompany.recruiter?.hrManagerName || t('admin.manageCompanies.recruiterNotSet') || 'Recruiter not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiShield className="h-4 w-4 text-primary-500" />
                    <span>{selectedCompany.recruiter?.position || t('admin.manageCompanies.positionNotSet') || 'Position not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMail className="h-4 w-4 text-primary-500" />
                    <span>{selectedCompany.recruiter?.email || t('admin.manageCompanies.recruiterEmailNotSet') || 'Recruiter email not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiPhone className="h-4 w-4 text-primary-500" />
                    <span>{selectedCompany.recruiter?.phone || t('admin.manageCompanies.recruiterPhoneNotSet') || 'Recruiter phone not set'}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">{t('admin.manageCompanies.verificationDocuments') || 'Verification Documents'}</p>
                <div className="mt-3 grid gap-2">
                  {selectedCompany.businessLicense ? (
                    <button
                      type="button"
                      onClick={() => openDocumentPreview(t('admin.manageCompanies.businessLicense') || 'Business License', selectedCompany.businessLicense)}
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs text-gray-700 transition hover:border-primary-300 hover:text-primary-600 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-300 dark:hover:border-primary-400 dark:hover:text-primary-300"
                    >
                      {t('admin.manageCompanies.license') || 'License'}: {selectedCompany.businessLicense.split('/').pop()}
                    </button>
                  ) : (
                    <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:bg-slate-900 dark:text-gray-300">
                      {t('admin.manageCompanies.license') || 'License'}: {t('admin.manageCompanies.notUploaded') || 'Not uploaded'}
                    </div>
                  )}

                  {selectedCompany.tinCertificate ? (
                    <button
                      type="button"
                      onClick={() => openDocumentPreview(t('admin.manageCompanies.tinCertificate') || 'TIN Certificate', selectedCompany.tinCertificate)}
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs text-gray-700 transition hover:border-primary-300 hover:text-primary-600 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-300 dark:hover:border-primary-400 dark:hover:text-primary-300"
                    >
                      {t('admin.manageCompanies.tin') || 'TIN'}: {selectedCompany.tinCertificate.split('/').pop()}
                    </button>
                  ) : (
                    <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:bg-slate-900 dark:text-gray-300">
                      {t('admin.manageCompanies.tin') || 'TIN'}: {t('admin.manageCompanies.notUploaded') || 'Not uploaded'}
                    </div>
                  )}

                  {selectedCompany.companyRegistration ? (
                    <button
                      type="button"
                      onClick={() => openDocumentPreview(t('admin.manageCompanies.companyRegistration') || 'Company Registration', selectedCompany.companyRegistration)}
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs text-gray-700 transition hover:border-primary-300 hover:text-primary-600 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-300 dark:hover:border-primary-400 dark:hover:text-primary-300"
                    >
                      {t('admin.manageCompanies.registration') || 'Registration'}: {selectedCompany.companyRegistration.split('/').pop()}
                    </button>
                  ) : (
                    <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:bg-slate-900 dark:text-gray-300">
                      {t('admin.manageCompanies.registration') || 'Registration'}: {t('admin.manageCompanies.notUploaded') || 'Not uploaded'}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">{t('admin.manageCompanies.adminDecision') || 'Admin Decision'}</p>
                <div className="mt-3 space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('admin.manageCompanies.rejectionReason') || 'Rejection reason'}
                    <textarea
                      value={rejectionReason}
                      onChange={(event) => setRejectionReason(event.target.value)}
                      rows="4"
                      placeholder={t('admin.manageCompanies.rejectionReasonPlaceholder') || 'Enter the reason this company is being rejected...'}
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
                      {t('admin.manageCompanies.approve') || 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(selectedCompany._id, rejectionReason)}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                      <FiX />
                      {t('admin.manageCompanies.reject') || 'Reject'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsReviewOpen(false)}
                      className="btn btn-outline"
                    >
                      {t('admin.manageCompanies.close') || 'Close'}
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
