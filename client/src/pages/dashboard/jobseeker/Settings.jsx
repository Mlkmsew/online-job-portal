import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FiBell, FiUser, FiCamera, FiTrash2, FiKey, FiX, FiCheckCircle, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { uploadAvatar, deleteAvatar, updateProfile, updateSettings, updatePassword } from '../../../store/slices/authSlice';

const NOTIFICATION_ITEMS = [
  { key: 'email', title: 'Email Alerts', desc: 'Receive job updates and newsletters by email.' },
  { key: 'inapp', title: 'In-App Notifications', desc: 'Get real-time alerts inside the app.' },
  { key: 'match', title: 'Job Match Alerts', desc: 'Relevant job matches sent to you.' },
  { key: 'application', title: 'Application Status', desc: 'Updates about your submitted applications.' },
  { key: 'interview', title: 'Interview Reminders', desc: 'Reminders for scheduled interviews.' },
];

const phoneIsValid = (phone) => {
  if (!phone) return true;
  return /^\+?[0-9]{7,15}$/.test(phone);
};

const Settings = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth) || {};

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Sync form states with logged-in user from DB / Redux
  useEffect(() => {
    if (user) {
      setFullName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
      setPhone(user.phone || '');
    }
  }, [user]);

  // Notifications state (loads directly from DB user.settings.notifications)
  const [notifications, setNotifications] = useState({
    email: true,
    inapp: true,
    match: true,
    application: true,
    interview: false,
  });

  const [togglingKey, setTogglingKey] = useState(null);

  useEffect(() => {
    if (user?.settings?.notifications) {
      const n = user.settings.notifications;
      setNotifications({
        email_alerts: n.email_alerts ?? n.email ?? true,
        email: n.email ?? n.email_alerts ?? true,
        in_app_notifications: n.in_app_notifications ?? n.inapp ?? true,
        inapp: n.inapp ?? n.in_app_notifications ?? true,
        job_match_alerts: n.job_match_alerts ?? n.match ?? true,
        match: n.match ?? n.job_match_alerts ?? true,
        application_status: n.application_status ?? n.application ?? true,
        application: n.application ?? n.application_status ?? true,
        interview_reminders: n.interview_reminders ?? n.interview ?? true,
        interview: n.interview ?? n.interview_reminders ?? true,
      });
    }
  }, [user]);

  // Change Password Modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const fileRef = useRef(null);

  /* ── 1. Notification Toggle Handler with Rollback & Duplicate Prevention ── */
  const handleToggle = async (key) => {
    if (togglingKey === key) return; // Prevent duplicate rapid requests
    const previousState = { ...notifications };
    const newValue = !notifications[key];

    const updated = {
      ...notifications,
      [key]: newValue,
      ...(key === 'email' || key === 'email_alerts' ? { email: newValue, email_alerts: newValue } : {}),
      ...(key === 'inapp' || key === 'in_app_notifications' ? { inapp: newValue, in_app_notifications: newValue } : {}),
      ...(key === 'match' || key === 'job_match_alerts' ? { match: newValue, job_match_alerts: newValue } : {}),
      ...(key === 'application' || key === 'application_status' ? { application: newValue, application_status: newValue } : {}),
      ...(key === 'interview' || key === 'interview_reminders' ? { interview: newValue, interview_reminders: newValue } : {}),
    };

    setNotifications(updated);
    setTogglingKey(key);

    try {
      await dispatch(updateSettings({ notifications: updated })).unwrap();
    } catch (err) {
      setNotifications(previousState);
      toast.error(t('settings.toggleFailed') || 'Unable to save notification preference. Please try again.');
    } finally {
      setTogglingKey(null);
    }
  };

  /* ── 2. Photo Upload Handler (JPG, JPEG, PNG validation) ── */
  const handlePickPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image format
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      toast.error(t('settings.invalidImageType', { defaultValue: 'Only JPG, JPEG, and PNG images are allowed.' }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('settings.photoTooLarge') || 'Photo size must be less than 2MB.');
      return;
    }

    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      await dispatch(uploadAvatar(fd)).unwrap();
      toast.success(t('settings.photoUploaded') || 'Profile photo updated successfully!');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : t('settings.photoUploadFailed') || 'Failed to upload profile photo.');
    } finally {
      setAvatarUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  /* ── 3. Photo Delete Handler ── */
  const handleDeletePhoto = async () => {
    if (!window.confirm(t('settings.confirmRemovePhoto', { defaultValue: 'Are you sure you want to remove your profile photo?' }))) return;
    setAvatarUploading(true);
    try {
      await dispatch(deleteAvatar()).unwrap();
      toast.success(t('settings.photoDeleted') || 'Profile photo removed successfully.');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : t('settings.photoDeleteFailed') || 'Failed to remove photo.');
    } finally {
      setAvatarUploading(false);
    }
  };

  /* ── 4. Account Save Changes Handler ── */
  const handleSave = async (e) => {
    e?.preventDefault();
    if (!phoneIsValid(phone)) {
      toast.error(t('settings.invalidPhone') || 'Please enter a valid phone number (7-15 digits, optional +).');
      return;
    }

    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    setSaving(true);
    try {
      await dispatch(
        updateProfile({
          firstName,
          lastName,
          phone,
        })
      ).unwrap();
      toast.success(t('settings.savedSuccess') || 'Changes saved successfully');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : t('settings.saveFailed') || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  /* ── 5. Change Password Modal Submit Handler ── */
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword) {
      toast.error(t('auth.passwordRequired') || 'Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error(t('auth.weakPassword') || 'New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('auth.passwordMismatch') || 'Confirm password does not match new password.');
      return;
    }

    setPasswordSaving(true);
    try {
      await dispatch(updatePassword({ currentPassword, newPassword })).unwrap();
      toast.success(t('settings.passwordUpdated') || 'Password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordModal(false);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : t('settings.passwordUpdateFailed') || 'Failed to update password. Check current password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-start justify-center py-8 px-4">
      <div className="w-full max-w-6xl grid gap-8 md:grid-cols-2">

        {/* ═════════════════════════════════════════════════════════════════════
            1. ACCOUNT SECTION
           ═════════════════════════════════════════════════════════════════════ */}
        <section className="bg-white dark:bg-gray-800 rounded-[12px] shadow-sm border border-slate-200 dark:border-gray-700 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                  <FiUser className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('nav.settings') || 'Account Settings'}</h3>
                  <p className="text-xs text-slate-500">{t('settings.accountSubtitle') || 'Manage your profile details and security.'}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Photo Upload & Preview */}
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <div className="relative w-28 h-28 rounded-full bg-slate-100 dark:bg-gray-900 overflow-hidden flex items-center justify-center border-2 border-blue-500/30 shadow-inner">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={t('settings.profileAvatarAlt', { defaultValue: 'Profile Avatar' })} className="w-full h-full object-cover" />
                  ) : (
                    <FiUser className="w-12 h-12 text-slate-400" />
                  )}
                  {avatarUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handlePickPhoto}
                  className="hidden"
                />

                <div className="flex flex-col gap-1.5 w-full mt-1">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={avatarUploading}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition shadow-sm"
                  >
                    <FiCamera className="w-3.5 h-3.5 text-blue-600" />
                    {user?.avatar ? t('settings.replacePhoto') || 'Replace Photo' : t('settings.uploadPhoto') || 'Upload Photo'}
                  </button>
                  {user?.avatar && (
                    <button
                      type="button"
                      onClick={handleDeletePhoto}
                      disabled={avatarUploading}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50/60 hover:bg-rose-100 disabled:opacity-50 transition"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" /> {t('common.delete') || 'Remove'}
                    </button>
                  )}
                </div>
              </div>

              {/* Form Input Fields */}
              <div className="flex-1 w-full space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('auth.email') || 'Email Address'}</label>
                  <div className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 select-none">
                    {user?.email || t('settings.notAvailable', { defaultValue: 'Not available' })}
                  </div>
                </div>

                <div>
                  <label htmlFor="fullname" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 mb-1">
                    {t('auth.name', { defaultValue: 'Full Name' })}
                  </label>
                  <input
                    id="fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('settings.fullNamePlaceholder', { defaultValue: 'Enter full name' })}
                    className="block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 mb-1">
                    {t('contact.info.phoneLabel') || 'Phone Number'}
                  </label>
                  <input
                    id="phone"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('settings.phonePlaceholder', { defaultValue: '+251912345678' })}
                    className="block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                    aria-invalid={!phoneIsValid(phone)}
                  />
                  {!phoneIsValid(phone) && <p className="mt-1 text-xs text-rose-600 font-medium">{t('settings.invalidPhone') || 'Invalid phone format (+251...).'}</p>}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <FiKey className="w-3.5 h-3.5 text-blue-600" />
                    {t('auth.resetPassword') || 'Change Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 dark:border-gray-700 pt-5 flex items-center justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1769E0] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0D5BC4] disabled:opacity-60 transition shadow-md shadow-blue-600/10"
            >
              {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? (t('common.loading') || 'Saving...') : (t('common.save') || 'Save Changes')}
            </button>
          </div>
        </section>


        {/* ═════════════════════════════════════════════════════════════════════
            2. NOTIFICATIONS SECTION
           ═════════════════════════════════════════════════════════════════════ */}
        <section className="bg-white dark:bg-gray-800 rounded-[12px] shadow-sm border border-slate-200 dark:border-gray-700 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-gray-700">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                <FiBell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('dashboard.notifications.title') || 'Notification Preferences'}</h3>
                <p className="text-xs text-slate-500">{t('settings.notificationSubtitle') || 'Manage real-time alerts and communication channels.'}</p>
              </div>
            </div>

            <div className="space-y-3">
              {NOTIFICATION_ITEMS.map((it) => {
                const on = !!notifications[it.key];
                return (
                  <div
                    key={it.key}
                    className="rounded-xl border border-slate-100 dark:border-gray-700 px-4 py-3 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-gray-900/40 transition"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{it.title}</div>
                      <div className="text-[11px] font-medium text-slate-500 mt-0.5">{it.desc}</div>
                    </div>
                    <div>
                      <label htmlFor={`toggle-${it.key}`} className="relative inline-flex items-center cursor-pointer">
                        <input
                          id={`toggle-${it.key}`}
                          type="checkbox"
                          className="sr-only"
                          checked={on}
                          onChange={() => handleToggle(it.key)}
                        />
                        <span
                          className={`w-11 h-6 inline-block rounded-full transition-colors ${
                            on ? 'bg-blue-600' : 'bg-slate-200 dark:bg-gray-700'
                          }`}
                          aria-hidden="true"
                        />
                        <span
                          className={`absolute left-0 top-0 mt-0.5 ml-0.5 inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                            on ? 'translate-x-5' : 'translate-x-0'
                          }`}
                          aria-hidden="true"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 dark:border-gray-700 pt-3 text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
            <FiCheckCircle className="text-blue-500 w-3.5 h-3.5" />
            {t('settings.autoSaveNotice') || 'Preferences auto-save directly to your database profile.'}
          </div>
        </section>

      </div>


      {/* ═════════════════════════════════════════════════════════════════════
          CHANGE PASSWORD MODAL DIALOG
         ═════════════════════════════════════════════════════════════════════ */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="relative my-8 w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-gray-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <FiLock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('auth.resetPassword') || 'Change Password'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-gray-300 mb-1">{t('auth.password') || 'Current Password'}</label>
                <input
                  type="password"
                  placeholder={t('settings.currentPasswordPlaceholder', { defaultValue: 'Enter current password' })}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-gray-700 dark:bg-gray-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-gray-300 mb-1">{t('auth.newPassword') || 'New Password (min 6 characters)'}</label>
                <input
                  type="password"
                  placeholder={t('settings.newPasswordPlaceholder', { defaultValue: 'Enter new password' })}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-gray-700 dark:bg-gray-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-gray-300 mb-1">{t('auth.confirmPassword') || 'Confirm New Password'}</label>
                <input
                  type="password"
                  placeholder={t('settings.confirmPasswordPlaceholder', { defaultValue: 'Confirm new password' })}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-gray-700 dark:bg-gray-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              {/* Action buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-[#1769E0] text-xs font-bold text-white hover:bg-[#0D5BC4] disabled:opacity-60 transition shadow-sm"
                >
                  {passwordSaving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {passwordSaving ? t('settings.updatingPassword', { defaultValue: 'Updating...' }) : t('settings.updatePasswordBtn', { defaultValue: 'Update Password' })}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
