import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiCamera, FiTrash2, FiCheckCircle, FiSave } from 'react-icons/fi';
import { updateProfile, uploadAvatar, deleteAvatar } from '../../../store/slices/authSlice';

const getInitials = (user) =>
  `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`.toUpperCase() || 'AU';

const AdminProfile = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const fullName = `${firstName} ${lastName}`.trim() || 'Admin User';

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (!trimmedFirst || !trimmedLast) {
      toast.error(t('admin.profile.nameRequired', { defaultValue: 'First and last name are required.' }));
      return;
    }

    setSaving(true);
    try {
      await dispatch(updateProfile({ firstName: trimmedFirst, lastName: trimmedLast, phone: phone.trim() })).unwrap();
      toast.success(t('admin.profile.saveSuccess', { defaultValue: 'Profile updated successfully.' }));
    } catch (err) {
      toast.error(err || t('admin.profile.saveFailed', { defaultValue: 'Unable to update profile. Please try again.' }));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      toast.error(t('admin.profile.invalidImage', { defaultValue: 'Only JPG, JPEG, PNG, and WEBP images are allowed.' }));
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setAvatarUploading(true);
    try {
      await dispatch(uploadAvatar(formData)).unwrap();
      toast.success(t('admin.profile.avatarUpdated', { defaultValue: 'Profile picture updated.' }));
    } catch (err) {
      toast.error(err || t('admin.profile.avatarFailed', { defaultValue: 'Unable to upload picture. Please try again.' }));
    } finally {
      setAvatarUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (avatarUploading) return;
    setAvatarUploading(true);
    try {
      await dispatch(deleteAvatar()).unwrap();
      toast.success(t('admin.profile.avatarRemoved', { defaultValue: 'Profile picture removed.' }));
    } catch (err) {
      toast.error(err || t('admin.profile.avatarFailed', { defaultValue: 'Unable to remove picture. Please try again.' }));
    } finally {
      setAvatarUploading(false);
    }
  };

  const roleLabel = t('roles.admin', { defaultValue: 'Admin' });

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="card">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          {t('admin.profile.title', { defaultValue: 'My Profile' })}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {t('admin.profile.subtitle', { defaultValue: 'Manage your admin account details.' })}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* ── Avatar card ──────────────────────────────────────────────── */}
        <div className="card flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-2xl font-bold text-white shadow-lg">
              {user?.avatar ? (
                <img src={user.avatar} alt={fullName} className="h-full w-full object-cover" />
              ) : (
                <span>{getInitials(user)}</span>
              )}
            </span>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow transition hover:bg-emerald-700 disabled:opacity-50 dark:border-gray-900"
              aria-label={t('admin.profile.changePicture', { defaultValue: 'Change profile picture' })}
            >
              <FiCamera className="h-4 w-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" />
          </div>

          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{fullName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email || ''}</p>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <FiCheckCircle className="h-3.5 w-3.5" />
            {roleLabel}
          </span>

          {avatarUploading && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('admin.profile.uploading', { defaultValue: 'Uploading...' })}
            </p>
          )}

          {user?.avatar && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              disabled={avatarUploading}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 transition hover:text-rose-700 disabled:opacity-50 dark:text-rose-400"
            >
              <FiTrash2 className="h-4 w-4" />
              {t('admin.profile.removePicture', { defaultValue: 'Remove picture' })}
            </button>
          )}
        </div>

        {/* ── Account info form ────────────────────────────────────────── */}
        <div className="card">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <FiUser className="h-5 w-5 text-emerald-600" />
            {t('admin.profile.accountInfo', { defaultValue: 'Account Information' })}
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="profile-first-name" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('admin.profile.firstName', { defaultValue: 'First Name' })}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="profile-first-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input w-full"
                  maxLength={50}
                />
              </div>
              <div>
                <label htmlFor="profile-last-name" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('admin.profile.lastName', { defaultValue: 'Last Name' })}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="profile-last-name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input w-full"
                  maxLength={50}
                />
              </div>
            </div>

            <div className="relative">
              <label htmlFor="profile-phone" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('admin.profile.phone', { defaultValue: 'Phone' })}
              </label>
              <FiPhone className="pointer-events-none absolute left-3.5 top-[38px] h-4 w-4 text-gray-400" />
              <input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input w-full pl-10"
                placeholder="+251..."
              />
            </div>

            <div>
              <label htmlFor="profile-email" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('admin.profile.email', { defaultValue: 'Email' })}
              </label>
              <div className="relative">
                <FiMail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="profile-email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input w-full cursor-not-allowed bg-gray-50 pl-10 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {t('admin.profile.emailNote', { defaultValue: 'Contact support to change your account email.' })}
              </p>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-4 dark:border-gray-700">
              <button type="submit" disabled={saving} className="btn btn-primary min-w-[160px]">
                {saving ? (
                  <>
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    {t('admin.profile.saving', { defaultValue: 'Saving...' })}
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2 h-4 w-4" />
                    {t('admin.profile.saveChanges', { defaultValue: 'Save Changes' })}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
