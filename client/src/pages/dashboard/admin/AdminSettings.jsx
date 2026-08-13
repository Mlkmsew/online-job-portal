import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  FiUser,
  FiBell,
  FiCamera,
  FiTrash2,
  FiKey,
  FiX,
  FiLock,
  FiCheckCircle,
  FiSave,
} from 'react-icons/fi';
import {
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  updateSettings,
  updatePassword,
} from '../../../store/slices/authSlice';

const NOTIFICATION_ITEMS = [
  { key: 'email', title: 'Email Alerts', desc: 'Receive job updates and newsletters by email.' },
  { key: 'inapp', title: 'In-App Notifications', desc: 'Get real-time alerts inside the app.' },
  { key: 'match', title: 'Job Match Alerts', desc: 'Relevant job matches sent to you.' },
  { key: 'application', title: 'Application Status', desc: 'Updates about submitted applications.' },
  { key: 'interview', title: 'Interview Reminders', desc: 'Reminders for scheduled interviews.' },
];

const phoneIsValid = (phone) => {
  if (!phone) return true;
  return /^\+?[0-9]{7,15}$/.test(phone);
};

const AdminSettings = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  // ── Account form ───────────────────────────────────────────────────────
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

  // ── Notification preferences (loaded from DB user.settings.notifications)
  const [notifications, setNotifications] = useState({
    email: true,
    inapp: true,
    match: true,
    application: true,
    interview: true,
  });
  const [togglingKey, setTogglingKey] = useState(null);

  useEffect(() => {
    const n = user?.settings?.notifications || {};
    setNotifications({
      email: n.email ?? n.email_alerts ?? true,
      inapp: n.inapp ?? n.in_app_notifications ?? true,
      match: n.match ?? n.job_match_alerts ?? true,
      application: n.application ?? n.application_status ?? true,
      interview: n.interview ?? n.interview_reminders ?? true,
    });
  }, [user]);

  // ── Change password modal ──────────────────────────────────────────────
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  // ── Scroll to #notifications anchor (avatar dropdown "Notification Settings")
  useEffect(() => {
    if (location.hash === '#notifications') {
      const el = document.getElementById('notifications');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [location.hash]);

  // ── Account save ───────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!phoneIsValid(phone)) {
      toast.error(t('admin.settings.invalidPhone', { defaultValue: 'Please enter a valid phone number (7-15 digits, optional +).' }));
      return;
    }
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (!trimmedFirst || !trimmedLast) {
      toast.error(t('admin.profile.nameRequired', { defaultValue: 'First and last name are required.' }));
      return;
    }

    setSaving(true);
    try {
      await dispatch(updateProfile({ firstName: trimmedFirst, lastName: trimmedLast, phone: phone.trim() })).unwrap();
      toast.success(t('admin.settings.saveSuccess', { defaultValue: 'Changes saved successfully.' }));
    } catch (err) {
      toast.error(err || t('admin.settings.saveFailed', { defaultValue: 'Unable to save changes. Please try again.' }));
    } finally {
      setSaving(false);
    }
  };

  // ── Avatar handlers ────────────────────────────────────────────────────
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

  // ── Notification toggle (auto-save to DB) ──────────────────────────────
  const handleToggle = async (key) => {
    if (togglingKey === key) return;
    const previousState = { ...notifications };
    const newValue = !notifications[key];

    const updated = {
      ...notifications,
      [key]: newValue,
      ...(key === 'email' ? { email: newValue, email_alerts: newValue } : {}),
      ...(key === 'inapp' ? { inapp: newValue, in_app_notifications: newValue } : {}),
      ...(key === 'match' ? { match: newValue, job_match_alerts: newValue } : {}),
      ...(key === 'application' ? { application: newValue, application_status: newValue } : {}),
      ...(key === 'interview' ? { interview: newValue, interview_reminders: newValue } : {}),
    };

    setNotifications(updated);
    setTogglingKey(key);

    try {
      await dispatch(updateSettings({ notifications: updated })).unwrap();
      toast.success(t('admin.settings.notificationSaved', { defaultValue: 'Notification preference saved.' }));
    } catch {
      setNotifications(previousState);
      toast.error(t('admin.settings.toggleFailed', { defaultValue: 'Unable to save notification preference. Please try again.' }));
    } finally {
      setTogglingKey(null);
    }
  };

  // ── Change password ────────────────────────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword) {
      toast.error(t('admin.settings.currentPasswordRequired', { defaultValue: 'Please enter your current password.' }));
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error(t('admin.settings.weakPassword', { defaultValue: 'New password must be at least 6 characters long.' }));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('admin.settings.passwordMismatch', { defaultValue: 'Confirm password does not match new password.' }));
      return;
    }

    setPasswordSaving(true);
    try {
      await dispatch(updatePassword({ currentPassword, newPassword })).unwrap();
      toast.success(t('admin.settings.passwordUpdated', { defaultValue: 'Password updated successfully!' }));
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordModal(false);
    } catch (err) {
      toast.error(err || t('admin.settings.passwordUpdateFailed', { defaultValue: 'Failed to update password. Check current password.' }));
    } finally {
      setPasswordSaving(false);
    }
  };

  const getInitials = (user) =>
    `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`.toUpperCase() || 'AU';

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="card">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          {t('admin.settings.title', { defaultValue: 'Account Settings' })}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {t('admin.settings.subtitle', { defaultValue: 'Manage your admin account, notification preferences and security.' })}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* ── Left column: Avatar + Account ────────────────────────────── */}
        <div className="space-y-6">
          <div className="card flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-2xl font-bold text-white shadow-lg">
                {user?.avatar ? (
                  <img src={user.avatar} alt={`${user?.firstName || ''} ${user?.lastName || ''}`} className="h-full w-full object-cover" />
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
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {`${firstName} ${lastName}`.trim() || 'Admin User'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email || ''}</p>
            </div>

            {avatarUploading && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('admin.profile.uploading', { defaultValue: 'Uploading...' })}
              </p>
            )}

            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={avatarUploading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <FiCamera className="h-3.5 w-3.5 text-emerald-600" />
                {user?.avatar
                  ? t('admin.settings.replacePhoto', { defaultValue: 'Replace Photo' })
                  : t('admin.settings.uploadPhoto', { defaultValue: 'Upload Photo' })}
              </button>
              {user?.avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={avatarUploading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10"
                >
                  <FiTrash2 className="h-3.5 w-3.5" />
                  {t('admin.profile.removePicture', { defaultValue: 'Remove picture' })}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Right column: Account info + Notifications + Security ────── */}
        <div className="space-y-6">
          {/* Account information */}
          <div className="card">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <FiUser className="h-5 w-5 text-emerald-600" />
              {t('admin.settings.accountInfo', { defaultValue: 'Account Information' })}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="settings-first-name" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('admin.profile.firstName', { defaultValue: 'First Name' })}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="settings-first-name"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="input w-full"
                    maxLength={50}
                  />
                </div>
                <div>
                  <label htmlFor="settings-last-name" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('admin.profile.lastName', { defaultValue: 'Last Name' })}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="settings-last-name"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="input w-full"
                    maxLength={50}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="settings-phone" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('admin.profile.phone', { defaultValue: 'Phone' })}
                </label>
                <input
                  id="settings-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input w-full"
                  placeholder="+251..."
                  aria-invalid={!phoneIsValid(phone)}
                />
                {!phoneIsValid(phone) && (
                  <p className="mt-1 text-xs font-medium text-rose-600">
                    {t('admin.settings.invalidPhone', { defaultValue: 'Please enter a valid phone number (7-15 digits, optional +).' })}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="settings-email" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('admin.profile.email', { defaultValue: 'Email' })}
                </label>
                <input
                  id="settings-email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input w-full cursor-not-allowed bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                />
              </div>

              <div className="flex justify-end border-t border-gray-100 pt-4 dark:border-gray-700">
                <button type="submit" disabled={saving} className="btn btn-primary min-w-[160px]">
                  {saving ? (
                    <>
                      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      {t('admin.settings.saving', { defaultValue: 'Saving...' })}
                    </>
                  ) : (
                    <>
                      <FiSave className="mr-2 h-4 w-4" />
                      {t('admin.settings.saveChanges', { defaultValue: 'Save Changes' })}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Notification preferences */}
          <div className="card" id="notifications">
            <h2 className="mb-1.5 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <FiBell className="h-5 w-5 text-emerald-600" />
              {t('admin.settings.notificationPreferences', { defaultValue: 'Notification Preferences' })}
            </h2>
            <p className="mb-5 text-sm text-gray-600 dark:text-gray-400">
              {t('admin.settings.notificationSubtitle', { defaultValue: 'Manage real-time alerts and communication channels.' })}
            </p>

            <div className="space-y-3">
              {NOTIFICATION_ITEMS.map((item) => {
                const on = !!notifications[item.key];
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/60"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                    </div>
                    <label htmlFor={`admin-toggle-${item.key}`} className="relative inline-flex cursor-pointer items-center">
                      <input
                        id={`admin-toggle-${item.key}`}
                        type="checkbox"
                        className="sr-only"
                        checked={on}
                        disabled={togglingKey === item.key}
                        onChange={() => handleToggle(item.key)}
                      />
                      <span
                        className={`inline-block h-6 w-11 rounded-full transition-colors ${
                          on ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                        aria-hidden="true"
                      />
                      <span
                        className={`absolute left-0 top-0 mt-0.5 ml-0.5 inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          on ? 'translate-x-5' : 'translate-x-0'
                        }`}
                        aria-hidden="true"
                      />
                    </label>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-500">
              <FiCheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              {t('admin.settings.autoSaveNotice', { defaultValue: 'Preferences auto-save directly to your database profile.' })}
            </p>
          </div>

          {/* Security */}
          <div className="card">
            <h2 className="mb-1.5 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <FiLock className="h-5 w-5 text-emerald-600" />
              {t('admin.settings.security', { defaultValue: 'Security' })}
            </h2>
            <p className="mb-5 text-sm text-gray-600 dark:text-gray-400">
              {t('admin.settings.securitySubtitle', { defaultValue: 'Update your account password to keep your account secure.' })}
            </p>

            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <FiKey className="h-4 w-4 text-emerald-600" />
              {t('admin.settings.changePassword', { defaultValue: 'Change Password' })}
            </button>
          </div>
        </div>
      </div>

      {/* ── Change password modal ──────────────────────────────────────── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-700">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-500/10">
                  <FiLock className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {t('admin.settings.changePasswordModalTitle', { defaultValue: 'Change Password' })}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
                aria-label={t('common.close', { defaultValue: 'Close' })}
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="admin-current-password" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('admin.settings.currentPassword', { defaultValue: 'Current Password' })}
                </label>
                <input
                  id="admin-current-password"
                  type="password"
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label htmlFor="admin-new-password" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('admin.settings.newPassword', { defaultValue: 'New Password' })}
                </label>
                <input
                  id="admin-new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label htmlFor="admin-confirm-password" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('admin.settings.confirmPassword', { defaultValue: 'Confirm Password' })}
                </label>
                <input
                  id="admin-confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="btn btn-secondary"
                >
                  {t('common.cancel', { defaultValue: 'Cancel' })}
                </button>
                <button type="submit" disabled={passwordSaving} className="btn btn-primary">
                  {passwordSaving && <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                  {passwordSaving
                    ? t('admin.settings.updatingPassword', { defaultValue: 'Updating...' })
                    : t('admin.settings.updatePassword', { defaultValue: 'Update Password' })}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
