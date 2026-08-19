import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiLayers,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  fetchAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../../store/slices/adminSlice';

const normalize = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const ManageCategories = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { categories, loading } = useSelector((state) => state.admin);

  // ── Create form state ────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Search ───────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');

  // ── Edit state ───────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // ── Delete state ─────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminCategories());
  }, [dispatch]);

  const categoryExists = (value, excludeId) =>
    categories.some(
      (c) => c._id !== excludeId && normalize(c.name).toLowerCase() === value.toLowerCase()
    );

  const getFriendlyError = (err, fallback) => {
    const message = typeof err === 'string' ? err : err?.message;
    if (!message || /network|timeout|failed to fetch|econnaborted|request failed/i.test(message)) {
      return fallback;
    }
    return message;
  };

  // ── Create ───────────────────────────────────────────────────────────────
  const handleCreate = async (event) => {
    event.preventDefault();
    setFormError('');

    const trimmedName = normalize(name);
    if (!trimmedName) {
      setFormError(t('admin.categories.nameRequired', { defaultValue: 'Category name is required.' }));
      return;
    }
    if (categoryExists(trimmedName)) {
      setFormError(t('admin.categories.duplicateName', { defaultValue: 'This category already exists.' }));
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(createCategory({ name: trimmedName, description: description.trim() })).unwrap();
      toast.success(t('admin.categories.createSuccess', { defaultValue: 'Category created successfully.' }));
      setName('');
      setDescription('');
    } catch (error) {
      toast.error(
        getFriendlyError(error, t('admin.categories.createFailed', { defaultValue: 'Unable to create category. Please try again.' }))
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelCreate = () => {
    if (submitting) return;
    setName('');
    setDescription('');
    setFormError('');
  };

  // ── Edit ─────────────────────────────────────────────────────────────────
  const openEdit = (category) => {
    setEditing(category);
    setEditName(category.name || '');
    setEditDescription(category.description || '');
    setEditError('');
  };

  const closeEdit = () => {
    if (savingEdit) return;
    setEditing(null);
    setEditError('');
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();
    if (!editing) return;
    setEditError('');

    const trimmedName = normalize(editName);
    if (!trimmedName) {
      setEditError(t('admin.categories.nameRequired', { defaultValue: 'Category name is required.' }));
      return;
    }
    if (categoryExists(trimmedName, editing._id)) {
      setEditError(t('admin.categories.duplicateName', { defaultValue: 'This category already exists.' }));
      return;
    }

    setSavingEdit(true);
    try {
      await dispatch(
        updateCategory({ id: editing._id, name: trimmedName, description: editDescription.trim() })
      ).unwrap();
      toast.success(t('admin.categories.updateSuccess', { defaultValue: 'Category updated successfully.' }));
      setEditing(null);
    } catch (error) {
      toast.error(
        getFriendlyError(error, t('admin.categories.updateFailed', { defaultValue: 'Unable to update category. Please try again.' }))
      );
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const openDelete = (category) => {
    setDeleteTarget(category);
    setDeleteError('');
  };

  const closeDelete = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError('');
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleteError('');

    setDeleting(true);
    try {
      await dispatch(deleteCategory(deleteTarget._id)).unwrap();
      toast.success(t('admin.categories.deleteSuccess', { defaultValue: 'Category deleted successfully.' }));
      setDeleteTarget(null);
    } catch (error) {
      // Backend returns a clear message when the category is in use by jobs.
      setDeleteError(
        getFriendlyError(error, t('admin.categories.deleteFailed', { defaultValue: 'Unable to delete category. Please try again.' }))
      );
    } finally {
      setDeleting(false);
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((category) =>
      `${category.name || ''} ${category.description || ''}`.toLowerCase().includes(query)
    );
  }, [categories, search]);

  const displayDescription = (category) => {
    const text = String(category?.description || '').trim();
    return text || t('admin.categories.noDescription', { defaultValue: 'No description available.' });
  };

  const FieldError = ({ message }) =>
    message ? (
      <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-600">
        <FiAlertTriangle className="h-4 w-4 shrink-0" />
        {message}
      </p>
    ) : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {t('admin.categories.title', { defaultValue: 'Manage Categories' })}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {t('admin.categories.subtitle', { defaultValue: 'Organize job categories and skill taxonomies for better search results.' })}
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.categories.searchPlaceholder', { defaultValue: 'Search categories...' })}
            className="input w-full pl-10"
            aria-label={t('admin.categories.searchPlaceholder', { defaultValue: 'Search categories...' })}
          />
        </div>
      </div>

      {/* ── Add New Category form ───────────────────────────────────────── */}
      <div className="card">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            <FiLayers className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('admin.categories.addNewCategory', { defaultValue: 'Add New Category' })}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('admin.categories.addNewSubtitle', { defaultValue: 'Create a category to group related job postings.' })}
            </p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-4" noValidate>
          <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <label htmlFor="category-name" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('admin.categories.categoryName', { defaultValue: 'Category Name' })}{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                id="category-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('admin.categories.enterName', { defaultValue: 'Enter category name' })}
                className="input w-full"
                maxLength={100}
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="category-description" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('admin.categories.categoryDescription', { defaultValue: 'Category Description' })}
              </label>
              <textarea
                id="category-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('admin.categories.descriptionPlaceholder', { defaultValue: 'Describe this job category, the types of jobs it includes, and relevant skills...' })}
                rows={2}
                maxLength={1000}
                className="textarea w-full resize-none"
                disabled={submitting}
              />
            </div>
          </div>

          <FieldError message={formError} />

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
            <button
              type="button"
              onClick={handleCancelCreate}
              disabled={submitting}
              className="btn btn-secondary"
            >
              {t('admin.categories.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary min-w-[150px]">
              {submitting ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  {t('admin.categories.adding', { defaultValue: 'Adding Category...' })}
                </>
              ) : (
                <>
                  <FiCheckCircle className="mr-2 h-4 w-4" />
                  {t('admin.categories.addCategory', { defaultValue: 'Add Category' })}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Category grid ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="card flex items-center justify-center gap-3 py-10 text-gray-500 dark:text-gray-400">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600/30 border-t-emerald-600" />
          {t('admin.categories.loading', { defaultValue: 'Loading categories...' })}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-2 py-12 text-center">
          <FiXCircle className="h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {search
              ? t('admin.categories.noSearchResults', { defaultValue: 'No categories match your search.' })
              : t('admin.categories.noCategories', { defaultValue: 'No categories found.' })}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => (
            <article key={category._id} className="card flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                  style={{ backgroundColor: `${category.color || '#0F766E'}1A`, color: category.color || '#0F766E' }}
                >
                  {category.icon && category.icon !== 'briefcase' ? (
                    category.icon
                  ) : (
                    <FiLayers className="h-5 w-5" />
                  )}
                </span>
              </div>

              <h2 className="mt-3 text-lg font-semibold leading-snug text-gray-900 dark:text-white">
                {category.name}
              </h2>
              <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {displayDescription(category)}
              </p>

              <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3.5 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => openEdit(category)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#1769E0] hover:bg-[#EAF2FE] hover:text-[#1769E0] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-emerald-300"
                >
                  <FiEdit2 className="h-4 w-4" />
                  {t('admin.categories.editCategory', { defaultValue: 'Edit' })}
                </button>
                <button
                  type="button"
                  onClick={() => openDelete(category)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 dark:border-gray-700 dark:bg-gray-800 dark:text-rose-400 dark:hover:bg-rose-500/10"
                >
                  <FiTrash2 className="h-4 w-4" />
                  {t('admin.categories.delete', { defaultValue: 'Delete' })}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ── Edit modal ───────────────────────────────────────────────────── */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeEdit();
          }}
        >
          <div className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <FiEdit2 className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('admin.categories.editTitle', { defaultValue: 'Edit Category' })}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                disabled={savingEdit}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                aria-label={t('admin.categories.cancel', { defaultValue: 'Cancel' })}
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="edit-category-name" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('admin.categories.categoryName', { defaultValue: 'Category Name' })}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-category-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={t('admin.categories.enterName', { defaultValue: 'Enter category name' })}
                  className="input w-full"
                  maxLength={100}
                  disabled={savingEdit}
                />
              </div>

              <div>
                <label htmlFor="edit-category-description" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('admin.categories.categoryDescription', { defaultValue: 'Category Description' })}
                </label>
                <textarea
                  id="edit-category-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder={t('admin.categories.descriptionPlaceholder', { defaultValue: 'Describe this job category, the types of jobs it includes, and relevant skills...' })}
                  rows={4}
                  maxLength={1000}
                  className="textarea w-full resize-none"
                  disabled={savingEdit}
                />
              </div>

              <FieldError message={editError} />

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
                <button type="button" onClick={closeEdit} disabled={savingEdit} className="btn btn-secondary">
                  {t('admin.categories.cancel', { defaultValue: 'Cancel' })}
                </button>
                <button type="submit" disabled={savingEdit} className="btn btn-primary min-w-[140px]">
                  {savingEdit ? (
                    <>
                      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      {t('admin.categories.saving', { defaultValue: 'Saving...' })}
                    </>
                  ) : (
                    t('admin.categories.saveChanges', { defaultValue: 'Save Changes' })
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ────────────────────────────────────── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeDelete();
          }}
        >
          <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                <FiTrash2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('admin.categories.deleteTitle', { defaultValue: 'Delete Category?' })}
                </h2>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{deleteTarget.name}</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              {t('admin.categories.deleteConfirm', { defaultValue: 'Are you sure you want to delete this category? This action cannot be undone.' })}
            </p>

            {deleteError && (
              <p className="mt-4 flex items-start gap-1.5 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {deleteError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={closeDelete} disabled={deleting} className="btn btn-secondary">
                {t('admin.categories.cancel', { defaultValue: 'Cancel' })}
              </button>
              <button type="button" onClick={handleDelete} disabled={deleting} className="btn btn-danger min-w-[150px]">
                {deleting ? (
                  <>
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    {t('admin.categories.deleting', { defaultValue: 'Deleting...' })}
                  </>
                ) : (
                  t('admin.categories.deleteCategory', { defaultValue: 'Delete Category' })
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCategories;
