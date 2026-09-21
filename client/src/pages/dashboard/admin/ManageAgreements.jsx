import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import agreementService from '../../../services/agreementService';
import toast from 'react-hot-toast';
import {
  FiFileText, FiPlus, FiEdit3, FiTrash2, FiEye, FiX,
  FiCheckCircle, FiAlertCircle, FiChevronDown
} from 'react-icons/fi';

const ManageAgreements = () => {
  const { t } = useTranslation();
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState(null);
  const [formData, setFormData] = useState({
    type: 'terms',
    title: '',
    description: '',
    content: '',
    status: 'inactive',
  });
  const [submitting, setSubmitting] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [viewAgreement, setViewAgreement] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      const response = await agreementService.getAll();
      setAgreements(response.data.data || []);
    } catch (error) {
      toast.error(t('admin.agreements.loadFailed') || 'Failed to load agreements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingAgreement(null);
    setFormData({
      type: 'terms',
      title: '',
      description: '',
      content: '',
      status: 'inactive',
    });
    setShowModal(true);
  };

  const handleEdit = (agreement) => {
    setEditingAgreement(agreement);
    setFormData({
      type: agreement.type,
      title: agreement.title,
      description: agreement.description,
      content: agreement.content,
      status: agreement.status,
    });
    setShowModal(true);
  };

  const handleViewContent = (agreement) => {
    setViewAgreement(agreement);
    setShowContentModal(true);
  };

  const handleDelete = (id) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingAgreement) {
        await agreementService.update(editingAgreement._id, formData);
        toast.success(t('admin.agreements.updateSuccess'));
      } else {
        await agreementService.create(formData);
        toast.success(t('admin.agreements.createSuccess'));
      }
      setShowModal(false);
      fetchAgreements();
    } catch (error) {
      toast.error(error.response?.data?.message || t('admin.agreements.createFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (agreement, newStatus) => {
    try {
      await agreementService.updateStatus(agreement._id, newStatus);
      toast.success(t('admin.agreements.statusUpdateSuccess'));
      fetchAgreements();
    } catch (error) {
      toast.error(error.response?.data?.message || t('admin.agreements.statusUpdateFailed'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await agreementService.delete(deletingId);
      toast.success(t('admin.agreements.deleteSuccess'));
      fetchAgreements();
    } catch (error) {
      toast.error(error.response?.data?.message || t('admin.agreements.deleteFailed'));
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeletingId(null);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAgreement(null);
    setFormData({
      type: 'terms',
      title: '',
      description: '',
      content: '',
      status: 'inactive',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeLabel = (type) => {
    return type === 'terms' ? t('admin.agreements.typeTerms') : t('admin.agreements.typePrivacy');
  };

  const getTypeBadgeClass = (type) => {
    return type === 'terms'
      ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
      : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300';
  };

  const getStatusBadgeClass = (status) => {
    return status === 'active'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#14231F] dark:text-white">
            {t('admin.agreements.title')}
          </h1>
          <p className="mt-1 text-sm text-[#64746E] dark:text-[#A9BBB4]">
            {t('admin.agreements.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1769E0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0D5BC4]"
        >
          <FiPlus className="h-4 w-4" />
          {t('admin.agreements.createAgreement')}
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#E1E8E4] dark:border-[#23483D] bg-white dark:bg-[#142A24] p-12 text-center">
          <div className="flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span className="h-4 w-4 rounded-full border-2 border-[#087F5B] border-t-transparent animate-spin" />
            <span>{t('admin.agreements.loading')}</span>
          </div>
        </div>
      ) : agreements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E1E8E4] dark:border-[#23483D] bg-white dark:bg-[#142A24] p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#F0F4F2] dark:bg-[#10231E] flex items-center justify-center mb-4">
            <FiFileText className="h-8 w-8 text-[#64746E] dark:text-[#A9BBB4]" />
          </div>
          <h3 className="text-lg font-semibold text-[#14231F] dark:text-white mb-2">
            {t('admin.agreements.emptyStateTitle')}
          </h3>
          <p className="text-sm text-[#64746E] dark:text-[#A9BBB4] max-w-md mx-auto">
            {t('admin.agreements.emptyStateDesc')}
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1769E0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0D5BC4] transition"
          >
            <FiPlus className="h-4 w-4" />
            {t('admin.agreements.createAgreement')}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E1E8E4] dark:border-[#23483D] bg-white dark:bg-[#142A24] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F8FAFC] dark:bg-[#142A24] border-b border-[#E1E8E4] dark:border-[#23483D]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64746E] dark:text-[#A9BBB4]">
                    {t('admin.agreements.agreementType')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64746E] dark:text-[#A9BBB4]">
                    {t('admin.agreements.agreementTitle')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64746E] dark:text-[#A9BBB4]">
                    {t('admin.agreements.description')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64746E] dark:text-[#A9BBB4]">
                    {t('admin.agreements.status')}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[#64746E] dark:text-[#A9BBB4]">
                    {t('admin.agreements.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E8E4] dark:divide-[#23483D]">
                {agreements.map((agreement) => (
                  <tr key={agreement._id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#142A24] transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeClass(agreement.type)}`}>
                        {getTypeLabel(agreement.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#14231F] dark:text-white truncate max-w-xs">{agreement.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[#64746E] dark:text-[#A9BBB4] truncate max-w-xs" title={agreement.description}>
                        {agreement.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(agreement.status)}`}>
                          {agreement.status === 'active' ? t('admin.agreements.active') : t('admin.agreements.inactive')}
                        </span>
                        {agreement.status === 'inactive' ? (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(agreement, 'active')}
                            className="text-sm text-[#1769E0] hover:underline font-medium"
                          >
                            {t('admin.agreements.activate')}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(agreement, 'inactive')}
                            className="text-sm text-slate-600 hover:underline font-medium"
                          >
                            {t('admin.agreements.deactivate')}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewContent(agreement)}
                          className="p-2 rounded-lg text-[#64746E] dark:text-[#A9BBB4] hover:bg-[#F0F4F2] dark:hover:bg-[#10231E] transition"
                          title={t('admin.agreements.viewFullContent')}
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(agreement)}
                          className="p-2 rounded-lg text-[#64746E] dark:text-[#A9BBB4] hover:bg-[#F0F4F2] dark:hover:bg-[#10231E] transition"
                          title={t('common.edit')}
                        >
                          <FiEdit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(agreement._id)}
                          className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition"
                          title={t('common.delete')}
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-[#142A24] shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E1E8E4] dark:border-[#23483D] px-6 py-4">
              <h2 className="text-lg font-semibold text-[#14231F] dark:text-white">
                {editingAgreement ? t('admin.agreements.editAgreement') : t('admin.agreements.createAgreement')}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 rounded-lg text-[#64746E] dark:text-[#A9BBB4] hover:bg-[#F0F4F2] dark:hover:bg-[#10231E] transition"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#64746E] dark:text-[#A9BBB4] mb-2">
                    {t('admin.agreements.agreementType')} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full rounded-xl border border-[#E1E8E4] dark:border-[#23483D] bg-white dark:bg-[#1E293B] px-4 py-3 text-sm text-[#14231F] dark:text-white focus:border-[#1769E0] focus:ring-2 focus:ring-[#DCEAFD] outline-none transition"
                  >
                    <option value="terms">{t('admin.agreements.typeTerms')}</option>
                    <option value="privacy">{t('admin.agreements.typePrivacy')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#64746E] dark:text-[#A9BBB4] mb-2">
                    {t('admin.agreements.agreementTitle')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={formData.type === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                    className="w-full rounded-xl border border-[#E1E8E4] dark:border-[#23483D] bg-white dark:bg-[#1E293B] px-4 py-3 text-sm text-[#14231F] dark:text-white focus:border-[#1769E0] focus:ring-2 focus:ring-[#DCEAFD] outline-none transition"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#64746E] dark:text-[#A9BBB4] mb-2">
                    {t('admin.agreements.description')} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('admin.agreements.descriptionPlaceholder')}
                    rows={3}
                    className="w-full rounded-xl border border-[#E1E8E4] dark:border-[#23483D] bg-white dark:bg-[#1E293B] px-4 py-3 text-sm text-[#14231F] dark:text-white focus:border-[#1769E0] focus:ring-2 focus:ring-[#DCEAFD] outline-none transition resize-none"
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#64746E] dark:text-[#A9BBB4] mb-2">
                    {t('admin.agreements.fullContent')} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder={t('admin.agreements.contentPlaceholder')}
                    rows={15}
                    className="w-full rounded-xl border border-[#E1E8E4] dark:border-[#23483D] bg-white dark:bg-[#1E293B] px-4 py-3 text-sm text-[#14231F] dark:text-white focus:border-[#1769E0] focus:ring-2 focus:ring-[#DCEAFD] outline-none transition resize-y font-mono text-sm"
                    spellCheck={false}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#64746E] dark:text-[#A9BBB4] mb-2">
                    {t('admin.agreements.status')}
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="active"
                        checked={formData.status === 'active'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="h-4 w-4 text-[#1769E0] border-[#E1E8E4] focus:ring-[#1769E0]"
                      />
                      <span className="text-sm text-[#14231F] dark:text-white">{t('admin.agreements.active')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="inactive"
                        checked={formData.status === 'inactive'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="h-4 w-4 text-[#1769E0] border-[#E1E8E4] focus:ring-[#1769E0]"
                      />
                      <span className="text-sm text-[#14231F] dark:text-white">{t('admin.agreements.inactive')}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-end border-t border-[#E1E8E4] dark:border-[#23483D] pt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-xl border border-[#E1E8E4] dark:border-[#23483D] bg-white dark:bg-[#1E293B] px-4 py-2.5 text-sm font-semibold text-[#64746E] dark:text-[#A9BBB4] transition hover:bg-[#F0F4F2] dark:hover:bg-[#10231E]"
                >
                  {t('admin.agreements.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#1769E0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0D5BC4] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? t('admin.agreements.saving') : t('admin.agreements.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Content Modal */}
      {showContentModal && viewAgreement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-[#142A24] shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E1E8E4] dark:border-[#23483D] px-6 py-4">
              <div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeClass(viewAgreement.type)} mb-2`}>
                  {getTypeLabel(viewAgreement.type)}
                </span>
                <h2 className="text-lg font-semibold text-[#14231F] dark:text-white">{viewAgreement.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowContentModal(false)}
                className="p-2 rounded-lg text-[#64746E] dark:text-[#A9BBB4] hover:bg-[#F0F4F2] dark:hover:bg-[#10231E] transition"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap font-mono text-sm text-[#374151] dark:text-[#D1D5DB] leading-relaxed">
                  {viewAgreement.content}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E1E8E4] dark:border-[#23483D] flex items-center justify-between text-sm text-[#64746E] dark:text-[#A9BBB4]">
                <span>{t('admin.agreements.version')} {viewAgreement.version || 1}</span>
                <span>{t('admin.agreements.lastUpdated')} {formatDate(viewAgreement.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#142A24] shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                <FiAlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#14231F] dark:text-white">
                {t('admin.agreements.deleteTitle')}
              </h3>
            </div>
            <p className="text-sm text-[#64746E] dark:text-[#A9BBB4] mb-6">
              {t('admin.agreements.deleteConfirm')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setDeletingId(null); }}
                className="rounded-xl border border-[#E1E8E4] dark:border-[#23483D] bg-white dark:bg-[#1E293B] px-4 py-2.5 text-sm font-semibold text-[#64746E] dark:text-[#A9BBB4] transition hover:bg-[#F0F4F2] dark:hover:bg-[#10231E]"
              >
                {t('admin.agreements.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : t('admin.agreements.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAgreements;