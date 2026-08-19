import { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { updateProfile, uploadAvatar, uploadCV, deleteAvatar } from '../../../store/slices/authSlice';
import { calculateProfileCompletion } from '../../../utils/resumeCompletion';
import { toast } from 'react-hot-toast';
import {
  FiUser, FiMail, FiPhone, FiMapPin, FiBriefcase, FiClock,
  FiPlus, FiTrash2, FiX, FiCamera, FiStar,
  FiAward, FiGlobe, FiLink, FiEdit2, FiUploadCloud, FiExternalLink,
  FiFileText, FiBookOpen, FiCalendar, FiBarChart2, FiChevronDown, FiFile,
} from 'react-icons/fi';

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const normalizeSkillEntry = (v) => (!v ? '' : String(v).trim().replace(/,+$/, ''));

const parseSkillTags = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).map((t) => String(t).trim());
  const raw = normalizeSkillEntry(value);
  if (!raw) return [];
  return raw.split(/[,;\n]+/).map((i) => i.trim()).filter(Boolean);
};

const getInitialFormData = (user) => {
  const skillNames =
    Array.isArray(user?.skillNames) && user.skillNames.length > 0
      ? user.skillNames
      : Array.isArray(user?.skills)
      ? user.skills.map((s) => (typeof s === 'object' ? s.name : s)).filter(Boolean)
      : [];

  return {
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    gender: user?.gender || '',
    headline: user?.headline || '',
    currentRole: user?.currentRole || '',
    bio: user?.bio || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: {
      city: user?.location?.city || '',
      address: user?.location?.address || '',
    },
    experienceYears: user?.experienceYears || user?.resumeAnalysis?.experienceYears || '',
    salaryExpectation: user?.salaryExpectation || '',
    availability: user?.availability || '',
    skills: skillNames,
    experienceDetails: Array.isArray(user?.experienceDetails)
      ? user.experienceDetails
      : user?.experience
      ? [{ title: '', company: '', location: '', startDate: '', endDate: '', description: user.experience }]
      : [],
    educationDetails: Array.isArray(user?.educationDetails)
      ? user.educationDetails
      : Array.isArray(user?.education)
      ? user.education.map((item) => (typeof item === 'object' ? item : { degree: item, institution: '', location: '', startDate: '', endDate: '', description: '' }))
      : [],
    languages: Array.isArray(user?.languages) ? user.languages : [],
    portfolio: Array.isArray(user?.portfolio) ? user.portfolio : [],
  };
};

const calculateProfileStrength = (user) => calculateProfileCompletion(user);

/* ── Main Component ────────────────────────────────────────────────────────── */
const JobSeekerProfile = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState(() => getInitialFormData(user));
  const [avatarFile, setAvatarFile] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // Modals state
  const [activeModal, setActiveModal] = useState(null);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [modalItemData, setModalItemData] = useState({});
  const [skillInput, setSkillInput] = useState('');

  const avatarInputRef = useRef(null);

  // Replace CV dropdown state — Resume Builder CVs come from localStorage
  const resumeStorageKey = `ethiojob_resumes_${user?._id || user?.id || user?.email || token || 'guest'}`;
  const activeCVStorageKey = `ethiojob_active_cv_${user?._id || user?.id || user?.email || token || 'guest'}`;
  const [cvMenuOpen, setCvMenuOpen] = useState(false);
  const [builderCVs, setBuilderCVs] = useState([]);
  const [activeBuilderCV, setActiveBuilderCV] = useState(null);
  const cvMenuRef = useRef(null);
  const cvFileInputRef = useRef(null);

  useEffect(() => {
    setFormData(getInitialFormData(user));
  }, [user]);

  // Load Resume Builder CVs from the same localStorage the Resume Builder uses
  useEffect(() => {
    const loadBuilderCVs = () => {
      try {
        const stored = localStorage.getItem(resumeStorageKey);
        const legacyStored = localStorage.getItem('ethiojob_resumes');
        const parsed = stored
          ? JSON.parse(stored)
          : legacyStored
          ? JSON.parse(legacyStored)
          : [];
        setBuilderCVs(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        setBuilderCVs([]);
      }

      try {
        const activeStored = localStorage.getItem(activeCVStorageKey);
        setActiveBuilderCV(activeStored ? JSON.parse(activeStored) : null);
      } catch (error) {
        setActiveBuilderCV(null);
      }
    };

    loadBuilderCVs();
    window.addEventListener('storage', loadBuilderCVs);
    return () => window.removeEventListener('storage', loadBuilderCVs);
  }, [resumeStorageKey, activeCVStorageKey]);

  // Close the Replace CV dropdown on outside click / Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cvMenuRef.current && !cvMenuRef.current.contains(e.target)) {
        setCvMenuOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setCvMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const profileStrength = useMemo(() => calculateProfileStrength(user), [user]);

  const skillNames = useMemo(() => {
    if (Array.isArray(user?.skillNames) && user.skillNames.length > 0) return user.skillNames;
    if (Array.isArray(user?.skills) && user.skills.length > 0) {
      return user.skills.map((s) => (typeof s === 'object' ? s.name : s)).filter(Boolean);
    }
    return [];
  }, [user]);

  const experienceItems = useMemo(() => {
    if (Array.isArray(user?.experienceDetails) && user.experienceDetails.length > 0) return user.experienceDetails;
    if (user?.experience) return [{ title: 'Work History', company: '', location: '', startDate: '', endDate: '', description: user.experience }];
    return [];
  }, [user]);

  const educationItems = useMemo(() => {
    if (Array.isArray(user?.educationDetails) && user.educationDetails.length > 0) return user.educationDetails;
    if (Array.isArray(user?.education)) return user.education.map((e) => (typeof e === 'object' ? e : { degree: e, institution: '' }));
    return [];
  }, [user]);

  const languageItems = useMemo(() => (Array.isArray(user?.languages) ? user.languages : []), [user]);
  const portfolioItems = useMemo(() => (Array.isArray(user?.portfolio) ? user.portfolio : []), [user]);
  const resumeUploaded = Boolean(user?.cv);
  const resumeFileName = user?.cvOriginalName || (user?.cv ? user.cv.split('/').pop() : null);
  const resumeUrl = user?.cv || null;
  const initials = `${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || ''}`;

  /* Save updated profile payload directly to Database */
  const persistProfile = async (updatedFields, successMessage = 'Profile updated successfully') => {
    setSaving(true);
    try {
      const payload = {
        firstName: updatedFields.firstName !== undefined ? updatedFields.firstName : formData.firstName,
        lastName: updatedFields.lastName !== undefined ? updatedFields.lastName : formData.lastName,
        gender: updatedFields.gender !== undefined ? updatedFields.gender : formData.gender,
        headline: updatedFields.headline !== undefined ? updatedFields.headline : formData.headline,
        currentRole: updatedFields.currentRole !== undefined ? updatedFields.currentRole : formData.currentRole,
        phone: updatedFields.phone !== undefined ? updatedFields.phone : formData.phone,
        bio: updatedFields.bio !== undefined ? updatedFields.bio : formData.bio,
        location: updatedFields.location !== undefined ? updatedFields.location : formData.location,
        experienceYears: updatedFields.experienceYears !== undefined ? updatedFields.experienceYears : formData.experienceYears,
        salaryExpectation: updatedFields.salaryExpectation !== undefined ? updatedFields.salaryExpectation : formData.salaryExpectation,
        availability: updatedFields.availability !== undefined ? updatedFields.availability : formData.availability,
        skillNames: updatedFields.skills !== undefined ? parseSkillTags(updatedFields.skills) : parseSkillTags(formData.skills),
        experienceDetails: updatedFields.experienceDetails !== undefined ? updatedFields.experienceDetails : formData.experienceDetails,
        educationDetails: updatedFields.educationDetails !== undefined ? updatedFields.educationDetails : formData.educationDetails,
        languages: updatedFields.languages !== undefined ? updatedFields.languages : formData.languages,
        portfolio: updatedFields.portfolio !== undefined ? updatedFields.portfolio : formData.portfolio,
      };

      await dispatch(updateProfile(payload)).unwrap();

      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        await dispatch(uploadAvatar(fd)).unwrap();
        setAvatarFile(null);
      }

      if (cvFile) {
        const fd = new FormData();
        fd.append('cv', cvFile);
        await dispatch(uploadCV(fd)).unwrap();
        setCvFile(null);
      }

      toast.success(successMessage);
      setActiveModal(null);
      setEditingItemIndex(null);
      setModalItemData({});
    } catch (err) {
      toast.error(err || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  /* Direct Avatar upload handler */
  const handleAvatarSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      await dispatch(uploadAvatar(fd)).unwrap();
      toast.success('Profile photo updated!');
      setAvatarFile(null);
    } catch (err) {
      toast.error('Failed to upload profile photo.');
    }
  };

  /* Direct Avatar delete handler */
  const handleDeleteAvatar = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    try {
      await dispatch(deleteAvatar()).unwrap();
      toast.success('Profile photo removed.');
      setAvatarFile(null);
    } catch (err) {
      toast.error('Failed to remove photo.');
    }
  };

  /* Direct CV upload handler */
  const handleCVSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const ext = file.name?.split('.').pop()?.toLowerCase();
    if (!allowed.includes(file.type) && !['pdf', 'doc', 'docx'].includes(ext)) {
      toast.error('Only PDF, DOC, or DOCX files are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File limit is 10MB.');
      return;
    }
    setCvFile(file);
    const fd = new FormData();
    fd.append('cv', file);
    try {
      await dispatch(uploadCV(fd)).unwrap();
      localStorage.removeItem(activeCVStorageKey);
      setActiveBuilderCV(null);
      toast.success('Resume / CV uploaded successfully!');
      setCvFile(null);
    } catch (err) {
      toast.error(err || 'Failed to upload resume.');
    }
  };

  /* Resume Builder CV helpers for the Replace CV dropdown */
  const getResumeCreatedAt = (resume) => {
    if (resume?.createdAt) return new Date(resume.createdAt);
    const match = /resume_(\d+)/.exec(resume?.id || '');
    if (match) {
      const ts = Number(match[1]);
      if (!Number.isNaN(ts)) return new Date(ts);
    }
    return null;
  };

  const formatResumeDate = (resume) => {
    const d = getResumeCreatedAt(resume);
    return d && !Number.isNaN(d.getTime())
      ? d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
      : null;
  };

  const handleSelectBuilderCV = (resume) => {
    const selection = {
      id: resume.id,
      title: resume.title || 'Untitled Resume',
      createdAt: getResumeCreatedAt(resume)?.toISOString() || null,
    };
    try {
      localStorage.setItem(activeCVStorageKey, JSON.stringify(selection));
    } catch (error) {
      console.error('Failed to persist active CV:', error);
    }
    setActiveBuilderCV(selection);
    setCvMenuOpen(false);
    toast.success(t('profile.builderCVActive') || 'Resume Builder CV set as your active CV');
  };

  const handleUploadFromFile = () => {
    setCvMenuOpen(false);
    cvFileInputRef.current?.click();
  };

  /* Modal item helpers */
  const openAddModal = (type) => {
    setActiveModal(type);
    setEditingItemIndex(null);
    if (type === 'education') setModalItemData({ degree: '', institution: '', location: '', startDate: '', endDate: '', description: '' });
    if (type === 'experience') setModalItemData({ title: '', company: '', location: '', startDate: '', endDate: '', description: '' });
    if (type === 'languages') setModalItemData({ name: '', level: 'Fluent' });
    if (type === 'portfolio') setModalItemData({ label: '', url: '' });
    if (type === 'header') {
      setModalItemData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        headline: formData.headline,
        phone: formData.phone,
        city: formData.location?.city || '',
        address: formData.location?.address || '',
      });
    }
    if (type === 'bio') setModalItemData({ bio: formData.bio || '', currentRole: formData.currentRole || '', experienceYears: formData.experienceYears || '', salaryExpectation: formData.salaryExpectation || '', availability: formData.availability || '' });
    if (type === 'skills') {
      setModalItemData({ skills: [...(formData.skills || [])] });
      setSkillInput('');
    }
  };

  const openEditModal = (type, index, item) => {
    setActiveModal(type);
    setEditingItemIndex(index);
    setModalItemData({ ...item });
  };

  const handleDeleteItem = async (sectionKey, index) => {
    if (!window.confirm('Are you sure you want to remove this item?')) return;
    const currentList = [...(formData[sectionKey] || [])];
    currentList.splice(index, 1);
    await persistProfile({ [sectionKey]: currentList }, 'Item removed.');
  };

  const handleSaveModalItem = async (e) => {
    e.preventDefault();
    if (activeModal === 'header') {
      const location = { city: modalItemData.city, address: modalItemData.address };
      await persistProfile({
        firstName: modalItemData.firstName,
        lastName: modalItemData.lastName,
        gender: modalItemData.gender,
        headline: modalItemData.headline,
        phone: modalItemData.phone,
        location,
      }, 'Header summary updated.');
    } else if (activeModal === 'bio') {
      await persistProfile({
        bio: modalItemData.bio,
        currentRole: modalItemData.currentRole,
        experienceYears: modalItemData.experienceYears,
        salaryExpectation: modalItemData.salaryExpectation,
        availability: modalItemData.availability,
      }, 'Bio & overview updated.');
    } else if (activeModal === 'skills') {
      await persistProfile({ skills: modalItemData.skills }, 'Skills updated.');
    } else if (['education', 'experience', 'languages', 'portfolio'].includes(activeModal)) {
      const sectionKey = activeModal === 'education' ? 'educationDetails' : activeModal === 'experience' ? 'experienceDetails' : activeModal;
      const currentList = [...(formData[sectionKey] || [])];
      if (editingItemIndex !== null) {
        currentList[editingItemIndex] = modalItemData;
      } else {
        currentList.push(modalItemData);
      }
      await persistProfile({ [sectionKey]: currentList }, `${activeModal.charAt(0).toUpperCase() + activeModal.slice(1)} updated.`);
    }
  };

  const addSkillTagToModal = () => {
    const tag = skillInput.trim();
    if (!tag) return;
    const current = modalItemData.skills || [];
    if (!current.some((s) => s.toLowerCase() === tag.toLowerCase())) {
      setModalItemData({ skills: [...current, tag] });
    }
    setSkillInput('');
  };

  const removeSkillTagFromModal = (idx) => {
    const current = modalItemData.skills || [];
    setModalItemData({ skills: current.filter((_, i) => i !== idx) });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* ═════════════════════════════════════════════════════════════════════
          HEADER CARD — 100% REAL DATABASE DATA ONLY (NO HARDCODED MOCKS)
         ═════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1769E0] via-[#0D5BC4] to-[#14213D] p-6 text-white shadow-lg">
        
        {/* Top-Right Progress Bar & Percentage */}
        <div className="sm:absolute sm:top-5 sm:right-6 flex flex-col items-end mb-4 sm:mb-0">
          <div className="w-48 h-3.5 bg-white/90 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className="h-full bg-[#7DD3FC] rounded-full transition-all duration-500"
              style={{ width: `${profileStrength}%` }}
            />
          </div>
          <span className="mt-1 text-xs font-bold text-white tracking-wide">{profileStrength}% {t('profile.complete')}</span>
        </div>

        {/* Header Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-1">
          
          {/* Column 1: Avatar, Name, Gender, Contacts from Real Database */}
          <div className="md:col-span-5 flex items-start gap-4">
              {/* Avatar Circle with replace button at bottom-left and delete button at bottom-right */}
              <div className="relative flex-shrink-0 group">
                <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-white/70 bg-slate-200 shadow-md flex items-center justify-center">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <svg className="h-20 w-20 text-slate-400 fill-current" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-1 left-0 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#1769E0] shadow-md transition hover:scale-110"
                  title={user?.avatar ? t('profile.replaceCV') : t('profile.uploadCV')}
                >
                  <FiCamera className="h-3.5 w-3.5" />
                </button>
                {user?.avatar && (
                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    className="absolute bottom-1 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-white shadow-md transition hover:scale-110"
                    title={t('common.delete')}
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
              </div>

            {/* Name, Gender, Contact Vertical List */}
            <div className="space-y-1 min-w-0 flex-1">
              {/* Name row with inline edit icon */}
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white leading-tight truncate">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Job Seeker'}
                </h1>
                <button
                  type="button"
                  onClick={() => openAddModal('header')}
                  className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-white/20 hover:bg-white/40 text-white transition hover:scale-110 shadow"
                  title={t('common.edit')}
                >
                  <FiEdit2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-sm font-medium text-white/90">
                {user?.gender || formData.gender || '-'}
              </p>

              {/* Vertical Contact Info */}
              <div className="space-y-1 pt-1 text-xs text-white/90 font-medium">
                <div className="flex items-center gap-2 truncate">
                  <FiMapPin className="h-3.5 w-3.5 flex-shrink-0 text-white" />
                  <span className="truncate">{[formData.location?.city, formData.location?.address].filter(Boolean).join(', ') || '-'}</span>
                </div>
                <div className="flex items-center gap-2 truncate">
                  <FiMail className="h-3.5 w-3.5 flex-shrink-0 text-white" />
                  <span className="truncate">{user?.email || '-'}</span>
                </div>
                <div className="flex items-center gap-2 truncate">
                  <FiPhone className="h-3.5 w-3.5 flex-shrink-0 text-white" />
                  <span>{user?.phone || formData.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-2 truncate">
                  <FiBriefcase className="h-3.5 w-3.5 flex-shrink-0 text-white" />
                  <span className="truncate">{user?.headline || formData.headline || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Real Education List from Database */}
          <div className="md:col-span-4 space-y-2 border-t md:border-t-0 md:border-l border-white/20 pt-4 md:pt-0 md:pl-6">
            <h2 className="text-base font-bold text-white">{t('profile.education')}</h2>
            <div className="space-y-1.5 text-xs text-white/90 font-medium">
              {educationItems.length > 0 ? (
                <>
                  <div className="flex items-center gap-2">
                    <FiBookOpen className="h-3.5 w-3.5 flex-shrink-0 text-white" />
                    <span className="font-semibold">{educationItems[0]?.institution || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiAward className="h-3.5 w-3.5 flex-shrink-0 text-white" />
                    <span>{educationItems[0]?.degree || '-'}</span>
                  </div>
                  {educationItems[0]?.location && (
                    <div className="flex items-center gap-2">
                      <FiMapPin className="h-3.5 w-3.5 flex-shrink-0 text-white" />
                      <span>{educationItems[0].location}</span>
                    </div>
                  )}
                  {(educationItems[0]?.startDate || educationItems[0]?.endDate) && (
                    <div className="flex items-center gap-2">
                      <FiCalendar className="h-3.5 w-3.5 flex-shrink-0 text-white" />
                      <span>{educationItems[0].startDate || ''} {educationItems[0].endDate ? `- ${educationItems[0].endDate}` : ''}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-white/70 italic text-xs">{t('profile.noEducation')}</p>
              )}
            </div>
          </div>

          {/* Column 3: Real Skills List from Database */}
          <div className="md:col-span-3 space-y-2 border-t md:border-t-0 md:border-l border-white/20 pt-4 md:pt-0 md:pl-6">
            <h2 className="text-base font-bold text-white">{t('profile.skills')}</h2>
            <div className="space-y-1.5 text-xs text-white/90 font-medium">
              {skillNames.length > 0 ? (
                skillNames.slice(0, 4).map((sk, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-white font-bold">➔</span>
                    <span>{sk}</span>
                  </div>
                ))
              ) : (
                <p className="text-white/70 italic text-xs">{t('profile.noSkills')}</p>
              )}
            </div>
          </div>

        </div>
      </section>


      {/* ═════════════════════════════════════════════════════════════════════
          SCROLLABLE CV SECTIONS (EXACT ORDER)
         ═════════════════════════════════════════════════════════════════════ */}

      {/* SECTION 1: BIO INFORMATION */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-[#1769E0]">
              <FiUser className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#1769E0]">{t('profile.bioInformation')}</h2>
          </div>
          <button
            type="button"
            onClick={() => openAddModal('bio')}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#1769E0] hover:text-[#0D5BC4] transition"
          >
            <FiEdit2 className="h-3.5 w-3.5" /> {t('profile.editBio')}
          </button>
        </div>

        {formData.bio || formData.currentRole || formData.experienceYears || formData.salaryExpectation ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">{t('profile.bioOverview')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {formData.bio || t('profile.noBioDesc')}
              </p>
            </div>

            <div className="space-y-2 bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 text-xs">
              <h3 className="font-bold text-slate-700 uppercase tracking-wider">{t('profile.bioOverview')}</h3>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">{t('employer.postJob.jobTitle')}</span>
                  <span className="font-semibold text-slate-800">{formData.currentRole || t('jobs.any')}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">{t('jobs.experience')}</span>
                  <span className="font-semibold text-slate-800">
                    {formData.experienceYears ? `${formData.experienceYears} Years` : t('jobs.any')}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">{t('jobs.salary')}</span>
                  <span className="font-semibold text-slate-800">{formData.salaryExpectation || t('jobs.any')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('jobs.workMode')}</span>
                  <span className="font-semibold text-slate-800">{formData.availability || t('jobs.any')}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-slate-500">{t('profile.noBio')}</p>
            <p className="text-xs text-slate-400 mt-1">{t('profile.noBioDesc')}</p>
            <button
              type="button"
              onClick={() => openAddModal('bio')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-[#1769E0] hover:bg-blue-100 transition"
            >
              <FiPlus className="h-4 w-4" /> {t('profile.addBio')}
            </button>
          </div>
        )}
      </section>


      {/* SECTION 2: EDUCATION */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-[#1769E0]">
              <FiBookOpen className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#1769E0]">{t('profile.education')}</h2>
          </div>
          <button
            type="button"
            onClick={() => openAddModal('education')}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#1769E0] hover:text-[#0D5BC4] transition"
          >
            <FiEdit2 className="h-3.5 w-3.5" /> {t('profile.editEducation')}
          </button>
        </div>

        {educationItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {educationItems.map((edu, idx) => (
              <div key={idx} className="group relative rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:border-blue-200 hover:bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{edu.degree || t('employer.postJob.educationRequired')}</h3>
                    <p className="text-xs font-semibold text-[#1769E0] mt-0.5">{edu.institution || t('profile.education')}</p>
                    {(edu.startDate || edu.endDate || edu.location) && (
                      <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                        {(edu.startDate || edu.endDate) && (
                          <span className="flex items-center gap-1">
                            <FiCalendar className="h-3 w-3 text-slate-400" />
                            {edu.startDate || ''} {edu.endDate ? `– ${edu.endDate}` : ''}
                          </span>
                        )}
                        {edu.location && (
                          <span className="flex items-center gap-1">
                            <FiMapPin className="h-3 w-3 text-slate-400" />
                            {edu.location}
                          </span>
                        )}
                      </p>
                    )}
                    {edu.description && (
                      <p className="text-xs text-slate-600 mt-2 line-clamp-3">{edu.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal('education', idx, edu)}
                      className="p-1.5 text-slate-400 hover:text-[#1769E0] transition"
                      title={t('common.edit')}
                    >
                      <FiEdit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem('educationDetails', idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition"
                      title={t('common.delete')}
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-slate-500">{t('profile.noEducation')}</p>
            <p className="text-xs text-slate-400 mt-1">{t('profile.noEducationDesc')}</p>
            <button
              type="button"
              onClick={() => openAddModal('education')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-[#1769E0] hover:bg-blue-100 transition"
            >
              <FiPlus className="h-4 w-4" /> {t('profile.addEducation')}
            </button>
          </div>
        )}
      </section>


      {/* SECTION 3: WORK EXPERIENCE */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-[#1769E0]">
              <FiBriefcase className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#1769E0]">{t('profile.workExperience')}</h2>
          </div>
          <button
            type="button"
            onClick={() => openAddModal('experience')}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#1769E0] hover:text-[#0D5BC4] transition"
          >
            <FiEdit2 className="h-3.5 w-3.5" /> {t('profile.editExperience')}
          </button>
        </div>

        {experienceItems.length > 0 ? (
          <div className="space-y-4">
            {experienceItems.map((exp, idx) => (
              <div key={idx} className="group relative rounded-xl border border-slate-200/80 bg-slate-50/40 p-4 transition hover:border-blue-200 hover:bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">{exp.title || t('employer.postJob.jobTitle')}</h3>
                    <p className="text-xs font-semibold text-[#1769E0]">{exp.company || t('jobs.company')}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                      {(exp.startDate || exp.endDate) && (
                        <span className="flex items-center gap-1">
                          <FiClock className="h-3 w-3 text-slate-400" />
                          {exp.startDate || ''} {exp.endDate ? `– ${exp.endDate}` : '– Present'}
                        </span>
                      )}
                      {exp.location && (
                        <span className="flex items-center gap-1">
                          <FiMapPin className="h-3 w-3 text-slate-400" />
                          {exp.location}
                        </span>
                      )}
                    </div>
                    {exp.description && (
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">{exp.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal('experience', idx, exp)}
                      className="p-1.5 text-slate-400 hover:text-[#1769E0] transition"
                      title={t('common.edit')}
                    >
                      <FiEdit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem('experienceDetails', idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition"
                      title={t('common.delete')}
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-slate-500">{t('profile.noExperience')}</p>
            <p className="text-xs text-slate-400 mt-1">{t('profile.noExperienceDesc')}</p>
            <button
              type="button"
              onClick={() => openAddModal('experience')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-[#1769E0] hover:bg-blue-100 transition"
            >
              <FiPlus className="h-4 w-4" /> {t('profile.addExperience')}
            </button>
          </div>
        )}
      </section>


      {/* SECTION 4: SKILLS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-[#1769E0]">
              <FiStar className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#1769E0]">{t('profile.skills') || 'Skills'}</h2>
          </div>
          <button
            type="button"
            onClick={() => openAddModal('skills')}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#1769E0] hover:text-[#0D5BC4] transition"
          >
            <FiEdit2 className="h-3.5 w-3.5" /> {t('profile.editSkills') || 'Edit Skills'}
          </button>
        </div>

        {skillNames.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skillNames.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1.5 text-xs font-bold text-[#1769E0]"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-slate-500">{t('profile.noSkills') || 'No skills added yet.'}</p>
            <p className="text-xs text-slate-400 mt-1">{t('profile.noSkillsDesc') || 'Add your technical and professional skills to help employers discover your profile.'}</p>
            <button
              type="button"
              onClick={() => openAddModal('skills')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-[#1769E0] hover:bg-blue-100 transition"
            >
              <FiPlus className="h-4 w-4" /> {t('profile.addSkills') || 'Add Skills'}
            </button>
          </div>
        )}
      </section>


      {/* SECTION 5: LANGUAGES */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-[#1769E0]">
              <FiGlobe className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#1769E0]">{t('profile.languages') || 'Languages'}</h2>
          </div>
          <button
            type="button"
            onClick={() => openAddModal('languages')}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#1769E0] hover:text-[#0D5BC4] transition"
          >
            <FiEdit2 className="h-3.5 w-3.5" /> {t('profile.editLanguages') || 'Edit Languages'}
          </button>
        </div>

        {languageItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {languageItems.map((lang, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-2.5">
                <div>
                  <p className="text-xs font-bold text-slate-800">{lang.name || 'Language'}</p>
                  <p className="text-[11px] font-medium text-[#1769E0]">{lang.level || 'Proficiency'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal('languages', idx, lang)}
                    className="p-1 text-slate-400 hover:text-[#1769E0] transition"
                    title="Edit"
                  >
                    <FiEdit2 className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem('languages', idx)}
                    className="p-1 text-slate-400 hover:text-red-600 transition"
                    title="Delete"
                  >
                    <FiTrash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-slate-500">{t('profile.noLanguages') || 'No languages added yet.'}</p>
            <p className="text-xs text-slate-400 mt-1">{t('profile.noLanguagesDesc') || 'Add languages you speak along with your proficiency level.'}</p>
            <button
              type="button"
              onClick={() => openAddModal('languages')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-[#1769E0] hover:bg-blue-100 transition"
            >
              <FiPlus className="h-4 w-4" /> {t('profile.addLanguage') || 'Add Language'}
            </button>
          </div>
        )}
      </section>


      {/* SECTION 6: PORTFOLIO & PROJECTS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-[#1769E0]">
              <FiLink className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#1769E0]">{t('profile.portfolio') || 'Portfolio & Projects'}</h2>
          </div>
          <button
            type="button"
            onClick={() => openAddModal('portfolio')}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#1769E0] hover:text-[#0D5BC4] transition"
          >
            <FiEdit2 className="h-3.5 w-3.5" /> {t('profile.editPortfolio') || 'Edit Portfolio'}
          </button>
        </div>

        {portfolioItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portfolioItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 transition hover:border-blue-200 hover:bg-white">
                <div className="min-w-0 pr-2">
                  <a
                    href={item.url?.startsWith('http') ? item.url : `https://${item.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#1769E0] hover:underline truncate"
                  >
                    {item.label || item.url || 'Project Link'}
                    <FiExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.url}</p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal('portfolio', idx, item)}
                    className="p-1 text-slate-400 hover:text-[#1769E0] transition"
                    title="Edit"
                  >
                    <FiEdit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem('portfolio', idx)}
                    className="p-1 text-slate-400 hover:text-red-600 transition"
                    title="Delete"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-slate-500">{t('profile.noPortfolio') || 'No portfolio links added yet.'}</p>
            <p className="text-xs text-slate-400 mt-1">{t('profile.noPortfolioDesc') || 'Add links to your portfolio, GitHub, or personal projects.'}</p>
            <button
              type="button"
              onClick={() => openAddModal('portfolio')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-[#1769E0] hover:bg-blue-100 transition"
            >
              <FiPlus className="h-4 w-4" /> {t('profile.addPortfolio') || 'Add Project / Link'}
            </button>
          </div>
        )}

        {/* CV Document Attachment Banner */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-[#1769E0]">
              <FiFileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">{t('profile.cvResume') || 'Attached Resume Document'}</p>
              <p className="text-[11px] text-slate-500">
                {activeBuilderCV
                  ? `${activeBuilderCV.title || 'Resume Builder CV'}${activeBuilderCV.createdAt ? ` • ${new Date(activeBuilderCV.createdAt).toLocaleDateString()}` : ''}`
                  : resumeUploaded
                  ? resumeFileName
                  : (t('profile.noCVUploaded') || 'No CV document uploaded yet')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {resumeUploaded && resumeUrl && (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-[#1769E0] hover:bg-blue-50 transition"
              >
                <FiExternalLink className="h-3.5 w-3.5" />
                {t('common.view') || 'View'}
              </a>
            )}
            <div className="relative" ref={cvMenuRef}>
              <button
                type="button"
                onClick={() => setCvMenuOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-[#1769E0] hover:bg-blue-50 transition"
                aria-haspopup="menu"
                aria-expanded={cvMenuOpen}
              >
                <FiUploadCloud className="h-3.5 w-3.5" />
                {resumeUploaded || activeBuilderCV ? (t('profile.replaceCV') || 'Replace CV') : (t('profile.uploadCV') || 'Upload CV')}
                <FiChevronDown className="h-3.5 w-3.5" />
              </button>

              {cvMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-30 mt-1.5 w-72 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
                >
                  {builderCVs.length > 0 ? (
                    builderCVs.map((resume) => {
                      const date = formatResumeDate(resume);
                      return (
                        <button
                          key={resume.id || resume.title || 'resume'}
                          type="button"
                          role="menuitem"
                          onClick={() => handleSelectBuilderCV(resume)}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-blue-50"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <FiFile className="h-3.5 w-3.5 flex-shrink-0 text-[#1769E0]" />
                            <span className="truncate font-semibold">{resume.title || 'Untitled Resume'}</span>
                          </span>
                          {date && <span className="flex-shrink-0 text-[10px] text-slate-400">{date}</span>}
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-2 text-xs text-slate-400 italic">{t('profile.noBuilderCVs') || 'No Resume Builder CVs found'}</div>
                  )}

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleUploadFromFile}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold text-[#1769E0] transition hover:bg-blue-50"
                    >
                      <FiUploadCloud className="h-3.5 w-3.5" />
                      {t('profile.uploadFromFile') || 'Upload From File'}
                    </button>
                  </div>
                </div>
              )}

              <input ref={cvFileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleCVSelect} />
            </div>
          </div>
        </div>
      </section>



      {/* ═════════════════════════════════════════════════════════════════════
          MODAL DIALOGS FOR EDIT / ADD ACTIONS
         ═════════════════════════════════════════════════════════════════════ */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {activeModal === 'header' && t('common.edit')}
                {activeModal === 'bio' && t('profile.editBio')}
                {activeModal === 'education' && (editingItemIndex !== null ? t('profile.editEducation') : t('profile.addEducation'))}
                {activeModal === 'experience' && (editingItemIndex !== null ? t('profile.editExperience') : t('profile.addExperience'))}
                {activeModal === 'skills' && t('profile.editSkills')}
                {activeModal === 'languages' && (editingItemIndex !== null ? t('profile.editLanguages') : t('profile.addLanguage'))}
                {activeModal === 'portfolio' && (editingItemIndex !== null ? t('profile.editPortfolio') : t('profile.addPortfolio'))}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModalItem} className="space-y-4">

              {activeModal === 'header' && (
                <div className="space-y-3 text-xs">
                  {/* Profile Photo Upload / Replace / Delete Controls */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-300 bg-slate-200 flex items-center justify-center flex-shrink-0">
                        {user?.avatar ? (
                          <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <FiUser className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">Profile Photo</p>
                        <p className="text-slate-500 text-xs">Upload, replace or remove your photo</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-[#1769E0] text-white text-xs font-semibold hover:bg-[#0D5BC4] transition flex items-center gap-1 shadow-sm"
                      >
                        <FiCamera className="w-3.5 h-3.5" /> {user?.avatar ? 'Replace Photo' : 'Upload Photo'}
                      </button>
                      {user?.avatar && (
                        <button
                          type="button"
                          onClick={handleDeleteAvatar}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition flex items-center gap-1 shadow-sm"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" /> Delete Photo
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={modalItemData.firstName || ''}
                        onChange={(e) => setModalItemData({ ...modalItemData, firstName: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1769E0]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={modalItemData.lastName || ''}
                        onChange={(e) => setModalItemData({ ...modalItemData, lastName: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1769E0]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gender</label>
                    <select
                      value={modalItemData.gender || ''}
                      onChange={(e) => setModalItemData({ ...modalItemData, gender: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1769E0]"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Profession / Headline Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Full Stack Developer"
                      value={modalItemData.headline || ''}
                      onChange={(e) => setModalItemData({ ...modalItemData, headline: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1769E0]"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="text"
                        placeholder="+251..."
                        value={modalItemData.phone || ''}
                        onChange={(e) => setModalItemData({ ...modalItemData, phone: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1769E0]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">City</label>
                      <input
                        type="text"
                        placeholder="e.g. Addis Ababa"
                        value={modalItemData.city || ''}
                        onChange={(e) => setModalItemData({ ...modalItemData, city: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1769E0]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Address / Region</label>
                    <input
                      type="text"
                      placeholder="Address details"
                      value={modalItemData.address || ''}
                      onChange={(e) => setModalItemData({ ...modalItemData, address: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1769E0]"
                    />
                  </div>
                </div>
              )}

              {activeModal === 'bio' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Professional Summary (Bio)</label>
                    <textarea
                      rows={5}
                      placeholder="Summarize your professional experience, goals, and key strengths..."
                      value={modalItemData.bio || ''}
                      onChange={(e) => setModalItemData({ ...modalItemData, bio: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 outline-none focus:border-[#1769E0]"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Current Role</label>
                      <input
                        type="text"
                        placeholder="e.g. Team Lead"
                        value={modalItemData.currentRole || ''}
                        onChange={(e) => setModalItemData({ ...modalItemData, currentRole: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1769E0]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Years of Experience</label>
                      <input
                        type="number"
                        placeholder="e.g. 5"
                        value={modalItemData.experienceYears || ''}
                        onChange={(e) => setModalItemData({ ...modalItemData, experienceYears: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1769E0]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Expected Salary</label>
                      <input
                        type="text"
                        placeholder="e.g. $60,000 / yr"
                        value={modalItemData.salaryExpectation || ''}
                        onChange={(e) => setModalItemData({ ...modalItemData, salaryExpectation: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1769E0]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Availability</label>
                      <input
                        type="text"
                        placeholder="e.g. Immediately"
                        value={modalItemData.availability || ''}
                        onChange={(e) => setModalItemData({ ...modalItemData, availability: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1769E0]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeModal === 'education' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Degree / Field of Study</label>
                    <input
                      type="text"
                      placeholder="e.g. B.Sc. in Computer Science"
                      value={modalItemData.degree || ''}
                      onChange={(e) => setModalItemData({ ...modalItemData, degree: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1769E0]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Institution / University</label>
                    <input
                      type="text"
                      placeholder="e.g. Addis Ababa University"
                      value={modalItemData.institution || ''}
                      onChange={(e) => setModalItemData({ ...modalItemData, institution: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1769E0]"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Start Date / Year</label>
                      <input
                        type="text"
                        placeholder="e.g. 2018"
                        value={modalItemData.startDate || ''}
                        onChange={(e) => setModalItemData({ ...modalItemData, startDate: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1769E0]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">End Date / Year</label>
                      <input
                        type="text"
                        placeholder="e.g. 2022"
                        value={modalItemData.endDate || ''}
                        onChange={(e) => setModalItemData({ ...modalItemData, endDate: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1769E0]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Location (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Addis Ababa, Ethiopia"
                      value={modalItemData.location || ''}
                      onChange={(e) => setModalItemData({ ...modalItemData, location: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1769E0]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Description (optional)</label>
                    <textarea
                      rows={3}
                      placeholder="Relevant coursework, honors, or activities..."
                      value={modalItemData.description || ''}
                      onChange={(e) => setModalItemData({ ...modalItemData, description: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#1769E0]"
                    />
                  </div>
                </div>
              )}

              {activeModal === 'experience' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Job Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Software Engineer"
                      value={modalItemData.title || ''}
                      onChange={(e) => setModalItemData({ ...modalItemData, title: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1769E0]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Tech Solutions Inc."
                      value={modalItemData.company || ''}
                      onChange={(e) => setModalItemData({ ...modalItemData, company: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1769E0]"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Start Date</label>
                      <input
                        type="text"
                        placeholder="e.g. Jan 2022"
                        value={modalItemData.startDate || ''}
                        onChange={(e) => setModalItemData({ ...modalItemData, startDate: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1769E0]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">End Date (or Present)</label>
                      <input
                        type="text"
                        placeholder="e.g. Present"
                        value={modalItemData.endDate || ''}
                        onChange={(e) => setModalItemData({ ...modalItemData, endDate: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1769E0]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Remote / Addis Ababa"
                      value={modalItemData.location || ''}
                      onChange={(e) => setModalItemData({ ...modalItemData, location: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1769E0]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Description / Key Responsibilities</label>
                    <textarea
                      rows={4}
                      placeholder="Describe your role, accomplishments, and tech stack used..."
                      value={modalItemData.description || ''}
                      onChange={(e) => setModalItemData({ ...modalItemData, description: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#1769E0]"
                    />
                  </div>
                </div>
              )}

              {activeModal === 'skills' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Add Skill Tag</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type skill and press Add"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkillTagToModal(); } }}
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1769E0]"
                      />
                      <button
                        type="button"
                        onClick={addSkillTagToModal}
                        className="rounded-xl bg-[#1769E0] px-4 py-2 text-xs font-bold text-white hover:bg-[#0D5BC4] transition"
                      >
                        Add Tag
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-2">Current Skills List</label>
                    <div className="flex flex-wrap gap-2 min-h-[60px] p-3 rounded-xl bg-slate-50 border border-slate-200">
                      {(modalItemData.skills || []).length > 0 ? (
                        modalItemData.skills.map((sk, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-[#1769E0]">
                            {sk}
                            <button
                              type="button"
                              onClick={() => removeSkillTagFromModal(i)}
                              className="text-[#1769E0] hover:text-red-600 transition"
                            >
                              <FiX className="h-3 w-3" />
                            </button>
                          </span>
                        ))
                      ) : (
                        <p className="text-slate-400 text-xs">No skills listed yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeModal === 'languages' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Language Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Amharic, English"
                      value={modalItemData.name || ''}
                      onChange={(e) => setModalItemData({ ...modalItemData, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1769E0]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Proficiency Level</label>
                    <select
                      value={modalItemData.level || 'Fluent'}
                      onChange={(e) => setModalItemData({ ...modalItemData, level: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1769E0]"
                    >
                      <option value="Native / Bilingual">Native / Bilingual</option>
                      <option value="Fluent">Fluent</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Basic">Basic</option>
                    </select>
                  </div>
                </div>
              )}

              {activeModal === 'portfolio' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Project / Link Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Personal Portfolio Website"
                      value={modalItemData.label || ''}
                      onChange={(e) => setModalItemData({ ...modalItemData, label: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1769E0]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">URL Link</label>
                    <input
                      type="url"
                      placeholder="https://github.com/..."
                      value={modalItemData.url || ''}
                      onChange={(e) => setModalItemData({ ...modalItemData, url: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1769E0]"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1769E0] px-5 py-2 text-xs font-bold text-white hover:bg-[#0D5BC4] transition disabled:opacity-60"
                >
                  {saving ? t('common.loading') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobSeekerProfile;
