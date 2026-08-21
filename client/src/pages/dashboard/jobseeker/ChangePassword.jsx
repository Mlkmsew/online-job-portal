import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiLock, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ChangePassword = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t('settings.fillAllFields', { defaultValue: 'Please fill in all fields.' }));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t('settings.weakPassword8', { defaultValue: 'New password must be at least 8 characters.' }));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('auth.passwordMismatch', { defaultValue: 'Passwords do not match.' }));
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(t('settings.passwordChangedSuccess', { defaultValue: 'Password changed successfully.' }));
      navigate('/dashboard/settings');
    }, 900);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl rounded-[12px] border bg-white dark:bg-gray-800 p-6 shadow-sm">
        <button
          type="button"
          onClick={() => navigate('/dashboard/settings')}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft className="w-4 h-4" /> {t('settings.backToSettings', { defaultValue: 'Back to Settings' })}
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <FiLock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('settings.changePasswordTitle', { defaultValue: 'Change Password' })}</h2>
            <p className="text-sm text-gray-500">{t('settings.changePasswordSubtitle', { defaultValue: 'Enter your current password and choose a new secure password.' })}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="currentPassword" className="block text-sm text-gray-600">{t('admin.settings.security.currentPassword', { defaultValue: 'Current Password' })}</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-2 block w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-900 text-sm"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm text-gray-600">{t('admin.settings.security.newPassword', { defaultValue: 'New Password' })}</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-2 block w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-900 text-sm"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm text-gray-600">{t('auth.confirmPassword', { defaultValue: 'Confirm Password' })}</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2 block w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-900 text-sm"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-[#1769E0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0D5BC4] disabled:opacity-60"
          >
            {loading ? t('settings.updatingPassword', { defaultValue: 'Updating...' }) : t('admin.settings.security.updatePasswordBtn', { defaultValue: 'Update Password' })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
