import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../services/api';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/update-password', {
        currentPassword,
        newPassword,
      });
      toast.success('Password changed successfully.');
      navigate('/employer/settings');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to update password.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#1769E0] focus:ring-2 focus:ring-[#1769E0]/20';

  const renderPasswordField = (label, value, onChange, show, setShow, id) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <button
          type="button"
          onClick={() => navigate('/employer/settings')}
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <FiArrowLeft className="h-4 w-4" /> Back to Settings
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
            <FiLock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Change Password</h2>
            <p className="text-sm text-slate-500">Enter your current password and choose a new secure password.</p>
          </div>
        </div>

        <div className="space-y-5">
          {renderPasswordField('Current Password', currentPassword, setCurrentPassword, showCurrent, setShowCurrent, 'currentPassword')}
          {renderPasswordField('New Password', newPassword, setNewPassword, showNew, setShowNew, 'newPassword')}
          {renderPasswordField('Confirm Password', confirmPassword, setConfirmPassword, showConfirm, setShowConfirm, 'confirmPassword')}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate('/employer/settings')}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl bg-[#1769E0] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0D5BC4] disabled:opacity-60"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;