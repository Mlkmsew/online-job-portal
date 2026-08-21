import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import { logoutUser, setUser } from '../../../store/slices/authSlice';
import {
  FiAlertTriangle,
  FiBell,
  FiBriefcase,
  FiCamera,
  FiCheck,
  FiChevronRight,
  FiDownload,
  FiLock,
  FiMail,
  FiMoon,
  FiPhone,
  FiShield,
  FiSun,
  FiUser,
  FiX,
} from 'react-icons/fi';

const tabs = [
  { value: 'Account', labelKey: 'employer.tabs.account' },
  { value: 'Notifications', labelKey: 'employer.tabs.notifications' },
  { value: 'Company Preferences', labelKey: 'employer.tabs.companyPreferences' },
  { value: 'Appearance', labelKey: 'employer.tabs.appearance' },
  { value: 'Privacy', labelKey: 'employer.tabs.privacy' },
  { value: 'Danger Zone', labelKey: 'employer.tabs.dangerZone' },
];

const EmployerSettings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

      setSaveMessage(t('employer.settings.messages.photoUpdated'));
      window.clearTimeout(window.__employerSettingsSaveTimer);
      window.__employerSettingsSaveTimer = window.setTimeout(() => setSaveMessage(''), 2500);
    } catch (error) {
      setSaveMessage(error?.response?.data?.message || t('employer.settings.messages.photoUploadFailed'));
      window.clearTimeout(window.__employerSettingsSaveTimer);
      window.__employerSettingsSaveTimer = window.setTimeout(() => setSaveMessage(''), 4000);
    } fontFinally: {
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
      if (savedSettings.theme) {
        setTheme(savedSettings.theme);
        setAppearanceSettings((prev) => ({ ...prev, theme: savedSettings.theme }));
      }
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
  }, [dispatch]);

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
      const updatedUser = profileResponse?.data?.data || {
        firstName,
        lastName,
        email: account.workEmail,
      };
      syncStoredUser(updatedUser);

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
      dispatch(setUser({ settings: settingsPayload.settings }));

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

      localStorage.setItem('employer-settings', JSON.stringify(payload));
      setSaveMessage(t('employer.settings.messages.changesSaved'));
      window.clearTimeout(window.__employerSettingsSaveTimer);
      window.__employerSettingsSaveTimer = window.setTimeout(() => setSaveMessage(''), 2500);
    } catch (error) {
      setSaveMessage(error?.response?.data?.message || t('employer.settings.messages.saveFailed'));
      window.clearTimeout(window.__employerSettingsSaveTimer);
      window.__employerSettingsSaveTimer = window.setTimeout(() => setSaveMessage(''), 4000);
    }
  };

  const currentTabMeta = useMemo(() => {
    const map = {
      Account: { icon: FiUser, accent: 'bg-[#DCEAFD] text-[#0A4FA8]' },
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

  const clearSessionAndRedirect = (redirectTo = '/login') => {
    dispatch(logoutUser());
    window.location.href = redirectTo;
  };

  const handleDeactivateAccount = async () => {
    const confirmed = window.confirm(t('employer.settings.messages.confirmDeactivate'));
    if (!confirmed) return;

    try {
      await api.put('/auth/deactivate-account');
      clearSessionAndRedirect('/login');
    } catch (error) {
      setSaveMessage(error?.response?.data?.message || t('employer.settings.messages.deactivateFailed'));
      window.clearTimeout(window.__employerSettingsSaveTimer);
      window.__employerSettingsSaveTimer = window.setTimeout(() => setSaveMessage(''), 4000);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm.trim().toUpperCase() !== 'DELETE') {
      setSaveMessage(t('employer.settings.messages.typeDeleteToConfirm'));
      window.clearTimeout(window.__employerSettingsSaveTimer);
      window.__employerSettingsSaveTimer = window.setTimeout(() => setSaveMessage(''), 4000);
      return;
    }

    try {
      await api.delete('/auth/delete-account');
      clearSessionAndRedirect('/');
    } catch (error) {
      setSaveMessage(error?.response?.data?.message || t('employer.settings.messages.deleteFailed'));
      window.clearTimeout(window.__employerSettingsSaveTimer);
      window.__employerSettingsSaveTimer = window.setTimeout(() => setSaveMessage(''), 4000);
    }
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
      setSaveMessage(t('employer.settings.messages.passwordUpdated'));
      window.clearTimeout(window.__employerSettingsSaveTimer);
      window.__employerSettingsSaveTimer = window.setTimeout(() => setSaveMessage(''), 2500);
    } catch (error) {
      setSaveMessage(error?.response?.data?.message || t('employer.settings.messages.passwordUpdateFailed'));
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
      setSaveMessage(t('employer.settings.messages.passwordUpdated'));
      window.clearTimeout(window.__employerSettingsSaveTimer);
      window.__employerSettingsSaveTimer = window.setTimeout(() => setSaveMessage(''), 2500);
    } catch (error) {
      setSaveMessage(error?.response?.data?.message || t('employer.settings.messages.passwordUpdateFailed'));
      window.clearTimeout(window.__employerSettingsSaveTimer);
      window.__employerSettingsSaveTimer = window.setTimeout(() => setSaveMessage(''), 4000);
    }
  };

  const resetPasswordForm = () => {
    setShowPasswordEditor(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  useEffect(() => {
    const selectedTheme = appearanceSettings.theme === 'System'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light'
      : appearanceSettings.theme;

    if (selectedTheme === 'Dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [appearanceSettings.theme]);

  const activeTabMeta = tabs.find((t) => t.value === activeTab);
  const activeTabLabel = activeTabMeta ? t(activeTabMeta.labelKey) : activeTab;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Account':
        return (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#0A4FA8]">{t('employer.settings.account.badge')}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">{t('employer.settings.account.title')}</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DCEAFD] text-[#0A4FA8]">
                  <FiUser className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#1769E0] to-[#0A4FA8] text-2xl font-bold text-white shadow-md">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Employer avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span>{account.fullName?.charAt(0)?.toUpperCase() || 'E'}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{account.fullName}</p>
                      <p className="text-sm text-slate-500">
                        {account.companyName
                          ? `${t('employer.settings.account.recruitmentLead')} • ${account.companyName}`
                          : t('employer.settings.account.recruitmentLead')}
                      </p>
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
                    {t('employer.settings.account.uploadPhoto')}
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">{t('employer.settings.account.fullName')}</label>
                      <input
                        value={account.fullName}
                        onChange={(event) => setAccount((prev) => ({ ...prev, fullName: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#1769E0] focus:ring-2 focus:ring-[#DCEAFD]"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">{t('employer.settings.account.jobTitle')}</label>
                      <input
                        value={t('employer.settings.account.recruitmentLead')}
                        readOnly
                        className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">{t('employer.settings.account.workEmail')}</label>
                      <div className="relative">
                        <FiMail className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          value={account.workEmail}
                          onChange={(event) => setAccount((prev) => ({ ...prev, workEmail: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#1769E0] focus:ring-2 focus:ring-[#DCEAFD]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">{t('employer.settings.account.phoneNumber')}</label>
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
                  <p className="text-sm font-medium text-slate-500">{t('employer.settings.security.badge')}</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">{t('employer.settings.security.title')}</h3>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#DCEAFD] text-[#0A4FA8]">
                  <FiLock className="h-5 w-5" />
                </div>
              </div>

              {!showPasswordEditor ? (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => navigate('/employer/settings/change-password')}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#1769E0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0D5BC4]"
                  >
                    <FiShield className="h-4 w-4" />
                    {t('employer.settings.security.changePassword')}
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">{t('employer.settings.security.currentPassword')}</label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#1769E0] focus:ring-2 focus:ring-[#DCEAFD]"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">{t('employer.settings.security.newPassword')}</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#1769E0] focus:ring-2 focus:ring-[#DCEAFD]"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">{t('employer.settings.security.confirmPassword')}</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#1769E0] focus:ring-2 focus:ring-[#DCEAFD]"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={resetPasswordForm}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={handlePasswordUpdate}
                      className="rounded-2xl bg-[#1769E0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0D5BC4]"
                    >
                      {t('employer.settings.saveChanges')}
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
                  <p className="text-sm font-medium text-amber-700">{t('employer.settings.notifications.badge')}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">{t('employer.settings.notifications.title')}</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <FiBell className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <h3 className="text-lg font-semibold text-slate-900">{t('employer.settings.notifications.emailNotifications')}</h3>
                  <div className="mt-4 space-y-4">
                    {[
                      { key: 'newApplicant', labelKey: 'employer.settings.notifications.items.newApplicant.label', descKey: 'employer.settings.notifications.items.newApplicant.description' },
                      { key: 'interviewReminder', labelKey: 'employer.settings.notifications.items.interviewReminder.label', descKey: 'employer.settings.notifications.items.interviewReminder.description' },
                      { key: 'jobExpirationReminder', labelKey: 'employer.settings.notifications.items.jobExpirationReminder.label', descKey: 'employer.settings.notifications.items.jobExpirationReminder.description' },
                      { key: 'weeklyReport', labelKey: 'employer.settings.notifications.items.weeklyReport.label', descKey: 'employer.settings.notifications.items.weeklyReport.description' },
                      { key: 'marketingEmails', labelKey: 'employer.settings.notifications.items.marketingEmails.label', descKey: 'employer.settings.notifications.items.marketingEmails.description' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3">
                        <div>
                          <p className="font-medium text-slate-800">{t(item.labelKey)}</p>
                          <p className="text-sm text-slate-500">{t(item.descKey)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleNotificationPreference(item.key)}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full ${notificationSettings[item.key] ? 'bg-[#1769E0]' : 'bg-slate-300'}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${notificationSettings[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <h3 className="text-lg font-semibold text-slate-900">{t('employer.settings.notifications.frequencyTitle')}</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {[
                      { value: 'Instant', key: 'employer.settings.notifications.frequencies.instant' },
                      { value: 'Daily', key: 'employer.settings.notifications.frequencies.daily' },
                      { value: 'Weekly', key: 'employer.settings.notifications.frequencies.weekly' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setNotificationSettings((prev) => ({ ...prev, frequency: option.value }))}
                        className={`rounded-2xl border p-3 text-left text-sm font-medium transition ${
                          notificationSettings.frequency === option.value
                            ? 'border-[#1769E0] bg-[#EAF2FE] text-[#1769E0]'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        {t(option.key)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button type="button" className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  {t('common.reset')}
                </button>
                <button type="button" onClick={saveSettings} className="rounded-2xl bg-[#1769E0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0D5BC4]">
                  {t('employer.settings.notifications.savePreferences')}
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
                  <p className="text-sm font-medium text-sky-700">{t('employer.settings.companyPref.badge')}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">{t('employer.settings.companyPref.title')}</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <FiBriefcase className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <h3 className="text-lg font-semibold text-slate-900">{t('employer.settings.companyPref.locationTitle')}</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">{t('employer.settings.companyPref.hiringLocation')}</label>
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
                      <label className="mb-2 block text-sm font-medium text-slate-700">{t('employer.settings.companyPref.defaultCurrency')}</label>
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
                      <label className="mb-2 block text-sm font-medium text-slate-700">{t('employer.settings.companyPref.defaultLanguage')}</label>
                      <select
                        value={companyPreferences.language}
                        onChange={(event) => setCompanyPreferences((prev) => ({ ...prev, language: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
                      >
                        <option>English</option>
                        <option>Amharic</option>
                        <option>Afaan Oromo</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">{t('employer.settings.companyPref.timezone')}</label>
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
                      <label className="mb-2 block text-sm font-medium text-slate-700">{t('employer.settings.companyPref.dateFormat')}</label>
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
                  <h3 className="text-lg font-semibold text-slate-900">{t('employer.settings.companyPref.jobSettingsTitle')}</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">{t('employer.settings.companyPref.jobDuration')}</label>
                      <input
                        value={companyPreferences.jobDuration}
                        onChange={(event) => setCompanyPreferences((prev) => ({ ...prev, jobDuration: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">{t('employer.settings.companyPref.employmentType')}</label>
                      <select
                        value={companyPreferences.employmentType}
                        onChange={(event) => setCompanyPreferences((prev) => ({ ...prev, employmentType: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
                      >
                        <option value="Full-time">{t('employer.postJob.jobTypeOptions.fullTime') || 'Full-time'}</option>
                        <option value="Part-time">{t('employer.postJob.jobTypeOptions.partTime') || 'Part-time'}</option>
                        <option value="Contract">{t('employer.postJob.jobTypeOptions.contract') || 'Contract'}</option>
                        <option value="Internship">{t('employer.postJob.jobTypeOptions.internship') || 'Internship'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">{t('employer.settings.companyPref.workMode')}</label>
                      <select
                        value={companyPreferences.workMode}
                        onChange={(event) => setCompanyPreferences((prev) => ({ ...prev, workMode: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
                      >
                        <option value="Hybrid">{t('employer.postJob.workModeOptions.hybrid') || 'Hybrid'}</option>
                        <option value="Remote">{t('employer.postJob.workModeOptions.remote') || 'Remote'}</option>
                        <option value="Onsite">{t('employer.postJob.workModeOptions.onSite') || 'Onsite'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">{t('employer.settings.companyPref.salaryCurrency')}</label>
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
                <h3 className="text-lg font-semibold text-slate-900">{t('employer.settings.companyPref.recruitmentPrefTitle')}</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {[
                    { key: 'autoCloseExpiredJobs', labelKey: 'employer.settings.companyPref.items.autoCloseExpiredJobs' },
                    { key: 'autoArchiveFilledJobs', labelKey: 'employer.settings.companyPref.items.autoArchiveFilledJobs' },
                    { key: 'requireCV', labelKey: 'employer.settings.companyPref.items.requireCV' },
                    { key: 'requireCoverLetter', labelKey: 'employer.settings.companyPref.items.requireCoverLetter' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3">
                      <span className="font-medium text-slate-800">{t(item.labelKey)}</span>
                      <button
                        type="button"
                        onClick={() => toggleCompanyPref(item.key)}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full ${companyPreferences[item.key] ? 'bg-[#1769E0]' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${companyPreferences[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button type="button" className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  {t('common.cancel')}
                </button>
                <button type="button" onClick={saveSettings} className="rounded-2xl bg-[#1769E0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0D5BC4]">
                  {t('employer.settings.saveChanges')}
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
                  <p className="text-sm font-medium text-violet-700">{t('employer.settings.appearance.badge')}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">{t('employer.settings.appearance.title')}</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  {appearanceSettings.theme === 'Dark' ? <FiMoon className="h-5 w-5" /> : <FiSun className="h-5 w-5" />}
                </div>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                <div className="space-y-6">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <h3 className="text-lg font-semibold text-slate-900">{t('employer.settings.appearance.theme')}</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {[
                        { value: 'Light', labelKey: 'employer.settings.appearance.themes.light' },
                        { value: 'Dark', labelKey: 'employer.settings.appearance.themes.dark' },
                        { value: 'System', labelKey: 'employer.settings.appearance.themes.system' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setTheme(option.value);
                            setAppearanceSettings((prev) => ({ ...prev, theme: option.value }));
                          }}
                          className={`rounded-2xl border p-4 text-left transition ${
                            appearanceSettings.theme === option.value
                              ? 'border-violet-500 bg-violet-50 text-violet-700'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-violet-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{t(option.labelKey)}</span>
                            {appearanceSettings.theme === option.value && <FiCheck className="h-4 w-4" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <h3 className="text-lg font-semibold text-slate-900">{t('employer.settings.appearance.dashboardLayout')}</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        { value: 'Compact', labelKey: 'employer.settings.appearance.layouts.compact' },
                        { value: 'Comfortable', labelKey: 'employer.settings.appearance.layouts.comfortable' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setAppearanceSettings((prev) => ({ ...prev, dashboardLayout: option.value }))}
                          className={`rounded-2xl border p-4 text-left transition ${
                            appearanceSettings.dashboardLayout === option.value
                              ? 'border-violet-500 bg-violet-50 text-violet-700'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-violet-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{t(option.labelKey)}</span>
                            {appearanceSettings.dashboardLayout === option.value && <FiCheck className="h-4 w-4" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <h3 className="text-lg font-semibold text-slate-900">{t('employer.settings.appearance.sidebar')}</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        { value: 'Expanded', labelKey: 'employer.settings.appearance.sidebars.expanded' },
                        { value: 'Collapsed', labelKey: 'employer.settings.appearance.sidebars.collapsed' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setAppearanceSettings((prev) => ({ ...prev, sidebar: option.value }))}
                          className={`rounded-2xl border p-4 text-left transition ${
                            appearanceSettings.sidebar === option.value
                              ? 'border-violet-500 bg-violet-50 text-violet-700'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-violet-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{t(option.labelKey)}</span>
                            {appearanceSettings.sidebar === option.value && <FiCheck className="h-4 w-4" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <h3 className="text-lg font-semibold text-slate-900">{t('employer.settings.appearance.primaryColor')}</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        { label: 'Green', key: 'employer.settings.appearance.colors.green', color: 'bg-emerald-500' },
                        { label: 'Blue', key: 'employer.settings.appearance.colors.blue', color: 'bg-sky-500' },
                        { label: 'Purple', key: 'employer.settings.appearance.colors.purple', color: 'bg-violet-500' },
                        { label: 'Orange', key: 'employer.settings.appearance.colors.orange', color: 'bg-orange-500' },
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
                            <span className="font-medium">{t(option.key)}</span>
                          </div>
                          {appearanceSettings.primaryColor === option.label && <FiCheck className="h-4 w-4" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <h3 className="text-lg font-semibold text-slate-900">{t('employer.settings.appearance.fontSize')}</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {[
                        { value: 'Small', labelKey: 'employer.settings.appearance.fontSizes.small' },
                        { value: 'Medium', labelKey: 'employer.settings.appearance.fontSizes.medium' },
                        { value: 'Large', labelKey: 'employer.settings.appearance.fontSizes.large' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setAppearanceSettings((prev) => ({ ...prev, fontSize: option.value }))}
                          className={`rounded-2xl border p-4 text-left transition ${
                            appearanceSettings.fontSize === option.value
                              ? 'border-violet-500 bg-violet-50 text-violet-700'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-violet-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{t(option.labelKey)}</span>
                            {appearanceSettings.fontSize === option.value && <FiCheck className="h-4 w-4" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-100 p-4">
                  <div className="flex items-center justify-between pb-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">{t('employer.settings.appearance.preview')}</p>
                      <h3 className="mt-1 text-xl font-semibold text-slate-900">{t('employer.settings.appearance.liveDashboard')}</h3>
                    </div>
                    <span className="rounded-full bg-[#DCEAFD] px-2.5 py-1 text-xs font-semibold text-[#0A4FA8]">
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
                          <p className="text-[11px] text-slate-400">{t('employer.settings.appearance.talentDashboard')}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-[#DCEAFD] px-2 py-1 text-[10px] font-semibold text-[#0A4FA8]">
                        {t('employer.settings.appearance.live')}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        { labelKey: 'employer.settings.appearance.openRoles', value: '18', tone: 'bg-[#DCEAFD] text-[#0A4FA8]' },
                        { labelKey: 'sidebar.interviews', value: '6', tone: 'bg-sky-100 text-sky-700' },
                        { labelKey: 'employer.settings.appearance.accepted', value: '24', tone: 'bg-violet-100 text-violet-700' },
                        { labelKey: 'employer.settings.appearance.avgScore', value: '89%', tone: 'bg-orange-100 text-orange-700' },
                      ].map((stat) => (
                        <div key={stat.labelKey} className={`rounded-2xl p-3 ${stat.tone}`}>
                          <p className="text-[11px] font-medium uppercase tracking-[0.2em] opacity-75">{t(stat.labelKey)}</p>
                          <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium">{t('employer.settings.appearance.hiringPipeline')}</span>
                        <span className="text-slate-500">{t('employer.settings.appearance.thisWeek')}</span>
                      </div>
                      <div className="flex items-end gap-2">
                        {[40, 58, 72, 68, 88, 96].map((height, index) => (
                          <div key={index} className="flex-1 rounded-t-xl bg-gradient-to-t from-[#1769E0] to-[#7FB0F0]" style={{ height: `${height}px` }} />
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                      >
                        {t('common.view')}
                      </button>
                      <button
                        type="button"
                        className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white ${
                          appearanceSettings.primaryColor === 'Green'
                            ? 'bg-[#1769E0]'
                            : appearanceSettings.primaryColor === 'Blue'
                              ? 'bg-sky-600'
                              : appearanceSettings.primaryColor === 'Purple'
                                ? 'bg-violet-600'
                                : 'bg-orange-600'
                        }`}
                      >
                        {t('employer.settings.appearance.viewDashboard')}
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
                  {t('common.reset')}
                </button>
                <button
                  type="button"
                  onClick={() => setTheme(appearanceSettings.theme)}
                  className="rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  {t('employer.settings.appearance.saveTheme')}
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
                  <p className="text-sm font-medium text-rose-700">{t('employer.settings.privacy.badge')}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">{t('employer.settings.privacy.title')}</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                  <FiShield className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <h3 className="text-lg font-semibold text-slate-900">{t('employer.settings.privacy.companyVisibility')}</h3>
                  <div className="mt-4 space-y-4">
                    {[
                      { key: 'publicCompanyProfile', labelKey: 'employer.settings.privacy.items.publicCompanyProfile.label', descKey: 'employer.settings.privacy.items.publicCompanyProfile.description' },
                      { key: 'showCompanyWebsite', labelKey: 'employer.settings.privacy.items.showCompanyWebsite.label', descKey: 'employer.settings.privacy.items.showCompanyWebsite.description' },
                      { key: 'showContactInformation', labelKey: 'employer.settings.privacy.items.showContactInformation.label', descKey: 'employer.settings.privacy.items.showContactInformation.description' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3">
                        <div>
                          <p className="font-medium text-slate-800">{t(item.labelKey)}</p>
                          <p className="text-sm text-slate-500">{t(item.descKey)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => togglePrivacy(item.key)}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full ${privacySettings[item.key] ? 'bg-[#1769E0]' : 'bg-slate-300'}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${privacySettings[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <h3 className="text-lg font-semibold text-slate-900">{t('employer.settings.privacy.communication')}</h3>
                  <div className="mt-4 space-y-4">
                    {[
                      { key: 'allowCandidateMessages', labelKey: 'employer.settings.privacy.items.allowCandidateMessages.label', descKey: 'employer.settings.privacy.items.allowCandidateMessages.description' },
                      { key: 'allowRecruiterInvitations', labelKey: 'employer.settings.privacy.items.allowRecruiterInvitations.label', descKey: 'employer.settings.privacy.items.allowRecruiterInvitations.description' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3">
                        <div>
                          <p className="font-medium text-slate-800">{t(item.labelKey)}</p>
                          <p className="text-sm text-slate-500">{t(item.descKey)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => togglePrivacy(item.key)}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full ${privacySettings[item.key] ? 'bg-[#1769E0]' : 'bg-slate-300'}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${privacySettings[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <h3 className="text-lg font-semibold text-slate-900">{t('employer.settings.privacy.security')}</h3>
                  <div className="mt-4 space-y-4">
                    {[
                      { key: 'hideEmailAddress', labelKey: 'employer.settings.privacy.items.hideEmailAddress.label', descKey: 'employer.settings.privacy.items.hideEmailAddress.description' },
                      { key: 'hidePhoneNumber', labelKey: 'employer.settings.privacy.items.hidePhoneNumber.label', descKey: 'employer.settings.privacy.items.hidePhoneNumber.description' },
                      { key: 'hideOfficeAddress', labelKey: 'employer.settings.privacy.items.hideOfficeAddress.label', descKey: 'employer.settings.privacy.items.hideOfficeAddress.description' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3">
                        <div>
                          <p className="font-medium text-slate-800">{t(item.labelKey)}</p>
                          <p className="text-sm text-slate-500">{t(item.descKey)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => togglePrivacy(item.key)}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full ${privacySettings[item.key] ? 'bg-[#1769E0]' : 'bg-slate-300'}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${privacySettings[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button type="button" onClick={saveSettings} className="rounded-2xl bg-[#1769E0] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0D5BC4]">
                  {t('employer.settings.privacy.savePrivacy')}
                </button>
              </div>
            </div>
          </div>
        );

      case 'Danger Zone':
        return (
          <div className="space-y-6">
            <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">{t('employer.settings.danger.badge')}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">{t('employer.settings.danger.title')}</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                  <FiAlertTriangle className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-red-800">{t('employer.settings.danger.deactivateTitle')}</h3>
                      <p className="mt-2 text-sm text-red-700">{t('employer.settings.danger.deactivateDesc')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeactivateAccount}
                      className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                      {t('employer.settings.danger.deactivateBtn')}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-red-800">{t('employer.settings.danger.deleteTitle')}</h3>
                      <p className="mt-2 text-sm text-red-700">{t('employer.settings.danger.deleteDesc')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className={`rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition ${deleteConfirm.trim().toUpperCase() === 'DELETE' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-300 cursor-not-allowed'}`}
                      disabled={deleteConfirm.trim().toUpperCase() !== 'DELETE'}
                    >
                      {t('employer.settings.danger.deleteBtn')}
                    </button>
                  </div>

                  <div className="mt-4 rounded-2xl border border-red-200 bg-white p-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700">{t('employer.settings.danger.typeDeleteLabel')}</label>
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
                      <h3 className="text-xl font-semibold text-amber-900">{t('employer.settings.danger.exportTitle')}</h3>
                      <p className="mt-2 text-sm text-amber-800">{t('employer.settings.danger.exportDesc')}</p>
                      <div className="mt-4 flex items-center justify-between rounded-2xl border border-amber-200 bg-white p-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <FiDownload className="h-4 w-4 text-amber-600" />
                          {t('employer.settings.danger.companyDataExport')}
                        </div>
                        <button type="button" className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-700">
                          {t('employer.settings.danger.downloadBtn')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <div className="flex items-center gap-2 font-semibold">
                    <FiAlertTriangle className="h-4 w-4" />
                    {t('employer.settings.danger.warningTitle')}
                  </div>
                  <p className="mt-2">{t('employer.settings.danger.warningDesc')}</p>
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
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#0A4FA8]">{t('employer.settings.headerBadge')}</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{t('employer.settings.headerTitle')}</h1>
          </div>

          <div className="flex items-center gap-3">
            {saveMessage && (
              <span className="inline-flex items-center gap-2 rounded-full border border-[#A8C8F5] bg-[#EAF2FE] px-3 py-1.5 text-sm font-medium text-[#0A4FA8]">
                <span className="flex h-2.5 w-2.5 rounded-full bg-[#1769E0]" />
                {saveMessage}
              </span>
            )}
            <button
              type="button"
              onClick={saveSettings}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#1769E0] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0D5BC4]"
            >
              {t('employer.settings.saveChanges')}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            const Icon = tab.value === 'Account'
              ? FiUser
              : tab.value === 'Notifications'
                ? FiBell
                : tab.value === 'Company Preferences'
                  ? FiBriefcase
                  : tab.value === 'Appearance'
                    ? theme === 'Dark' ? FiMoon : FiSun
                    : tab.value === 'Privacy'
                      ? FiShield
                      : tab.value === 'Billing'
                        ? FiMail
                        : FiLock;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-white text-[#1769E0] shadow-sm ring-1 ring-[#DCEAFD]'
                    : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(tab.labelKey)}
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
              <p className="text-sm text-slate-500">{t('employer.settings.currentSection')}</p>
              <h2 className="text-lg font-semibold text-slate-900">{activeTabLabel}</h2>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
            <span>{t('employer.settings.breadcrumbSettings')}</span>
            <FiChevronRight className="h-4 w-4" />
            <span className="font-medium text-slate-700">{activeTabLabel}</span>
          </div>
        </div>

        {renderTabContent()}
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#0A4FA8]">{t('employer.settings.security.badge')}</p>
                <h3 className="mt-1 text-2xl font-semibold text-slate-900">{t('employer.settings.security.changePasswordModalTitle')}</h3>
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
                <label className="mb-2 block text-sm font-medium text-slate-700">{t('employer.settings.security.currentPassword')}</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#1769E0] focus:ring-2 focus:ring-[#DCEAFD]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">{t('employer.settings.security.newPassword')}</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#1769E0] focus:ring-2 focus:ring-[#DCEAFD]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">{t('employer.settings.security.confirmPassword')}</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#1769E0] focus:ring-2 focus:ring-[#DCEAFD]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-[#1769E0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0D5BC4]"
                >
                  {t('employer.settings.security.updatePasswordBtn')}
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
