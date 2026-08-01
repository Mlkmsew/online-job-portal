import { FiSettings, FiShield, FiBell, FiUser } from 'react-icons/fi';

const Settings = () => {
  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-8">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">Manage your profile, notification preferences, account security, and application settings from one place.</p>
        </div>
        <div className="rounded-full border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">Secure account</div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[
          { title: 'Profile Settings', description: 'Update your name, headline, contact details, and preferences.', icon: FiUser },
          { title: 'Notifications', description: 'Choose how you want to receive alerts and reminders.', icon: FiBell },
          { title: 'Account Security', description: 'Change your password and review active sessions.', icon: FiShield },
          { title: 'Privacy Controls', description: 'Manage data sharing and communication preferences.', icon: FiSettings },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-3xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm hover:border-teal-300 transition">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-100 dark:bg-slate-900 p-3 text-slate-700 dark:text-slate-200">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h2>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
              <button className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition">
                Manage {item.title}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Settings;
