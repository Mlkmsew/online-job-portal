import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';

const JobSeekerDashboard = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [meRes, bookmarksRes, appsRes, notifsRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/bookmarks'),
          api.get('/applications/my'),
          api.get('/notifications?limit=10'),
        ]);

        setProfile(meRes.data?.data || meRes.data);
        setBookmarks(Array.isArray(bookmarksRes.data) ? bookmarksRes.data : bookmarksRes.data?.data || []);
        setApplications(Array.isArray(appsRes.data) ? appsRes.data : appsRes.data?.data || []);
        setNotifications(Array.isArray(notifsRes.data) ? notifsRes.data : notifsRes.data?.data || []);
      } catch (err) {
        console.error(err);
        toast.error(t('dashboard.failedLoadData') || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [t]);

  const handleUploadCV = async (file) => {
    if (!file) return;
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const allowedExts = ['.pdf', '.doc', '.docx'];
    const ext = file.name?.split('.').pop()?.toLowerCase();

    if (!allowedMimes.includes(file.type) && !allowedExts.includes('.' + ext)) {
      toast.error(t('dashboard.allowedFilesError') || 'Only PDF, DOC, or DOCX files are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('dashboard.fileTooLargeError') || 'File too large. Maximum 10MB allowed.');
      return;
    }
    const form = new FormData();
    form.append('cv', file);
    setUploading(true);
    try {
      await api.put('/auth/upload-cv', form);
      toast.success(t('dashboard.cvUploadedSuccess') || 'CV uploaded');
      const meRes = await api.get('/auth/me');
      setProfile(meRes.data?.data || meRes.data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || t('dashboard.uploadFailed') || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-6">{t('common.loading')}</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">{t('nav.dashboard')}</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <h3 className="text-sm text-gray-500">{t('dashboard.profileCompletion') || 'Profile Completion'}</h3>
          <div className="text-3xl font-bold">{profile?.profileCompleteness || 0}%</div>
        </div>
        <div className="card p-4">
          <h3 className="text-sm text-gray-500">{t('dashboard.savedJobs')}</h3>
          <div className="text-3xl font-bold">{bookmarks.length}</div>
        </div>
        <div className="card p-4">
          <h3 className="text-sm text-gray-500">{t('dashboard.totalApplications')}</h3>
          <div className="text-3xl font-bold">{applications.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="card p-4 mb-4">
            <h3 className="font-semibold mb-2">{t('sidebar.applications')}</h3>
            {applications.length === 0 ? (
              <div className="text-sm text-gray-500">{t('dashboard.noApplicationsYet') || 'No applications yet.'}</div>
            ) : (
              <ul className="space-y-3">
                {applications.map(a => (
                  <li key={a._id} className="p-3 border rounded">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{a.job?.title}</div>
                        <div className="text-sm text-gray-500">{a.company?.name} • {new Date(a.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="text-sm">{a.status}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-4">
            <h3 className="font-semibold mb-2">{t('sidebar.savedJobs')}</h3>
            {bookmarks.length === 0 ? (
              <div className="text-sm text-gray-500">{t('dashboard.noSavedJobsYet') || 'No saved jobs.'}</div>
            ) : (
              <ul className="space-y-3">
                {bookmarks.map(b => (
                  <li key={b._id} className="p-3 border rounded flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{b.job?.title}</div>
                      <div className="text-sm text-gray-500">{b.job?.company?.name}</div>
                    </div>
                    <div>
                      <a href={`/jobs/${b.job?._id}`} className="text-sm text-blue-600">{t('common.view')}</a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside>
          <div className="card p-4 mb-4">
            <h3 className="font-semibold mb-2">{t('dashboard.notifications') || 'Notifications'}</h3>
            {notifications.length === 0 ? (
              <div className="text-sm text-gray-500">{t('dashboard.noNotificationsYet') || 'No notifications.'}</div>
            ) : (
              <ul className="space-y-2">
                {notifications.map(n => (
                  <li key={n._id} className={`p-2 rounded ${n.isRead ? '' : 'bg-gray-50'}`}>
                    <div className="text-sm">{n.title}</div>
                    <div className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-4">
            <h3 className="font-semibold mb-2">{t('dashboard.resumeManager') || 'Resume Manager'}</h3>
            {profile?.cv ? (
              <div className="mb-2">
                <a href={profile.cv} target="_blank" rel="noreferrer" className="text-blue-600">{t('dashboard.viewUploadedCV') || 'View uploaded CV'}</a>
              </div>
            ) : (
              <div className="text-sm text-gray-500 mb-2">{t('dashboard.noCVUploaded') || 'No CV uploaded.'}</div>
            )}
            <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => handleUploadCV(e.target.files[0])} disabled={uploading} />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
