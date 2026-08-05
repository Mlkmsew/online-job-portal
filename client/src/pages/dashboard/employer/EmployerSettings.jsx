import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import api from '../../../services/api';
import { setUser } from '../../../store/slices/authSlice';
import {
  FiAlertTriangle,
  FiBell,
  FiBriefcase,
  FiCamera,
  FiCheck,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiDollarSign,
  FiGlobe,
  FiLock,
  FiMail,
  FiMapPin,
  FiMoon,
  FiPhone,
  FiShield,
  FiSun,
  FiTrash2,
  FiUser,
  FiX,
} from 'react-icons/fi';

const tabs = [
  'Account',
  'Notifications',
  'Company Preferences',
  'Appearance',
  'Privacy',
  'Danger Zone',
];

const EmployerSettings = () => {
  const [activeTab, setActiveTab] = useState('Account');
  const [account, setAccount] = useState({
    fullName: 'Employer',
    workEmail: '',
    companyName: '',
  });
  const [notifications, setNotifications] = useState({
    newApplications: true,
    weeklySummary: true,
  });
  const [privacySettings, setPrivacySettings] = useState({
    publicCompanyProfile: true,
    showCompanyWebsite: true,
    showContactInformation: true,
    allowCandidateMessages: true,
    allowRecruiterInvitations: false,
    hideEmailAddress: false,
    hidePhoneNumber: false,
    hideOfficeAddress: true,
    downloadCompanyData: true,
    exportApplicants: true,
    deleteOldApplications: false,
  });
  const [companyPreferences, setCompanyPreferences] = useState({
    hiringLocation: 'Addis Ababa',
    currency: 'ETB',
    language: 'English',
    timezone: 'East Africa Time (UTC+3)',
    dateFormat: 'DD/MM/YYYY',
    jobDuration: '30 days',
    employmentType: 'Full-time',
    workMode: 'Hybrid',
    salaryCurrency: 'ETB',
    autoCloseExpiredJobs: true,
    autoArchiveFilledJobs: true,
    requireCV: true,
    requireCoverLetter: false,
  });
  const [notificationSettings, setNotificationSettings] = useState({
    newApplicant: true,
    interviewReminder: true,
    jobExpirationReminder: true,
    weeklyReport: true,
    marketingEmails: false,
    desktopNotifications: true,
    browserNotifications: true,
    mobileNotifications: false,
    smsInterviewReminder: true,
    smsUrgentMessages: true,
    frequency: 'Instant',
  });
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [theme, setTheme] = useState('Light');
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'Light',
    dashboardLayout: 'Comfortable',
    sidebar: 'Expanded',
    primaryColor: 'Green',
    fontSize: 'Medium',
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPasswordEditor, setShowPasswordEditor] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saveMessage, setSaveMessage] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const uploadInputRef = useRef(null);
  const dispatch = useDispatch();

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await api.put('/auth/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedAvatar = response?.data?.avatar || URL.createObjectURL(file);
      setAvatarUrl(uploadedAvatar);

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const nextUser = { ...currentUser, avatar: uploadedAvatar };
      localStorage.setItem('user', JSON.stringify(nextUser));
      dispatch(setUser(nextUser));

      setSaveMessage('Profile photo updated.');
      window.clearTimeout(window.__employerSettingsSaveTimer);
      window.__employerSettingsSaveTimer = window.setTimeout(() => setSaveMessage(''), 2500);
    } catch (error) {
      setSaveMessage(error?.response?.data?.message || 'Failed to upload photo.');
      window.clearTimeout(window.__employerSettingsSaveTimer);
      window.__employerSettingsSaveTimer = window.setTimeout(() => setSaveMessage(''), 4000);
    } finally {
      event.target.value = '';
    }
  };

  useEffect(() => {
    const applySavedSettings = (savedSettings) => {
      if (!savedSettings || typeof savedSettings !== 'object') return;

      if (savedSettings.account) {
        setAccount((prev) => ({
          ...prev,
          fullName: savedSettings.account.fullName || prev.fullName,
          workEmail: savedSettings.account.workEmail || prev.workEmail,
          companyName: savedSettings.account.companyName || prev.companyName,
        }));
      }

      if (savedSettings.companyProfile) {
        setCompanyPreferences((prev) => ({ ...prev, ...savedSettings.companyProfile }));
      }

      if (savedSettings.notifications) setNotifications((prev) => ({ ...prev, ...savedSettings.notifications }));
      if (savedSettings.privacy) setPrivacySettings((prev) => ({ ...prev, ...savedSettings.privacy }));
      if (savedSettings.companyPreferences) setCompanyPreferences((prev) => ({ ...prev, ...savedSettings.companyPreferences }));
      if (savedSettings.notificationPreferences) setNotificationSettings((prev) => ({ ...prev, ...savedSettings.notificationPreferences }));
      if (savedSettings.appearance) setAppearanceSettings((prev) => ({ ...prev, ...savedSettings.appearance }));
      if (savedSettings.theme) setTheme(savedSettings.theme);
    };

    try {
      const savedSettings = JSON.parse(localStorage.getItem('employer-settings') || '{}');
      applySavedSettings(savedSettings);
    } catch (error) {
      console.error('Failed to load saved employer settings', error);
    }

    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (storedUser) {
      const fullName = [storedUser.firstName, storedUser.lastName].filter(Boolean).join(' ') || 'Employer';
      setAccount((prev) => ({
        ...prev,
        fullName,
        workEmail: storedUser.email || prev.workEmail,
        companyName: storedUser.companyName || prev.companyName,
      }));
      if (storedUser.avatar) setAvatarUrl(storedUser.avatar);
    }

    const loadUserProfile = async () => {
      try {
        const response = await api.get('/auth/me');
        const user = response?.data?.data || response?.data?.user || response?.data || null;
        if (!user) return;

        const nextFullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Employer';
        setAccount((prev) => ({
          ...prev,
          fullName: nextFullName,
          workEmail: user.email || prev.workEmail,
        }));
        if (user.avatar) setAvatarUrl(user.avatar);

        const nextUser = { ...JSON.parse(localStorage.getItem('user') || '{}'), ...user };
        localStorage.setItem('user', JSON.stringify(nextUser));
        dispatch(setUser(nextUser));

        if (user.settings) {
          applySavedSettings(user.settings);
          localStorage.setItem('employer-settings', JSON.stringify({
            account: user.settings.account || account,
            companyProfile: user.settings.companyProfile || companyPreferences,
            notifications: user.settings.notifications || notifications,
            privacySettings: user.settings.privacy || privacySettings,
            companyPreferences: user.settings.companyPreferences || companyPreferences,
            notificationSettings: user.settings.notificationPreferences || notificationSettings,
            appearanceSettings: user.settings.appearance || appearanceSettings,
            theme: user.settings.theme || theme,
          }));
        }
      } catch (error) {
        console.error('Failed to load employer profile', error);
      }
    };

    const loadCompanyProfile = async () => {
      try {
        const response = await api.get('/companies/my/company');
        const companyData = response?.data?.data || null;
        if (!companyData) return;

        setAccount((prev) => ({
          ...prev,
          companyName: companyData.name || prev.companyName,
          workEmail: companyData.email || prev.workEmail,
        }));

        setCompanyPreferences((prev) => ({
          ...prev,
          hiringLocation: companyData.location?.city || prev.hiringLocation,
          timezone: companyData.location?.timezone || prev.timezone,
          language: companyData.language || prev.language,
        }));
      } catch (error) {
        console.error('Failed to load company profile', error);
      }
    };

    loadUserProfile();
    loadCompanyProfile();
  }, []);

  const syncStoredUser = (updatedUser) => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const nextUser = { ...currentUser, ...updatedUser };
    localStorage.setItem('user', JSON.stringify(nextUser));
    dispatch(setUser(nextUser));
    return nextUser;
  };

  const saveSettings = async () => {
    try {
      const fullName = (account.fullName || '').trim();
      const nameParts = fullName ? fullName.split(/\s+/) : [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const profilePayload = {
        firstName,
        lastName,
        email: account.workEmail,
        phone: '+251 911 234 567',
      };

      const profileResponse = await api.put('/auth/update-profile', profilePayload);
      syncStoredUser(profileResponse?.data?.data || {
        firstName,
        lastName,
        email: account.workEmail,
      });

      const payload = {
        account: {
          fullName: account.fullName,
          workEmail: account.workEmail,
          companyName: account.companyName,
        },
        companyProfile: {
          companyName: account.companyName,
          ...companyPreferences,
        },
        notifications,
        privacySettings,
        companyPreferences,
        notificationSettings,
        appearanceSettings,
        theme,
        savedAt: new Date().toISOString(),
      };

      const settingsPayload = {
        settings: {
          account: {
            fullName: account.fullName,
            workEmail: account.workEmail,
            companyName: account.companyName,
          },
          companyProfile: {
            companyName: account.companyName,
            ...companyPreferences,
          },
          notifications,
          privacy: privacySettings,
          companyPreferences,
          notificationPreferences: notificationSettings,
          appearance: appearanceSettings,
          theme,
        },
      };

      await api.put('/auth/update-settings', settingsPayload);

      localStorage.setItem('employer-settings', JSON.stringify(payload));
      setSaveMessage('Changes saved successfully.');
      window.clearTimeout(window.__employerSettingsSaveTimer);
      window.__employerSettingsSaveTimer = window.setTimeout(() => setSaveMessage(''), 2500);
    } catch (error) {
      setSaveMessage(error?.response?.data?.message || 'Failed to save changes.');
      window.clearTimeout(window.__employerSettingsSaveTimer);
      window.__employerSettingsSaveTimer = window.setTimeout(() => setSaveMessage(''), 4000);
    }
  };

  const currentTabMeta = useMemo(() => {
    const map = {
      Account: { icon: FiUser, accent: 'bg-emerald-100 text-emerald-700' },
      Notifications: { icon: FiBell, accent: 'bg-amber-100 text-amber-700' },
      'Company Preferences': { icon: FiBriefcase, accent: 'bg-sky-100 text-sky-700' },
      Appearance: { icon: theme === 'Dark' ? FiMoon : FiSun, accent: 'bg-violet-100 text-violet-700' },
      Privacy: { icon: FiShield, accent: 'bg-rose-100 text-rose-700' },
      'Danger Zone': { icon: FiLock, accent: 'bg-red-100 text-red-700' },
    };
    return map[activeTab] || map.Account;
  }, [activeTab, theme]);

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePrivacy = (key) => {
    setPrivacySettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCompanyPref = (key) => {
    setCompanyPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleNotificationPreference = (key) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return;
    }

    try {
      await api.put('/auth/update-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setShowPasswordModal(false);
      setShowPasswordEditor(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSaveMessage('Password updated successfully.');
      window.clearTimeout(window.__employerSettingsSaveTimer);
      window.__employerSettingsSaveTimer = window.setTimeout(() => setSaveMessage(''), 2500);
    } catch (error) {
      setSaveMessage(error?.response?.data?.message || 'Failed to update password.');
      window.clearTimeout(window.__employerSettingsSaveTimer);
      window.__employerSettingsSaveTimer = window.setTimeout(() => setSaveMessage(''), 4000);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return;
    }

    try {
      await api.put('/auth/update-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setShowPasswordEditor(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSaveMessage('Password updated successfully.');
      window.clearTimeout(window.__employerSettingsSaveTimer);
      window.__employerSettingsSaveTimer = window.setTimeout(() => setSaveMessage(''), 2500);
    } catch (error) {
      setSaveMessage(error?.response?.data?.message || 'Failed to update password.');
      window.clearTimeout(window.__employerSettingsSaveTimer);
      window.__employerSettingsSaveTimer = window.setTimeout(() => setSaveMessage(''), 4000);
    }
  };

  const resetPasswordForm = () => {
    setShowPasswordEditor(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Account':
        return (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700">Employer Account Settings</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Manage your profile</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <FiUser className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-2xl font-bold text-white shadow-md">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Employer avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span>{account.fullName?.charAt(0)?.toUpperCase() || 'E'}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{account.fullName}</p>
                      <p className="text-sm text-slate-500">{account.companyName ? `Recruitment Lead • ${account.companyName}` : 'Recruitment Lead'}</p>
                    </div>
                  </div>

                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => uploadInputRef.current?.click()}
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    <FiCamera className="h-4 w-4" />
                    Upload Photo
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Full Name</label>
                      <input
                        value={account.fullName}
                        onChange={(event) => setAccount((prev) => ({ ...prev, fullName: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Job Title</label>
                      <input
                        value="Recruitment Lead"
                        readOnly
                        className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Work Email</label>
                      <div className="relative">
                        <FiMail className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          value={account.workEmail}
                          onChange={(event) => setAccount((prev) => ({ ...prev, workEmail: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Phone Number</label>
                      <div className="relative">
                        <FiPhone className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                        <input
                          value="+251 911 234 567"
                          readOnly
                          className="w-full rounded-2xl border border-slate-200 bg-slate-100 py-3 pl-11 pr-4 text-sm text-slate-600 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Security</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">Update password</h3>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <FiLock className="h-5 w-5" />
                </div>
              </div>

              {!showPasswordEditor ? (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setShowPasswordEditor(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <FiShield className="h-4 w-4" />
                    Change Password
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Current Password</label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">New Password</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Confirm Password</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={resetPasswordForm}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handlePasswordUpdate}
                      className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'Notifications':
        return (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700">Employer Notification Settings</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Delivery preferences</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <FiBell className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <h3 className="text-lg font-semibold text-slate-900">Email Notifications</h3>
                  <div className="mt-4 space-y-4">
                    {[
                      { key: 'newApplicant', label: 'New Applicant', description: 'Get a notification whenever a candidate applies.' },
                      { key: 'interviewReminder', label: 'Interview Reminder', description: 'Reminder before scheduled interviews start.' },
                      { key: 'jobExpirationReminder', label: 'Job Expiration Reminder', description: 'Alert when postings are close to expiry.' },
                      { key: 'weeklyReport', label: 'Weekly Report', description: 'Receive a weekly hiring summary.' },
                      { key: 'marketingEmails', label: 'Marketing Emails', description: 'Product news, tips, and platform updates.' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3">
                        <div>
                          <p className="font-medium text-slate-800">{item.label}</p>
                          <p className="text-sm text-slate-500">{item.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleNotificationPreference(item.key)}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full ${notificationSettings[item.key] ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${notificationSettings[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <h3 className="text-lg font-semibold text-slate-900">Notification Frequency</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {['Instant', 'Daily', 'Weekly'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setNotificationSettings((prev) => ({ ...prev, frequency: option }))}
                        className={`rounded-2xl border p-3 text-left text-sm font-medium transition ${
                          notificationSettings.frequency === option
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button type="button" className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Reset
                </button>
                <button type="button" onClick={saveSettings} className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        );

      case 'Company Preferences':
        return (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sky-700">Company Preferences</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Hiring setup</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <FiBriefcase className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <h3 className="text-lg font-semibold text-slate-900">Default hiring location</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Default Hiring Location</label>
                      <select
                        value={companyPreferences.hiringLocation}
                        onChange={(event) => setCompanyPreferences((prev) => ({ ...prev, hiringLocation: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
                      >
                        <option>Addis Ababa</option>
                        <option>Dire Dawa</option>
                        <option>Bahirdar</option>
                        <option>Remote</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Default Currency</label>
                      <select
                        value={companyPreferences.currency}
                        onChange={(event) => setCompanyPreferences((prev) => ({ ...prev, currency: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
                      >
                        <option>ETB</option>
                        <option>USD</option>
                        <option>EUR</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Default Language</label>
                      <select
                        value={companyPreferences.language}
                        onChange={(event) => setCompanyPreferences((prev) => ({ ...prev, language: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
                      >
                        <option>English</option>
                        <option>Amharic</option>
                        <option>Somali</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Timezone</label>
                      <select
                        value={companyPreferences.timezone}
                        onChange={(event) => setCompanyPreferences((prev) => ({ ...prev, timezone: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
                      >
                        <option>East Africa Time (UTC+3)</option>
                        <option>GMT</option>
                        <option>UTC</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Date Format</label>
                      <select
                        value={companyPreferences.dateFormat}
                        onChange={(event) => setCompanyPreferences((prev) => ({ ...prev, dateFormat: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
                      >
                        <option>DD/MM/YYYY</option>
                        <option>MM/DD/YYYY</option>
                        <option>YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <h3 className="text-lg font-semibold text-slate-900">Default Job Settings</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Job Duration</label>
                      <input
                        value={companyPreferences.jobDuration}
                        onChange={(event) => setCompanyPreferences((prev) => ({ ...prev, jobDuration: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Employment Type</label>
                      <select
                        value={companyPreferences.employmentType}
                        onChange={(event) => setCompanyPreferences((prev) => ({ ...prev, employmentType: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
                      >
                        <option>Full-time</option>
                        <option>Part-time</option>
                        <option>Contract</option>
                        <option>Internship</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Work Mode</label>
                      <select
                        value={companyPreferences.workMode}
                        onChange={(event) => setCompanyPreferences((prev) => ({ ...prev, workMode: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
                      >
                        <option>Hybrid</option>
                        <option>Remote</option>
                        <option>Onsite</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Default Salary Currency</label>
                      <select
                        value={companyPreferences.salaryCurrency}
                        onChange={(event) => setCompanyPreferences((prev) => ({ ...prev, salaryCurrency: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
                      >
                        <option>ETB</option>
                        <option>USD</option>
                        <option>EUR</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <h3 className="text-lg font-semibold text-slate-900">Recruitment Preferences</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {[
                    { key: 'autoCloseExpiredJobs', label: 'Auto Close Expired Jobs' },
                    { key: 'autoArchiveFilledJobs', label: 'Auto Archive Filled Jobs' },
                    { key: 'requireCV', label: 'Require CV' },
                    { key: 'requireCoverLetter', label: 'Require Cover Letter' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3">
                      <span className="font-medium text-slate-800">{item.label}</span>
                      <button
                        type="button"
                        onClick={() => toggleCompanyPref(item.key)}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full ${companyPreferences[item.key] ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${companyPreferences[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button type="button" className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Cancel
                </button>
                <button type="button" onClick={saveSettings} className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        );

      case 'Appearance':
        return (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-violet-700">Appearance Settings</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Brand your workspace</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  {appearanceSettings.theme === 'Dark' ? <FiMoon className="h-5 w-5" /> : <FiSun className="h-5 w-5" />}
                </div>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                <div className="space-y-6">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <h3 className="text-lg font-semibold text-slate-900">Theme</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {['Light', 'Dark', 'System'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setTheme(option);
                            setAppearanceSettings((prev) => ({ ...prev, theme: option }));
                          }}
                          className={`rounded-2xl border p-4 text-left transition ${
                            appearanceSettings.theme === option
                              ? 'border-violet-500 bg-violet-50 text-violet-700'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-violet-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{option}</span>
                            {appearanceSettings.theme === option && <FiCheck className="h-4 w-4" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <h3 className="text-lg font-semibold text-slate-900">Dashboard Layout</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {['Compact', 'Comfortable'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setAppearanceSettings((prev) => ({ ...prev, dashboardLayout: option }))}
                          className={`rounded-2xl border p-4 text-left transition ${
                            appearanceSettings.dashboardLayout === option
                              ? 'border-violet-500 bg-violet-50 text-violet-700'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-violet-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{option}</span>
                            {appearanceSettings.dashboardLayout === option && <FiCheck className="h-4 w-4" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <h3 className="text-lg font-semibold text-slate-900">Sidebar</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {['Expanded', 'Collapsed'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setAppearanceSettings((prev) => ({ ...prev, sidebar: option }))}
                          className={`rounded-2xl border p-4 text-left transition ${
                            appearanceSettings.sidebar === option
                              ? 'border-violet-500 bg-violet-50 text-violet-700'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-violet-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{option}</span>
                            {appearanceSettings.sidebar === option && <FiCheck className="h-4 w-4" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <h3 className="text-lg font-semibold text-slate-900">Primary Color</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        { label: 'Green', color: 'bg-emerald-500' },
                        { label: 'Blue', color: 'bg-sky-500' },
                        { label: 'Purple', color: 'bg-violet-500' },
                        { label: 'Orange', color: 'bg-orange-500' },
                      ].map((option) => (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() => setAppearanceSettings((prev) => ({ ...prev, primaryColor: option.label }))}
                          className={`flex items-center justify-between rounded-2xl border p-3 text-left transition ${
                            appearanceSettings.primaryColor === option.label
                              ? 'border-violet-500 bg-violet-50 text-violet-700'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-violet-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`h-4 w-4 rounded-full ${option.color}`} />
                            <span className="font-medium">{option.label}</span>
                          </div>
                          {appearanceSettings.primaryColor === option.label && <FiCheck className="h-4 w-4" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <h3 className="text-lg font-semibold text-slate-900">Font Size</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {['Small', 'Medium', 'Large'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setAppearanceSettings((prev) => ({ ...prev, fontSize: option }))}
                          className={`rounded-2xl border p-4 text-left transition ${
                            appearanceSettings.fontSize === option
                              ? 'border-violet-500 bg-violet-50 text-violet-700'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-violet-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{option}</span>
                            {appearanceSettings.fontSize === option && <FiCheck className="h-4 w-4" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-100 p-4">
                  <div className="flex items-center justify-between pb-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Preview</p>
                      <h3 className="mt-1 text-xl font-semibold text-slate-900">Live dashboard</h3>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {appearanceSettings.theme}
                    </span>
                  </div>

                  <div
                    className={`rounded-3xl border p-4 shadow-sm ${
                      appearanceSettings.theme === 'Dark'
                        ? 'border-slate-700 bg-slate-900 text-slate-100'
                        : 'border-slate-200 bg-white text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                          appearanceSettings.primaryColor === 'Green'
                            ? 'bg-emerald-500'
                            : appearanceSettings.primaryColor === 'Blue'
                              ? 'bg-sky-500'
                              : appearanceSettings.primaryColor === 'Purple'
                                ? 'bg-violet-500'
                                : 'bg-orange-500'
                        } text-white`}>
                          <FiBriefcase className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Acme Hiring</p>
                          <p className="text-[11px] text-slate-400">Talent dashboard</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                        Live
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        { label: 'Open roles', value: '18', tone: 'bg-emerald-100 text-emerald-700' },
                        { label: 'Interviews', value: '6', tone: 'bg-sky-100 text-sky-700' },
                        { label: 'Accepted', value: '24', tone: 'bg-violet-100 text-violet-700' },
                        { label: 'Avg. score', value: '89%', tone: 'bg-orange-100 text-orange-700' },
                      ].map((stat) => (
                        <div key={stat.label} className={`rounded-2xl p-3 ${stat.tone}`}>
                          <p className="text-[11px] font-medium uppercase tracking-[0.2em] opacity-75">{stat.label}</p>
                          <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium">Hiring pipeline</span>
                        <span className="text-slate-500">This week</span>
                      </div>
                      <div className="flex items-end gap-2">
                        {[40, 58, 72, 68, 88, 96].map((height, index) => (
                          <div key={index} className="flex-1 rounded-t-xl bg-gradient-to-t from-emerald-500 to-emerald-300" style={{ height: `${height}px` }} />
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white ${
                          appearanceSettings.primaryColor === 'Green'
                            ? 'bg-emerald-600'
                            : appearanceSettings.primaryColor === 'Blue'
                              ? 'bg-sky-600'
                              : appearanceSettings.primaryColor === 'Purple'
                                ? 'bg-violet-600'
                                : 'bg-orange-600'
                        }`}
                      >
                        View dashboard
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setAppearanceSettings({
                      theme: 'Light',
                      dashboardLayout: 'Comfortable',
                      sidebar: 'Expanded',
                      primaryColor: 'Green',
                      fontSize: 'Medium',
                    })
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setTheme(appearanceSettings.theme)}
                  className="rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Save Theme
                </button>
              </div>
            </div>
          </div>
        );

      case 'Privacy':
        return (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-rose-700">Privacy Settings</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Visibility and security</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                  <FiShield className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <h3 className="text-lg font-semibold text-slate-900">Company Visibility</h3>
                  <div className="mt-4 space-y-4">
                    {[
                      { key: 'publicCompanyProfile', label: 'Public Company Profile', description: 'Allow job seekers to view your public company profile.' },
                      { key: 'showCompanyWebsite', label: 'Show Company Website', description: 'Display your website on your public company page.' },
                      { key: 'showContactInformation', label: 'Show Contact Information', description: 'Display phone, email, and address publicly.' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3">
                        <div>
                          <p className="font-medium text-slate-800">{item.label}</p>
                          <p className="text-sm text-slate-500">{item.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => togglePrivacy(item.key)}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full ${privacySettings[item.key] ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${privacySettings[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <h3 className="text-lg font-semibold text-slate-900">Communication</h3>
                  <div className="mt-4 space-y-4">
                    {[
                      { key: 'allowCandidateMessages', label: 'Allow Candidate Messages', description: 'Let candidates contact you directly through the platform.' },
                      { key: 'allowRecruiterInvitations', label: 'Allow Recruiter Invitations', description: 'Receive recruiter or partner invitations for collaboration.' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3">
                        <div>
                          <p className="font-medium text-slate-800">{item.label}</p>
                          <p className="text-sm text-slate-500">{item.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => togglePrivacy(item.key)}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full ${privacySettings[item.key] ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${privacySettings[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <h3 className="text-lg font-semibold text-slate-900">Security</h3>
                  <div className="mt-4 space-y-4">
                    {[
                      { key: 'hideEmailAddress', label: 'Hide Email Address', description: 'Hide company email from public listing pages.' },
                      { key: 'hidePhoneNumber', label: 'Hide Phone Number', description: 'Mask your phone number from candidate view.' },
                      { key: 'hideOfficeAddress', label: 'Hide Office Address', description: 'Keep office location private on public pages.' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3">
                        <div>
                          <p className="font-medium text-slate-800">{item.label}</p>
                          <p className="text-sm text-slate-500">{item.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => togglePrivacy(item.key)}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full ${privacySettings[item.key] ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${privacySettings[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button type="button" onClick={saveSettings} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
                  Save Privacy Settings
                </button>
              </div>
            </div>
          </div>
        );

      case 'Billing':
        return (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-cyan-700">Billing</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Subscription overview</h2>
            <div className="mt-6 rounded-2xl bg-cyan-50 p-4 text-sm text-cyan-800">Your billing and plan information will appear here.</div>
          </div>
        );

      case 'Danger Zone':
        return (
          <div className="space-y-6">
            <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Danger Zone</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Critical account actions</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                  <FiAlertTriangle className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-red-800">Deactivate Account</h3>
                      <p className="mt-2 text-sm text-red-700">Temporarily disable your employer account.</p>
                    </div>
                    <button type="button" className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">
                      Deactivate Account
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-red-800">Delete Company</h3>
                      <p className="mt-2 text-sm text-red-700">Delete your company permanently.</p>
                    </div>
                    <button type="button" className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">
                      Delete Company
                    </button>
                  </div>

                  <div className="mt-4 rounded-2xl border border-red-200 bg-white p-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Type DELETE to confirm</label>
                    <input
                      value={deleteConfirm}
                      onChange={(event) => setDeleteConfirm(event.target.value)}
                      placeholder="DELETE"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                      <FiDownload className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-amber-900">Export Data</h3>
                      <p className="mt-2 text-sm text-amber-800">Download all company data before deleting.</p>
                      <div className="mt-4 flex items-center justify-between rounded-2xl border border-amber-200 bg-white p-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <FiDownload className="h-4 w-4 text-amber-600" />
                          Company data export
                        </div>
                        <button type="button" className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-700">
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <div className="flex items-center gap-2 font-semibold">
                    <FiAlertTriangle className="h-4 w-4" />
                    Warning
                  </div>
                  <p className="mt-2">This action cannot be undone.</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-2 md:p-0">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-700">Employer settings</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Manage your account</h1>
          </div>

          <div className="flex items-center gap-3">
            {saveMessage && (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                {saveMessage}
              </span>
            )}
            <button
              type="button"
              onClick={saveSettings}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Save changes
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            const Icon = tab === 'Account'
              ? FiUser
              : tab === 'Notifications'
                ? FiBell
                : tab === 'Company Preferences'
                  ? FiBriefcase
                  : tab === 'Appearance'
                    ? theme === 'Dark' ? FiMoon : FiSun
                    : tab === 'Privacy'
                      ? FiShield
                      : tab === 'Billing'
                        ? FiMail
                        : FiLock;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100'
                    : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${currentTabMeta.accent}`}>
              <currentTabMeta.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Current section</p>
              <h2 className="text-lg font-semibold text-slate-900">{activeTab}</h2>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
            <span>Settings</span>
            <FiChevronRight className="h-4 w-4" />
            <span className="font-medium text-slate-700">{activeTab}</span>
          </div>
        </div>

        {renderTabContent()}
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">Security</p>
                <h3 className="mt-1 text-2xl font-semibold text-slate-900">Change password</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Current password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">New password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Confirm new password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Update password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerSettings;
