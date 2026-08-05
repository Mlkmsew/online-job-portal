import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiUser, FiUpload } from 'react-icons/fi';
import toast from 'react-hot-toast';

const NOTIFICATION_ITEMS = [
  { key: 'email', title: 'Email Alerts', desc: 'Receive job updates and newsletters by email.' },
  { key: 'inapp', title: 'In-App Notifications', desc: 'Get real-time alerts inside the app.' },
  { key: 'match', title: 'Job Match Alerts', desc: 'Relevant job matches sent to you.' },
  { key: 'application', title: 'Application Status', desc: 'Updates about your submitted applications.' },
  { key: 'interview', title: 'Interview Reminders', desc: 'Reminders for scheduled interviews.' },
];

const phoneIsValid = (phone) => {
  if (!phone) return true; // optional
  return /^\+?[0-9]{7,15}$/.test(phone);
};

const Settings = () => {
  const { user } = useSelector((state) => state.auth) || {};
  const [fullName, setFullName] = useState(`${user?.firstName || ''} ${user?.lastName || ''}`.trim());
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const [notifications, setNotifications] = useState({
    email: true,
    inapp: true,
    match: true,
    application: true,
    interview: false,
  });

  const [avatar, setAvatar] = useState(null);
  const fileRef = useRef(null);

  const handleToggle = (key) => setNotifications((p) => ({ ...p, [key]: !p[key] }));

  const handlePickPhoto = (e) => {
    const f = e.target.files?.[0];
    if (f) setAvatar(Object.assign(f, { preview: URL.createObjectURL(f) }));
  };

  const navigate = useNavigate();

  const handleUploadClick = () => fileRef.current?.click();

  const handlePasswordClick = () => navigate('/dashboard/settings/change-password');

  const handleSave = () => {
    if (!phoneIsValid(phone)) {
      toast.error('Please enter a valid phone number (7-15 digits, optional +).');
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Settings saved');
    }, 700);
  };

  return (
    <div className="min-h-[70vh] flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-6xl grid gap-8 md:grid-cols-2">
        {/* Account Card */}
        <section className="bg-white dark:bg-gray-800 rounded-[12px] shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-md bg-emerald-50 text-emerald-600">
                <FiUser className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Account</h3>
                <p className="text-sm text-gray-500">Manage your personal details and security.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0">
              <div className="w-28 h-28 rounded-full bg-gray-100 dark:bg-gray-900 overflow-hidden flex items-center justify-center">
                {avatar ? (
                  <img src={avatar.preview} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-400">No photo</div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePickPhoto} className="hidden" />
              <button
                type="button"
                onClick={handleUploadClick}
                className="mt-3 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                aria-label="Upload profile photo"
              >
                <FiUpload className="w-4 h-4 text-emerald-600" /> Upload Photo
              </button>
            </div>

            <div className="flex-1 w-full">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600">Email</label>
                  <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{user?.email || 'Not available'}</div>
                </div>

                <div>
                  <label htmlFor="fullname" className="block text-sm text-gray-600">Full name</label>
                  <input id="fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-900" />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm text-gray-600">Phone number</label>
                  <input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+251912345678"
                    className="mt-1 block w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-900"
                    aria-invalid={!phoneIsValid(phone)}
                  />
                  {!phoneIsValid(phone) && <p className="mt-1 text-xs text-red-600">Invalid phone number.</p>}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button type="button" onClick={handlePasswordClick} className="rounded-md border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t pt-5 flex items-center justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </section>

        {/* Notifications Card */}
        <section className="bg-white dark:bg-gray-800 rounded-[12px] shadow-sm border p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 rounded-md bg-emerald-50 text-emerald-600">
              <FiBell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
              <p className="text-sm text-gray-500">Control how you receive alerts and updates.</p>
            </div>
          </div>

          <div className="space-y-3">
            {NOTIFICATION_ITEMS.map((it) => {
              const on = !!notifications[it.key];
              return (
                <div key={it.key} className="rounded-lg border px-4 py-3 flex items-center justify-between hover:shadow-sm transition">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{it.title}</div>
                    <div className="text-sm text-gray-500">{it.desc}</div>
                  </div>
                  <div>
                    <label htmlFor={`toggle-${it.key}`} className="relative inline-flex items-center cursor-pointer">
                      <input id={`toggle-${it.key}`} type="checkbox" className="sr-only" checked={on} onChange={() => handleToggle(it.key)} />
                      <span className={`w-11 h-6 inline-block rounded-full transition-colors ${on ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'}`} aria-hidden="true" />
                      <span className={`absolute left-0 top-0 mt-0.5 ml-0.5 inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`} aria-hidden="true" />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
