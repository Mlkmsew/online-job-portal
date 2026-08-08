import { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile, uploadAvatar, uploadCV, deleteAvatar } from '../../../store/slices/authSlice';
import { toast } from 'react-hot-toast';
import {
  FiUser, FiMail, FiPhone, FiMapPin, FiBriefcase, FiClock,
  FiPlus, FiTrash2, FiX, FiCamera, FiStar,
  FiAward, FiGlobe, FiLink, FiEdit2, FiUploadCloud, FiExternalLink,
  FiFileText, FiBookOpen, FiCalendar, FiBarChart2,
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

const calculateProfileStrength = (user) => {
  let score = 0;
  if (user?.avatar) score += 10;
  if (user?.headline) score += 10;
  if (user?.bio) score += 10;
  if (user?.gender) score += 5;
  if (user?.phone) score += 5;
  const hasSkills = (Array.isArray(user?.skillNames) && user.skillNames.length > 0) || (Array.isArray(user?.skills) && user.skills.length > 0);
  if (hasSkills) score += 15;
  const hasExp = (Array.isArray(user?.experienceDetails) && user.experienceDetails.length > 0) || Boolean(user?.experience);
  if (hasExp) score += 20;
  const hasEdu = (Array.isArray(user?.educationDetails) && user.educationDetails.length > 0) || (Array.isArray(user?.education) && user.education.length > 0);
  if (hasEdu) score += 15;
  if (user?.cv) score += 10;
  return Math.min(100, score);
};

/* ── Main Component ────────────────────────────────────────────────────────── */
const JobSeekerProfile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

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

  useEffect(() => {
    setFormData(getInitialFormData(user));
  }, [user]);

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
  const resumeFileName = user?.cv ? user.cv.split('/').pop() : null;
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
      toast.success('Resume / CV uploaded successfully!');
      setCvFile(null);
    } catch (err) {
      toast.error('Failed to upload resume.');
    }
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
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#de6640] via-[#d6455b] to-[#bd2669] p-6 text-white shadow-lg">
        
        {/* Top-Right Progress Bar & Percentage */}
        <div className="sm:absolute sm:top-5 sm:right-6 flex flex-col items-end mb-4 sm:mb-0">
          <div className="w-48 h-3.5 bg-white/90 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${profileStrength}%` }}
            />
          </div>
          <span className="mt-1 text-xs font-bold text-white tracking-wide">{profileStrength}% Complete</span>
        </div>

        {/* Header Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-1">
          
          {/* Column 1: Avatar, Name, Gender, Contacts from Real Database */}
          <div className="md:col-span-5 flex items-start gap-4">
              {/* Avatar Circle with replace button at bottom-left and delete button at bottom-right */}
              <div className="relative flex-shrink-0 group">
                <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-amber-300/90 bg-slate-200 shadow-md flex items-center justify-center">
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
                  className="absolute bottom-1 left-0 flex h-7 w-7 items-center justify-center rounded-full bg-white text-amber-700 shadow-md transition hover:scale-110"
                  title={user?.avatar ? "Replace Photo" : "Upload Photo"}
                >
                  <FiCamera className="h-3.5 w-3.5" />
                </button>
                {user?.avatar && (
                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    className="absolute bottom-1 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-white shadow-md transition hover:scale-110"
                    title="Delete Photo"
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
                  title="Edit Profile Info"
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
            <h2 className="text-base font-bold text-white">Education</h2>
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
                <p className="text-white/70 italic text-xs">No education added yet</p>
              )}
            </div>
          </div>

          {/* Column 3: Real Skills List from Database */}
          <div className="md:col-span-3 space-y-2 border-t md:border-t-0 md:border-l border-white/20 pt-4 md:pt-0 md:pl-6">
            <h2 className="text-base font-bold text-white">Skills</h2>
            <div className="space-y-1.5 text-xs text-white/90 font-medium">
              {skillNames.length > 0 ? (
                skillNames.slice(0, 4).map((sk, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-white font-bold">➔</span>
                    <span>{sk}</span>
                  </div>
                ))
              ) : (
                <p className="text-white/70 italic text-xs">No skills added yet</p>
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
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <FiUser className="h-4 w-4" />
            </span>
            <h2 className="text-xs font-black uppercase tracking-wider text-orange-600">Bio Information</h2>
          </div>
          <button
            type="button"
            onClick={() => openAddModal('bio')}
            className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition"
          >
            <FiEdit2 className="h-3.5 w-3.5" /> Edit Bio
          </button>
        </div>

        {formData.bio || formData.currentRole || formData.experienceYears || formData.salaryExpectation ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Professional Summary</h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {formData.bio || 'No summary text provided. Click Edit Bio to add details about your goals and experience.'}
              </p>
            </div>

            <div className="space-y-2 bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 text-xs">
              <h3 className="font-bold text-slate-700 uppercase tracking-wider">Career Overview</h3>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">Current Role</span>
                  <span className="font-semibold text-slate-800">{formData.currentRole || 'Not specified'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">Experience</span>
                  <span className="font-semibold text-slate-800">
                    {formData.experienceYears ? `${formData.experienceYears} Years` : 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">Expected Salary</span>
                  <span className="font-semibold text-slate-800">{formData.salaryExpectation || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Availability</span>
                  <span className="font-semibold text-slate-800">{formData.availability || 'Not specified'}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-slate-500">No bio information added yet.</p>
            <p className="text-xs text-slate-400 mt-1">Add a summary to help employers understand your background and career goals.</p>
            <button
              type="button"
              onClick={() => openAddModal('bio')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700 hover:bg-orange-100 transition"
            >
              <FiPlus className="h-4 w-4" /> Add Bio Information
            </button>
          </div>
        )}
      </section>


      {/* SECTION 2: EDUCATION */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <FiBookOpen className="h-4 w-4" />
            </span>
            <h2 className="text-xs font-black uppercase tracking-wider text-orange-600">Education</h2>
          </div>
          <button
            type="button"
            onClick={() => openAddModal('education')}
            className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition"
          >
            <FiEdit2 className="h-3.5 w-3.5" /> Edit Education
          </button>
        </div>

        {educationItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {educationItems.map((edu, idx) => (
              <div key={idx} className="group relative rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:border-orange-200 hover:bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{edu.degree || 'Degree / Qualification'}</h3>
                    <p className="text-xs font-semibold text-orange-600 mt-0.5">{edu.institution || 'Institution'}</p>
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
                      className="p-1.5 text-slate-400 hover:text-orange-600 transition"
                      title="Edit"
                    >
                      <FiEdit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem('educationDetails', idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition"
                      title="Delete"
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
            <p className="text-sm text-slate-500">No education added yet.</p>
            <p className="text-xs text-slate-400 mt-1">Add your academic qualifications to highlight your educational background.</p>
            <button
              type="button"
              onClick={() => openAddModal('education')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700 hover:bg-orange-100 transition"
            >
              <FiPlus className="h-4 w-4" /> Add Education
            </button>
          </div>
        )}
      </section>


      {/* SECTION 3: WORK EXPERIENCE */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <FiBriefcase className="h-4 w-4" />
            </span>
            <h2 className="text-xs font-black uppercase tracking-wider text-orange-600">Work Experience</h2>
          </div>
          <button
            type="button"
            onClick={() => openAddModal('experience')}
            className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition"
          >
            <FiEdit2 className="h-3.5 w-3.5" /> Edit Experience
          </button>
        </div>

        {experienceItems.length > 0 ? (
          <div className="space-y-4">
            {experienceItems.map((exp, idx) => (
              <div key={idx} className="group relative rounded-xl border border-slate-200/80 bg-slate-50/40 p-4 transition hover:border-orange-200 hover:bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">{exp.title || 'Job Position'}</h3>
                    <p className="text-xs font-semibold text-orange-600">{exp.company || 'Company Name'}</p>
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
                      className="p-1.5 text-slate-400 hover:text-orange-600 transition"
                      title="Edit"
                    >
                      <FiEdit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem('experienceDetails', idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition"
                      title="Delete"
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
            <p className="text-sm text-slate-500">No work experience added yet.</p>
            <p className="text-xs text-slate-400 mt-1">Add your professional work history to showcase your roles and career experience.</p>
            <button
              type="button"
              onClick={() => openAddModal('experience')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700 hover:bg-orange-100 transition"
            >
              <FiPlus className="h-4 w-4" /> Add Work Experience
            </button>
          </div>
        )}
      </section>


      {/* SECTION 4: SKILLS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <FiStar className="h-4 w-4" />
            </span>
            <h2 className="text-xs font-black uppercase tracking-wider text-orange-600">Skills</h2>
          </div>
          <button
            type="button"
            onClick={() => openAddModal('skills')}
            className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition"
          >
            <FiEdit2 className="h-3.5 w-3.5" /> Edit Skills
          </button>
        </div>

        {skillNames.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skillNames.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50/80 px-3.5 py-1.5 text-xs font-bold text-orange-800"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-slate-500">No skills added yet.</p>
            <p className="text-xs text-slate-400 mt-1">Add your technical and professional skills to help employers discover your profile.</p>
            <button
              type="button"
              onClick={() => openAddModal('skills')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700 hover:bg-orange-100 transition"
            >
              <FiPlus className="h-4 w-4" /> Add Skills
            </button>
          </div>
        )}
      </section>


      {/* SECTION 5: LANGUAGES */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <FiGlobe className="h-4 w-4" />
            </span>
            <h2 className="text-xs font-black uppercase tracking-wider text-orange-600">Languages</h2>
          </div>
          <button
            type="button"
            onClick={() => openAddModal('languages')}
            className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition"
          >
            <FiEdit2 className="h-3.5 w-3.5" /> Edit Languages
          </button>
        </div>

        {languageItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {languageItems.map((lang, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-2.5">
                <div>
                  <p className="text-xs font-bold text-slate-800">{lang.name || 'Language'}</p>
                  <p className="text-[11px] font-medium text-orange-600">{lang.level || 'Proficiency'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal('languages', idx, lang)}
                    className="p-1 text-slate-400 hover:text-orange-600 transition"
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
            <p className="text-sm text-slate-500">No languages added yet.</p>
            <p className="text-xs text-slate-400 mt-1">Add languages you speak along with your proficiency level.</p>
            <button
              type="button"
              onClick={() => openAddModal('languages')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700 hover:bg-orange-100 transition"
            >
              <FiPlus className="h-4 w-4" /> Add Language
            </button>
          </div>
        )}
      </section>


      {/* SECTION 6: PORTFOLIO & PROJECTS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <FiLink className="h-4 w-4" />
            </span>
            <h2 className="text-xs font-black uppercase tracking-wider text-orange-600">Portfolio & Projects</h2>
          </div>
          <button
            type="button"
            onClick={() => openAddModal('portfolio')}
            className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition"
          >
            <FiEdit2 className="h-3.5 w-3.5" /> Edit Portfolio
          </button>
        </div>

        {portfolioItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portfolioItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 transition hover:border-orange-200 hover:bg-white">
                <div className="min-w-0 pr-2">
                  <a
                    href={item.url?.startsWith('http') ? item.url : `https://${item.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:underline truncate"
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
                    className="p-1 text-slate-400 hover:text-orange-600 transition"
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
            <p className="text-sm text-slate-500">No portfolio links added yet.</p>
            <p className="text-xs text-slate-400 mt-1">Add links to your portfolio, GitHub, or personal projects.</p>
            <button
              type="button"
              onClick={() => openAddModal('portfolio')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700 hover:bg-orange-100 transition"
            >
              <FiPlus className="h-4 w-4" /> Add Project / Link
            </button>
          </div>
        )}

        {/* CV Document Attachment Banner */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <FiFileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Attached Resume Document</p>
              <p className="text-[11px] text-slate-500">{resumeUploaded ? resumeFileName : 'No CV document uploaded yet'}</p>
            </div>
          </div>
          <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-white px-3 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-50 transition">
            <FiUploadCloud className="h-3.5 w-3.5" />
            {resumeUploaded ? 'Replace CV' : 'Upload CV'}
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleCVSelect} />
          </label>
        </div>
      </section>


      {/* ═════════════════════════════════════════════════════════════════════
          MODAL DIALOGS FOR EDIT / ADD ACTIONS
         ═════════════════════════════════════════════════════════════════════ */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 my-8">

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {activeModal === 'header' && 'Edit Header Summary'}
                {activeModal === 'bio' && 'Edit Bio & Career Overview'}
                {activeModal === 'education' && (editingItemIndex !== null ? 'Edit Education' : 'Add Education')}
                {activeModal === 'experience' && (editingItemIndex !== null ? 'Edit Work Experience' : 'Add Work Experience')}
                {activeModal === 'skills' && 'Manage Skills'}
                {activeModal === 'languages' && (editingItemIndex !== null ? 'Edit Language' : 'Add Language')}
                {activeModal === 'portfolio' && (editingItemIndex !== null ? 'Edit Portfolio Link' : 'Add Portfolio Link')}
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
                        className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition flex items-center gap-1 shadow-sm"
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
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={modalItemData.firstName || ''}
                        onChange={(e) => setModalItemData({ ...modalItemData, firstName: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={modalItemData.lastName || ''}
                        onChange={(e) => setModalItemData({ ...modalItemData, lastName: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gender</label>
                    <select
                      value={modalItemData.gender || ''}
                      onChange={(e) => setModalItemData({ ...modalItemData, gender: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500"
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
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="text"
                        placeholder="+251..."
                        value={modalItemData.phone || ''}
                        onChange={(e) => setModalItemData({ ...modalItemData, phone: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">City</label>
                      <input
                        type="text"
                        placeholder="e.g. Addis Ababa"
                        value={modalItemData.city || ''}
                        onChange={(e) => setModalItemData({ ...modalItemData, city: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500"
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
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500"
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
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Current Role</label>
                      <input
                        type="text"
                        placeholder="e.g. Team Lead"
                        value={modalItemData.currentRole || ''}
                        onChange={(e) => setModalItemData({ ...modalItemData, currentRole: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Years of Experience</label>
                      <input
                        type="number"
                        placeholder="e.g. 5"
                        value={modalItemData.experienceYears || ''}
                        onChange={(e) => setModalItemData({ ...modalItemData, experienceYears: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Expected Salary</label>
                      <input
                        type="text"
                        placeholder="e.g. $60,000 / yr"
                        value={modalItemData.salaryExpectation || ''}
                        onChange={(e) => setModalItemData({ ...modalItemData, salaryExpectation: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Availability</label>
                      <input
                        type="text"
                        placeholder="e.g. Immediately"
                        value={modalItemData.availability || ''}
                        onChange={(e) => setModalItemData({ ...modalItemData, availability: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
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
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
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
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Start Date / Year</label>
                      <input
                        type="text"
                        placeholder="e.g. 2018"
                        value={modalItemData.startDate || ''}
                        onChange={(e) => setModalItemData({ ...modalItemData, startDate: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">End Date / Year</label>
                      <input
                        type="text"
                        placeholder="e.g. 2022"
                        value={modalItemData.endDate || ''}
                        onChange={(e) => setModalItemData({ ...modalItemData, endDate: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
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
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Description (optional)</label>
                    <textarea
                      rows={3}
                      placeholder="Relevant coursework, honors, or activities..."
                      value={modalItemData.description || ''}
                      onChange={(e) => setModalItemData({ ...modalItemData, description: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-orange-500"
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
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
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
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Start Date</label>
                      <input
                        type="text"
                        placeholder="e.g. Jan 2022"
                        value={modalItemData.startDate || ''}
                        onChange={(e) => setModalItemData({ ...modalItemData, startDate: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">End Date (or Present)</label>
                      <input
                        type="text"
                        placeholder="e.g. Present"
                        value={modalItemData.endDate || ''}
                        onChange={(e) => setModalItemData({ ...modalItemData, endDate: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
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
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Description / Key Responsibilities</label>
                    <textarea
                      rows={4}
                      placeholder="Describe your role, accomplishments, and tech stack used..."
                      value={modalItemData.description || ''}
                      onChange={(e) => setModalItemData({ ...modalItemData, description: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-orange-500"
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
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={addSkillTagToModal}
                        className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 transition"
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
                          <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">
                            {sk}
                            <button
                              type="button"
                              onClick={() => removeSkillTagFromModal(i)}
                              className="text-orange-700 hover:text-red-600 transition"
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
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Proficiency Level</label>
                    <select
                      value={modalItemData.level || 'Fluent'}
                      onChange={(e) => setModalItemData({ ...modalItemData, level: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
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
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
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
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white hover:bg-orange-700 transition disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
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
