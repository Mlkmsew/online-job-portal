import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiEye, FiBriefcase, FiUsers, FiEdit2, FiMail, FiSearch, FiFilter, FiRefreshCcw, FiPlus, FiX, FiCheckCircle, FiMapPin, FiGlobe, FiPhone, FiShield, FiUser, FiFileText, FiFacebook, FiLinkedin, FiInstagram, FiSend, FiExternalLink, FiCalendar, FiAward } from 'react-icons/fi';
import { format } from 'date-fns';
import { fetchAdminCompanies, approveCompany, rejectCompany, verifyCompany } from '../../../store/slices/adminSlice';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const REVIEW_DOC_TYPES = ['businessLicense', 'tinCertificate', 'companyRegistration'];

const InfoItem = ({ icon: Icon, label, value }) => (
  <div>
    <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </div>
    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{value}</p>
  </div>
);

const DetailRow = ({ icon: Icon, label, value, href }) => (
  <div className="flex items-start gap-3">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
    <div className="min-w-0">
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      {href ? (
        <a
          href={href}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel="noreferrer"
          className="break-words text-sm font-medium text-[var(--primary)] hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className="break-words text-sm font-medium text-[var(--text-primary)]">{value}</p>
      )}
    </div>
  </div>
);

const ManageCompanies = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { companies, loading } = useSelector((state) => state.admin);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [approvalFilter, setApprovalFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [documentPreview, setDocumentPreview] = useState({ open: false, title: '', subtitle: '', url: '', name: '' });
  const [docBlobUrl, setDocBlobUrl] = useState(null);
  const [docContentType, setDocContentType] = useState('');
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState('');

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

      if (approvalFilter !== 'All') {
        if (approvalFilter === 'Approved' && !company.isApproved) return false;
        if (approvalFilter === 'Unapproved' && company.isApproved) return false;
      }

      if (industryFilter !== 'All' && company.industry !== industryFilter) return false;

      return true;
    });
  }, [companies, searchText, statusFilter, approvalFilter, industryFilter]);

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

  const openDocumentPreview = (company, docType) => {
    const field = docType; // e.g. 'businessLicense'
    if (!company || !company[field]) return;
    const token = localStorage.getItem('token');
    // Build an ABSOLUTE url so that api.get() does not prepend the /api baseURL
    // a second time (which previously produced /api/api/... and a 404).
    const apiBase = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;
    const url = `${apiBase}/admin/companies/${company._id}/documents/${docType}?token=${encodeURIComponent(token || '')}`;
    const docLabel = t(`admin.manageCompanies.${docType}`) || docType;
    const realName = company[`${field}Name`];
    const name = realName || docLabel;
    setDocumentPreview({
      open: true,
      title: docLabel,
      subtitle: t('admin.manageCompanies.documentPreview') || 'Document preview',
      url,
      name,
    });
  };

  const closeDocumentPreview = () => {
    setDocumentPreview({ open: false, title: '', subtitle: '', url: '', name: '' });
    setDocBlobUrl(null);
    setDocContentType('');
    setDocError('');
    setDocLoading(false);
  };

  // Fetch the document through the authenticated backend proxy and render it
  // inside the modal. We fetch as a blob so we can surface a real error message
  // (instead of a blank page) and still render the actual PDF/image in the viewer.
  useEffect(() => {
    if (!documentPreview.open || !documentPreview.url) return undefined;
    let cancelled = false;
    let objectUrl = null;
    setDocLoading(true);
    setDocError('');
    setDocBlobUrl(null);
    setDocContentType('');

    api
      .get(documentPreview.url, {
        responseType: 'blob',
        skipAuthRedirect: true,
        skipGlobalErrorToast: true,
      })
      .then((res) => {
        if (cancelled) return;
        const contentType = res.headers?.['content-type'] || '';
        if (contentType.includes('application/json')) {
          // backend returned an error payload instead of the file
          setDocError(t('admin.manageCompanies.documentFetchError') || 'Could not retrieve this document.');
          setDocLoading(false);
          return;
        }
        objectUrl = URL.createObjectURL(res.data);
        setDocBlobUrl(objectUrl);
        setDocContentType(contentType);
        setDocLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setDocError(t('admin.manageCompanies.documentFetchError') || 'Could not retrieve this document.');
        setDocLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentPreview.open, documentPreview.url, t]);

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
    const owner = company.owner;
    if (owner?._id) {
      navigate('/admin/messages', { state: { recipientId: owner._id, recipientName: [owner.firstName, owner.lastName].filter(Boolean).join(' ') || owner.email } });
    } else {
      toast(t('admin.manageCompanies.noCompanyEmail') || 'No company owner available');
    }
  };

  const handleApplyFilters = () => {
    const params = {};
    if (searchText.trim()) params.search = searchText.trim();
    if (statusFilter !== 'All') params.status = statusFilter;
    if (approvalFilter !== 'All') params.isVerified = approvalFilter === 'Approved' ? 'true' : 'false';
    if (industryFilter !== 'All') params.industry = industryFilter;
    dispatch(fetchAdminCompanies(params));
  };

  const resetFilters = () => {
    setSearchText('');
    setStatusFilter('All');
    setApprovalFilter('All');
    setIndustryFilter('All');
    dispatch(fetchAdminCompanies());
  };

  const selectedType = selectedCompany ? statusType(selectedCompany) : 'pending';

  const reviewSocials = (() => {
    const links = selectedCompany?.socialLinks || {};
    return [
      { key: 'linkedin', label: t('admin.manageCompanies.socialLinkedin'), icon: FiLinkedin, url: links.linkedin },
      { key: 'facebook', label: t('admin.manageCompanies.socialFacebook'), icon: FiFacebook, url: links.facebook },
      { key: 'telegram', label: t('admin.manageCompanies.socialTelegram'), icon: FiSend, url: links.telegram },
      { key: 'instagram', label: t('admin.manageCompanies.socialInstagram'), icon: FiInstagram, url: links.instagram },
    ].filter((s) => s.url);
  })();

  const getFileTypeLabel = (docType) => {
    const name = selectedCompany?.[`${docType}Name`];
    if (name) {
      const lower = name.toLowerCase();
      if (lower.endsWith('.pdf')) return t('admin.manageCompanies.pdfDocument');
      if (/\.(png|jpe?g|gif|webp|bmp)$/i.test(lower)) return t('admin.manageCompanies.imageDocument');
    }
    const mime = selectedCompany?.[`${docType}Mime`];
    if (mime) {
      if (mime.includes('pdf')) return t('admin.manageCompanies.pdfDocument');
      if (mime.startsWith('image/')) return t('admin.manageCompanies.imageDocument');
    }
    return t('admin.manageCompanies.otherDocument');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
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
            <span className="text-sm text-gray-500">{t('admin.manageCompanies.approval') || 'Approval'}</span>
            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="input mt-2"
            >
              <option value="All">{t('admin.status.all') || 'All'}</option>
              <option value="Approved">{t('admin.status.approved') || 'Approved'}</option>
              <option value="Unapproved">{t('admin.status.unapproved') || 'Unapproved'}</option>
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
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">{t('admin.manageCompanies.jobs') || 'Jobs'}</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">{t('admin.manageCompanies.applicants') || 'Applicants'}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">{t('admin.manageCompanies.joinedDate') || 'Joined Date'}</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">{t('admin.manageCompanies.actions') || 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-gray-500">{t('admin.manageCompanies.loading') || 'Loading companies...'}</td>
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
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-gray-700">{totalJobs}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-gray-700">{applicantsCount}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">{company.createdAt ? format(new Date(company.createdAt), 'MMM dd, yyyy') : '—'}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                      <div className="flex items-center justify-center gap-2">
                        <button type="button" onClick={() => handleOpenReview(company)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-600" aria-label={t('admin.manageCompanies.viewDetails') || 'View details'}>
                          <FiEye />
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
                <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
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
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-gray-900 dark:text-white">{documentPreview.title}</h3>
                <p className="mt-0.5 text-sm text-gray-500">{documentPreview.subtitle}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200">
                  <FiFileText className="h-4 w-4 text-primary-500" /> {documentPreview.name}
                </p>
              </div>
              <button type="button" onClick={closeDocumentPreview} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600">
                <FiX />
              </button>
            </div>
            <div className="bg-gray-50 p-4 dark:bg-slate-900">
              <div className="space-y-3">
                {docLoading ? (
                  <div className="flex h-[70vh] w-full items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500 dark:border-gray-700 dark:bg-slate-950">
                    {t('admin.manageCompanies.loadingDocument') || 'Loading document…'}
                  </div>
                ) : docError ? (
                  <div className="flex h-[70vh] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white text-center text-gray-500 dark:border-gray-700 dark:bg-slate-950">
                    <FiFileText className="h-10 w-10 text-gray-300" />
                    <p>{docError}</p>
                    <a
                      href={documentPreview.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary inline-flex items-center gap-2"
                    >
                      <FiExternalLink /> {t('admin.manageCompanies.openInNewTab') || 'Open in new tab'}
                    </a>
                  </div>
                ) : docContentType.startsWith('image/') ? (
                  <div className="space-y-3">
                    <img
                      src={docBlobUrl}
                      alt={documentPreview.title}
                      className="mx-auto max-h-[70vh] w-full rounded-2xl border border-gray-200 bg-white object-contain dark:border-gray-700"
                    />
                    <a
                      href={documentPreview.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline inline-flex items-center gap-2"
                    >
                      <FiExternalLink /> {t('admin.manageCompanies.openInNewTab') || 'Open in new tab'}
                    </a>
                  </div>
                ) : docContentType === 'application/pdf' ? (
                  <div className="space-y-3">
                    <iframe
                      src={docBlobUrl}
                      title={documentPreview.title}
                      className="h-[70vh] w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-700"
                    />
                    <a
                      href={documentPreview.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline inline-flex items-center gap-2"
                    >
                      <FiExternalLink /> {t('admin.manageCompanies.openInNewTab') || 'Open in new tab'}
                    </a>
                  </div>
                ) : (
                  <div className="flex h-[70vh] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white text-center text-gray-500 dark:border-gray-700 dark:bg-slate-950">
                    <FiFileText className="h-10 w-10 text-gray-300" />
                    <p>{t('admin.manageCompanies.documentPreviewUnsupported') || 'This file type cannot be previewed here.'}</p>
                    <a
                      href={documentPreview.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary inline-flex items-center gap-2"
                    >
                      <FiExternalLink /> {t('admin.manageCompanies.openInNewTab') || 'Open in new tab'}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isReviewOpen && selectedCompany ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="modal-surface flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">{t('admin.manageCompanies.companyReview')}</p>
                <h2 className="mt-1 truncate text-xl font-bold text-[var(--text-primary)]">{selectedCompany.name}</h2>
                <p className="text-sm text-[var(--text-secondary)]">{t('admin.manageCompanies.companyReviewSubtitle')}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                aria-label={t('admin.manageCompanies.closeReview')}
              >
                <FiX />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {/* Company Identity */}
              <div className="card">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  {selectedCompany.logo ? (
                    <img src={selectedCompany.logo} alt={`${selectedCompany.name} logo`} className="h-20 w-20 rounded-2xl border border-[var(--border)] object-cover" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#1769E0]/10 text-[#1769E0]">
                      <FiBriefcase className="h-8 w-8" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-2xl font-bold text-[var(--text-primary)]">{selectedCompany.name}</h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{selectedCompany.industry || t('admin.manageCompanies.industryNotSpecified')}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`badge ${selectedType === 'approved' ? 'badge-success' : selectedType === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>{statusLabel(selectedCompany)}</span>
                      {selectedCompany.isVerified ? (
                        <span className="badge badge-primary"><FiCheckCircle className="mr-1 h-3.5 w-3.5" />{t('admin.manageCompanies.verified')}</span>
                      ) : null}
                      {selectedCompany.isFeatured ? (
                        <span className="badge badge-muted"><FiAward className="mr-1 h-3.5 w-3.5" />{t('admin.manageCompanies.featured')}</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-5 sm:grid-cols-4">
                  <InfoItem icon={FiBriefcase} label={t('admin.manageCompanies.companyType')} value={selectedCompany.companyType || t('admin.manageCompanies.notProvided')} />
                  <InfoItem icon={FiUsers} label={t('admin.manageCompanies.companySize')} value={selectedCompany.companySize || t('admin.manageCompanies.notProvided')} />
                  <InfoItem icon={FiCalendar} label={t('admin.manageCompanies.foundedYear')} value={selectedCompany.foundedYear ? String(selectedCompany.foundedYear) : t('admin.manageCompanies.notProvided')} />
                  <InfoItem icon={FiShield} label={t('admin.manageCompanies.currentStatusLabel')} value={selectedCompany.isActive ? t('admin.manageCompanies.active') : t('admin.manageCompanies.inactive')} />
                </div>
              </div>

              {/* Overview + Contact */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="card">
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">{t('admin.manageCompanies.companyOverview')}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{selectedCompany.description || t('admin.manageCompanies.noDescription')}</p>
                  <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
                    <DetailRow icon={FiBriefcase} label={t('admin.manageCompanies.companyType')} value={selectedCompany.companyType || t('admin.manageCompanies.notProvided')} />
                    <DetailRow icon={FiGlobe} label={t('admin.manageCompanies.websiteLabel')} value={selectedCompany.website || t('admin.manageCompanies.notProvided')} href={selectedCompany.website} />
                    <DetailRow icon={FiUsers} label={t('admin.manageCompanies.companySize')} value={selectedCompany.companySize || t('admin.manageCompanies.notProvided')} />
                    <DetailRow icon={FiCalendar} label={t('admin.manageCompanies.foundedYear')} value={selectedCompany.foundedYear ? String(selectedCompany.foundedYear) : t('admin.manageCompanies.notProvided')} />
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">{t('admin.manageCompanies.contactInformation')}</h3>
                  <div className="mt-4 space-y-3">
                    <DetailRow icon={FiMail} label={t('admin.manageCompanies.email')} value={selectedCompany.email || t('admin.manageCompanies.notProvided')} href={selectedCompany.email ? `mailto:${selectedCompany.email}` : null} />
                    <DetailRow icon={FiPhone} label={t('admin.manageCompanies.phone')} value={selectedCompany.phone || t('admin.manageCompanies.notProvided')} href={selectedCompany.phone ? `tel:${selectedCompany.phone}` : null} />
                    <DetailRow icon={FiMapPin} label={t('admin.manageCompanies.regionLabel')} value={selectedCompany.location?.region || t('admin.manageCompanies.notProvided')} />
                    <DetailRow icon={FiMapPin} label={t('admin.manageCompanies.city')} value={selectedCompany.location?.city || t('admin.manageCompanies.notProvided')} />
                    <DetailRow icon={FiMapPin} label={t('admin.manageCompanies.addressLabel')} value={selectedCompany.location?.address || t('admin.manageCompanies.notProvided')} />
                  </div>
                </div>
              </div>

              {/* Social + Recruiter */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="card">
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">{t('admin.manageCompanies.socialPresence')}</h3>
                  <div className="mt-4 space-y-2">
                    {reviewSocials.length > 0 ? (
                      reviewSocials.map((s) => (
                        <a
                          key={s.key}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                        >
                          <s.icon className="h-4 w-4" />
                          <span>{s.label}</span>
                          <FiExternalLink className="ml-auto h-4 w-4 text-[var(--text-secondary)]" />
                        </a>
                      ))
                    ) : (
                      <p className="text-sm text-[var(--text-secondary)]">{t('admin.manageCompanies.notProvided')}</p>
                    )}
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">{t('admin.manageCompanies.recruiterContact')}</h3>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <DetailRow icon={FiUser} label={t('admin.manageCompanies.hrManager')} value={selectedCompany.recruiter?.hrManagerName || t('admin.manageCompanies.notProvided')} />
                    <DetailRow icon={FiShield} label={t('admin.manageCompanies.position')} value={selectedCompany.recruiter?.position || t('admin.manageCompanies.notProvided')} />
                    <DetailRow icon={FiMail} label={t('admin.manageCompanies.email')} value={selectedCompany.recruiter?.email || t('admin.manageCompanies.notProvided')} href={selectedCompany.recruiter?.email ? `mailto:${selectedCompany.recruiter.email}` : null} />
                    <DetailRow icon={FiPhone} label={t('admin.manageCompanies.phone')} value={selectedCompany.recruiter?.phone || t('admin.manageCompanies.notProvided')} href={selectedCompany.recruiter?.phone ? `tel:${selectedCompany.recruiter.phone}` : null} />
                  </div>
                </div>
              </div>

              {/* Verification Documents */}
              <div className="card">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">{t('admin.manageCompanies.verificationDocuments')}</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {REVIEW_DOC_TYPES.map((docType) => {
                    const label = t(`admin.manageCompanies.${docType}`);
                    const hasDoc = !!selectedCompany[docType];
                    const name = selectedCompany[`${docType}Name`];
                    const fileType = getFileTypeLabel(docType);
                    return (
                      <div key={docType} className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1769E0]/10 text-[#1769E0]">
                            <FiFileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
                            {hasDoc ? (
                              <>
                                <p className="mt-0.5 truncate text-sm text-[var(--text-secondary)]">{name}</p>
                                <p className="text-xs text-[var(--text-secondary)]">{fileType}</p>
                              </>
                            ) : (
                              <p className="mt-1 text-sm text-[var(--text-secondary)]">{t('admin.manageCompanies.notUploaded')}</p>
                            )}
                          </div>
                        </div>
                        {hasDoc ? (
                          <button
                            type="button"
                            onClick={() => openDocumentPreview(selectedCompany, docType)}
                            className="btn btn-outline mt-4 w-full"
                          >
                            <FiEye className="mr-2 h-4 w-4" />
                            {t('admin.manageCompanies.viewDocument')}
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Admin Decision */}
              <div className="card">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">{t('admin.manageCompanies.adminDecision')}</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">{t('admin.manageCompanies.currentStatusLabel')}</p>
                    <div className="mt-2">
                      <span className={`badge ${selectedType === 'approved' ? 'badge-success' : selectedType === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>{statusLabel(selectedCompany)}</span>
                    </div>
                  </div>

                  <label className="block">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{t('admin.manageCompanies.rejectionReason')}</span>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows="4"
                      placeholder={t('admin.manageCompanies.rejectionReasonPlaceholder')}
                      className="textarea mt-2"
                    />
                  </label>

                  <div className="flex flex-wrap justify-end gap-3">
                    <button type="button" onClick={() => setIsReviewOpen(false)} className="btn btn-outline">{t('admin.manageCompanies.close')}</button>
                    <button
                      type="button"
                      onClick={() => handleReject(selectedCompany._id, rejectionReason)}
                      className="btn btn-danger inline-flex items-center gap-2"
                    >
                      <FiX />
                      {t('admin.manageCompanies.reject')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleApprove(selectedCompany._id);
                        setIsReviewOpen(false);
                      }}
                      className="btn btn-primary inline-flex items-center gap-2"
                    >
                      <FiCheckCircle />
                      {t('admin.manageCompanies.approve')}
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
