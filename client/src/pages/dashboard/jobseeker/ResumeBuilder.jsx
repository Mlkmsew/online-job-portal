// ============================================
// Resume Builder Wizard Component
// ============================================
import { useState, useEffect, useRef } from 'react';
import {
  FiFileText, FiPlus, FiUpload, FiEdit2, FiDownload,
  FiPrinter, FiInfo, FiTrash2, FiX, FiSearch, FiSave, FiPlusCircle,
  FiArrowLeft, FiArrowRight, FiTrash, FiMail, FiPhone, FiMapPin, FiCheckCircle, FiTool, FiDatabase, FiCode, FiGlobe,
  FiCloud, FiChevronDown, FiChevronUp, FiChevronRight, FiMoreHorizontal, FiRotateCcw, FiRotateCw, FiBookOpen, FiBriefcase, FiSmile, FiImage, FiType, FiLayers, FiUser, FiGrid, FiMenu, FiAward, FiCheck,
  FiArrowUp, FiArrowDown, FiUsers
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { PhoneIcon, MailIcon, LocationIcon, GlobeIcon, DotIcon } from '../../../components/icons/ResumeIcons';
import { uploadAvatar } from '../../../store/slices/authSlice';
import { getResumes, createResume, updateResume, deleteResume, setDefaultResume } from '../../../services/resumeService';
import TemplateBadge from '../../../components/resume/templates/TemplateBadge';
import TemplateSearch from '../../../components/resume/templates/TemplateSearch';
import TemplateFilter from '../../../components/resume/templates/TemplateFilter';
import TemplateToolbar from '../../../components/resume/templates/TemplateToolbar';
import TemplateCard from '../../../components/resume/templates/TemplateCard';
import { getTemplateDefinition, getTemplateDefinitions, getTemplateComponent, resolveTemplateId } from '../../../components/resume/templates/config';
import { withResumeScore, buildResumeFromProfile } from '../../../utils/resumeCompletion';
import { hydrateResumeFromProfile, hydrateResumeListFromProfile, validateResumeForDownload } from '../../../utils/resumeBuilderData';
import { sanitizeEthiopianPhone } from '../../../utils/helpers';
import { TEMPLATE_COLORS, TEMPLATE_COLOR_NAMES, getTemplateTheme, getResumeThemeColor } from '../../../components/resume/templates/templateUtils';
import { renderToStaticMarkup } from 'react-dom/server';
import resumeTemplateCss from '../../../components/resume/templates/shared.css?raw';

// Predefined suggestion examples for Experience
const DUTY_EXAMPLES = [
  'Manage and archive quality documentation and participate in internal and external quality audits',
  'Resolved conflicts and negotiated agreements between parties in order to reach win-win solutions to disagreements and clarify misunderstandings',
  'Presented metric reporting and [Timeframe] account reviews to [Type] team and clients',
  'Developed, updated and maintained database of existing and potential customers in [Software]'
];

const SKILL_SUGGESTION_POOL = [
  'Communication',
  'Teamwork',
  'Problem Solving',
  'Time Management',
  'Adaptability',
  'Leadership',
  'Critical Thinking',
  'Research',
  'Organization',
  'Creativity'
];

const TECHNICAL_SKILL_SUGGESTION_POOL = [
  'JavaScript',
  'React',
  'Node.js',
  'HTML/CSS',
  'SQL',
  'Python',
  'Git',
  'Docker',
  'REST APIs',
  'TypeScript'
];

const SOFT_SKILL_SUGGESTION_POOL = [
  'Communication',
  'Teamwork',
  'Problem Solving',
  'Time Management',
  'Adaptability',
  'Leadership',
  'Critical Thinking',
  'Organization',
  'Creativity'
];

const LANGUAGE_SUGGESTION_POOL = [
  'English',
  'Spanish',
  'Mandarin Chinese',
  'French',
  'German',
  'Arabic',
  'Portuguese',
  'Hindi',
  'Russian',
  'Japanese'
];

// Section types offered by the "Add Section" flow. Projects and Interests are
// fixed sections already present in the builder, so they are marked as such.
const SECTION_TYPES = [
  { key: 'awards', label: 'Awards', icon: FiAward, fixed: false },
  { key: 'achievements', label: 'Achievements', icon: FiCheckCircle, fixed: false },
  { key: 'volunteer', label: 'Volunteer Experience', icon: FiUsers, fixed: false },
  { key: 'publications', label: 'Publications', icon: FiBookOpen, fixed: false },
  { key: 'references', label: 'References', icon: FiUsers, fixed: false },
  { key: 'memberships', label: 'Professional Memberships', icon: FiBriefcase, fixed: false },
  { key: 'hobbies', label: 'Hobbies', icon: FiSmile, fixed: false },
  { key: 'projects', label: 'Projects', icon: FiCode, fixed: true },
  { key: 'interests', label: 'Interests', icon: FiGlobe, fixed: true },
  { key: 'custom', label: 'Custom Section', icon: FiFileText, fixed: false },
];

// Helper: display order for the user-added custom sections stored in
// `resume.additionalInfo`. `resume.sectionOrder` is the source of truth so the
// order chosen in the builder survives save, refresh and JSON import/export.
const getCustomSectionOrder = (resume = {}) => {
  const keys = Object.keys(resume.additionalInfo || {});
  const order = Array.isArray(resume.sectionOrder) ? resume.sectionOrder : [];
  const ordered = order.filter((key) => keys.includes(key));
  const missing = keys.filter((key) => !ordered.includes(key));
  return [...ordered, ...missing];
};

// Build the payload sent to the /resumes API. Strips local-only fields.
const buildBackendPayload = (resume = {}) => {
  const payload = { ...resume };
  delete payload._id;
  delete payload.id;
  delete payload.__v;
  delete payload.user;
  delete payload.createdAt;
  delete payload.updatedAt;
  return payload;
};

// Best-effort normalization of an imported JSON resume into the builder shape.
const normalizeImportedResume = (data) => {
  if (!data || typeof data !== 'object') return null;
  const src = data.resume && typeof data.resume === 'object' ? data.resume : data;
  const source = Array.isArray(src) ? (src[0] || {}) : src;
  if (!source || typeof source !== 'object') return null;

  const base = {
    id: `resume_${Date.now()}`,
    title: (source.title || 'Imported Resume').trim(),
    score: 0,
    status: 'draft',
    template: source.template || 'modern-ats',
    theme: source.theme && typeof source.theme === 'object' ? source.theme : { color: 'blue', primaryColor: '#2563eb' },
    profile: { ...(source.profile || {}) },
    summary: typeof source.summary === 'string' ? { text: source.summary } : (source.summary && typeof source.summary === 'object' ? { ...source.summary } : {}),
    experience: source.experience,
    education: source.education,
    projects: Array.isArray(source.projects) ? source.projects : (source.projects ? [source.projects] : []),
    skills: Array.isArray(source.skills) ? source.skills : [],
    softSkills: Array.isArray(source.softSkills) ? source.softSkills : [],
    languages: Array.isArray(source.languages) ? source.languages : [],
    certifications: Array.isArray(source.certifications) ? source.certifications : [],
    interests: typeof source.interests === 'string' ? { text: source.interests } : (source.interests && typeof source.interests === 'object' ? { ...source.interests } : {}),
    additionalInfo: source.additionalInfo && typeof source.additionalInfo === 'object' ? source.additionalInfo : {},
    sectionOrder: Array.isArray(source.sectionOrder) ? source.sectionOrder : [],
    photo: source.photo || null,
    dirtyFields: Array.isArray(source.dirtyFields) ? source.dirtyFields : [],
  };

  const experienceList = Array.isArray(base.experience) ? base.experience : base.experience ? [base.experience] : [];
  const educationList = Array.isArray(base.education) ? base.education : base.education ? [base.education] : [];
  const hasProfile = Object.values(base.profile || {}).some((v) => typeof v === 'string' && v.trim());
  const hasExperience = experienceList.some((e) => e && Object.values(e).some((v) => typeof v === 'string' && String(v).trim()));
  const hasEducation = educationList.some((e) => e && Object.values(e).some((v) => typeof v === 'string' && String(v).trim()));
  const hasContent =
    hasProfile ||
    Boolean(base.summary?.text?.trim()) ||
    hasExperience ||
    hasEducation ||
    base.skills.length > 0 ||
    base.projects.length > 0 ||
    base.languages.length > 0 ||
    base.certifications.length > 0 ||
    Object.keys(base.additionalInfo).length > 0;
  if (!hasContent) return null;

  return base;
};

// Experience/Education can be a single object (legacy/new resume) or an array of
// entries (loaded from the backend, which stores them as arrays). The editor
// always edits the first entry, so both shapes must be handled without changing
// the filled data when the template is switched.
const getFirstEntry = (value) =>
  Array.isArray(value) ? (value[0] || {}) : (value && typeof value === 'object' ? value : {});

const ResumeBuilder = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const resumeStorageKey = `ethiojob_resumes_${user?._id || user?.id || user?.email || token || 'guest'}`;
  const [view, setView] = useState('list');
  const [resumes, setResumes] = useState([]);
  const [activeResumeId, setActiveResumeId] = useState(null);
  const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newResumeTitle, setNewResumeTitle] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    education: true,
    employment: true,
    skills: true,
    languages: true,
    hobbies: true
  });
  const [optionalFields, setOptionalFields] = useState({
    dateOfBirth: false,
    placeOfBirth: false,
    driverLicense: false,
    gender: false,
    nationality: false,
    civilStatus: false,
    website: false,
    linkedIn: false,
    customField: false
  });
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [skillEditorIndex, setSkillEditorIndex] = useState(null);
  const [languageEditorIndex, setLanguageEditorIndex] = useState(null);
  const [technicalSkillSuggestions, setTechnicalSkillSuggestions] = useState(['JavaScript', 'React', 'Node.js', 'HTML/CSS', 'SQL']);
  const [softSkillSuggestions, setSoftSkillSuggestions] = useState(['Communication', 'Teamwork', 'Problem Solving', 'Time Management', 'Adaptability']);
  const [languageSuggestions, setLanguageSuggestions] = useState(['English', 'Spanish', 'Mandarin Chinese', 'French', 'German']);
  const [isSkillsCollapsed, setIsSkillsCollapsed] = useState(false);
  const [photoEditorSrc, setPhotoEditorSrc] = useState(null);
  const [photoEditorFileName, setPhotoEditorFileName] = useState('');
  const [photoEditorZoom, setPhotoEditorZoom] = useState(1);
  const [photoEditorRotate, setPhotoEditorRotate] = useState(0);

  // Custom section + import/export UI state
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [customSectionTitle, setCustomSectionTitle] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const importFileInputRef = useRef(null);
  const backendSyncTimer = useRef(null);
  const pendingSyncRef = useRef(null);
  const creatingResumeIds = useRef(new Set());

  const createInitialResume = (title, templateId = 'modern-ats') => {
    const seeded = buildResumeFromProfile(user);
    const seededProfile = seeded.profile || {};
    const seededEducation = seeded.education || {};
    const seededExperience = seeded.experience || {};
    const profile = {
      firstName: '',
      middleName: '',
      lastName: '',
      gender: '',
      dateOfBirth: '',
      maritalStatus: '',
      profession: '',
      streetAddress: '',
      city: '',
      stateProvince: '',
      nationality: '',
      passportNumber: '',
      phone: '',
      email: '',
      website: '',
      linkedIn: '',
      customField: ''
    };
    return {
      id: `resume_${Date.now()}`,
      title: title || 'Untitled Resume',
      score: 0,
      status: 'draft',
      template: templateId,
      profile: {
        ...profile,
        ...seededProfile,
        firstName: seededProfile.firstName || '',
        middleName: '',
        lastName: seededProfile.lastName || '',
        gender: seededProfile.gender || '',
        profession: seededProfile.profession || '',
        streetAddress: seededProfile.streetAddress || '',
        city: seededProfile.city || '',
        stateProvince: seededProfile.stateProvince || '',
        phone: seededProfile.phone || '',
        email: seededProfile.email || '',
        website: seededProfile.website || '',
        linkedIn: seededProfile.linkedIn || ''
      },
      experience: {
        jobTitle: seededExperience.jobTitle || '',
        employer: seededExperience.employer || '',
        city: seededExperience.city || '',
        state: seededExperience.state || '',
        startDate: seededExperience.startDate || '',
        endDate: seededExperience.endDate || '',
        currentWork: false,
        duties: seededExperience.duties || ''
      },
      education: {
        schoolName: seededEducation.schoolName || '',
        city: seededEducation.city || '',
        state: seededEducation.state || '',
        degree: seededEducation.degree || '',
        fieldOfStudy: seededEducation.fieldOfStudy || '',
        startDate: seededEducation.startDate || '',
        endDate: seededEducation.endDate || '',
        currentStudy: false
      },
      projects: [{ title: '', description: '' }],
      skills: (seeded.skills && seeded.skills.length ? seeded.skills : [{ name: '' }]).map((skill) => (typeof skill === 'object' ? { ...skill, level: skill.level || 'Select', isDone: !!skill.isDone } : { name: skill, level: 'Select', isDone: false })),
      softSkills: (seeded.softSkills && seeded.softSkills.length ? seeded.softSkills : ['']),
      languages: (seeded.languages && seeded.languages.length ? seeded.languages : [{ name: '', level: 'Select', isDone: false }]).map((language) => (typeof language === 'object' ? { ...language, level: language.level || 'Select', isDone: !!language.isDone } : { name: language, level: 'Select', isDone: false })),
      summary: { text: seeded.summary?.text || '' },
      interests: { text: '' },
      certifications: seeded.certifications || [],
      photo: seeded.photo ? { dataUrl: seeded.photo.dataUrl || seeded.photo.url || null, url: seeded.photo.url || seeded.photo.dataUrl || null, fileName: seeded.photo.fileName || 'profile-photo' } : null,
      theme: getTemplateTheme(getTemplateDefinition(templateId)?.accent || 'blue'),
      additionalInfo: {},
      sectionOrder: [],
      dirtyFields: []
    };
  };

  const handleDownloadPDF = (resume) => {
    const hydratedResume = hydrateResumeFromProfile(resume, user);
    const issues = validateResumeForDownload(hydratedResume);
    if (issues.length > 0) {
      toast.error(issues[0]);
      return;
    }

    const templateId = resolveTemplateId(hydratedResume?.template);
    const templateDefinition = getTemplateDefinition(templateId);
    const TemplateComponent = templateDefinition?.component || getTemplateComponent(templateId);
    const accentColor = getResumeThemeColor(hydratedResume, templateDefinition);

    const fullName = [hydratedResume.profile?.firstName, hydratedResume.profile?.middleName, hydratedResume.profile?.lastName].filter(Boolean).join(' ').trim();
    const safeName = fullName.replace(/[^\w-]+/g, '_') || 'CV';
    const fileName = `${safeName}_CV.pdf`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const templateHtml = renderToStaticMarkup(<TemplateComponent resume={hydratedResume} color={accentColor} />);

    const content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${fileName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Montserrat:wght@500;600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    ${resumeTemplateCss}
    html, body { margin: 0; padding: 0; background: #fff; }
    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .resume-template-shell { display: flex; justify-content: center; }
    @media print {
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      html, body { margin: 0; padding: 0; background: #fff; }
      @page { size: A4; margin: 0; }
      .resume-template {
        width: 210mm;
        min-height: 297mm;
        height: auto;
        margin: 0;
        box-shadow: none;
        border-radius: 0;
        overflow: visible;
      }
      .resume-template-shell { justify-content: center; }
      .resume-template__section,
      .resume-template__entry,
      .experience-entry,
      .education-entry,
      .project-entry { break-inside: avoid; page-break-inside: avoid; }
      .resume-template__label,
      .resume-template__eyebrow { break-after: avoid; page-break-after: avoid; }
      .resume-template p,
      .resume-template li { white-space: pre-line; }
    }
  </style>
</head>
<body>
  ${templateHtml}
</body>
</html>`;

    printWindow.document.write(content);
    printWindow.document.title = fileName;
    printWindow.document.close();
    printWindow.focus();

    // Wait for the profile photo and web fonts to render before printing so the
    // downloaded PDF exactly matches the on-screen preview (no missing photo/fonts).
    const waitForRender = Promise.all([
      ...Array.from(printWindow.document.images || []).map((img) => img.decode().catch(() => {})),
      printWindow.document.fonts && printWindow.document.fonts.ready ? printWindow.document.fonts.ready : Promise.resolve(),
    ]);
    Promise.race([
      waitForRender,
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]).then(() => printWindow.print()).catch(() => printWindow.print());
  };
  const TABS = ['Profile', 'Summary', 'Experience', 'Education', 'Skills', 'Languages', 'Additional Info', 'Template'];
  const [activeTab, setActiveTab] = useState('Profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [exampleSearch, setExampleSearch] = useState('');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [templateSort, setTemplateSort] = useState('popular');
  const [page, setPage] = useState(1);
  const templates = getTemplateDefinitions();

  // Load resumes. When the user is authenticated the backend /resumes API is
  // the primary persistence layer and localStorage is only a temporary cache.
  useEffect(() => {
    let cancelled = false;

    const loadLocalResumes = () => {
      const stored = localStorage.getItem(resumeStorageKey);
      const legacyStored = localStorage.getItem('ethiojob_resumes');

      if (stored) {
        const parsed = JSON.parse(stored);
        const hydrated = hydrateResumeListFromProfile(Array.isArray(parsed) ? parsed : [], user);
        return { hydrated, migrated: false };
      }
      if (legacyStored) {
        const parsed = JSON.parse(legacyStored);
        const hydrated = hydrateResumeListFromProfile(Array.isArray(parsed) ? parsed : [], user);
        localStorage.setItem(resumeStorageKey, JSON.stringify(hydrated));
        localStorage.removeItem('ethiojob_resumes');
        return { hydrated, migrated: true };
      }
      return { hydrated: [], migrated: false };
    };

    const applyLocal = () => {
      const { hydrated } = loadLocalResumes();
      if (cancelled) return;
      setResumes(hydrated);
      localStorage.setItem(resumeStorageKey, JSON.stringify(hydrated));
    };

    const loadFromBackend = async () => {
      if (!user?._id && !token) {
        applyLocal();
        return;
      }
      try {
        const response = await getResumes();
        if (cancelled) return;
        const backend = Array.isArray(response?.data?.data) ? response.data.data : [];
        if (backend.length > 0) {
          const normalized = backend.map((resume) => ({
            ...resume,
            id: resume._id || resume.id,
          }));
          const hydrated = hydrateResumeListFromProfile(normalized, user);
          setResumes(hydrated);
          localStorage.setItem(resumeStorageKey, JSON.stringify(hydrated));
          return;
        }
        applyLocal();
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load resumes from backend, using local cache:', error);
        applyLocal();
      }
    };

    loadFromBackend();

    setActiveResumeId(null);
    setView('list');
    setSaveMessage('');
    setNewResumeTitle('');
    setIsTitleModalOpen(false);
    setIsTemplateModalOpen(false);
    setIsImportModalOpen(false);
    setIsAddSectionModalOpen(false);

    return () => {
      cancelled = true;
      if (backendSyncTimer.current) clearTimeout(backendSyncTimer.current);
    };
  }, [resumeStorageKey]);

  // Re-hydrate saved CVs whenever the profile changes so the latest profile
  // data (name, photo, skills, education, etc.) flows into existing CVs without
  // overwriting fields the user explicitly edited inside the CV.
  useEffect(() => {
    setResumes((current) => {
      const hydrated = hydrateResumeListFromProfile(current, user);
      localStorage.setItem(resumeStorageKey, JSON.stringify(hydrated));
      return hydrated;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const persistToBackend = async (resume) => {
    if (!resume || !user?._id) return null;
    const payload = buildBackendPayload(resume);

    // Prevent duplicate POSTs while a create request for this resume is running.
    if (!resume._id) {
      if (creatingResumeIds.current.has(resume.id)) return null;
      creatingResumeIds.current.add(resume.id);
    }

    try {
      let saved;
      if (resume._id) {
        const response = await updateResume(resume._id, payload);
        saved = response?.data?.data;
      } else {
        const response = await createResume(payload);
        saved = response?.data?.data;
        if (saved?._id) {
          setResumes((current) => current.map((r) => (r.id === resume.id ? { ...r, _id: saved._id } : r)));
        }
      }
      return saved;
    } catch (error) {
      console.error('Failed to save resume to backend:', error);
      return null;
    } finally {
      creatingResumeIds.current.delete(resume.id);
    }
  };

  const scheduleBackendSync = (resume) => {
    if (!resume || !user?._id) return;
    // New resumes (no backend id yet) are persisted explicitly on create/save.
    if (!resume._id) return;
    pendingSyncRef.current = resume;
    if (backendSyncTimer.current) clearTimeout(backendSyncTimer.current);
    backendSyncTimer.current = setTimeout(() => {
      const target = pendingSyncRef.current;
      if (target?._id) persistToBackend(target);
    }, 800);
  };

  const forceBackendSync = (resume) => {
    if (!resume || !user?._id) return Promise.resolve(null);
    if (backendSyncTimer.current) clearTimeout(backendSyncTimer.current);
    return persistToBackend(resume);
  };

  const saveToStorage = (updatedResumes) => {
    const scored = (Array.isArray(updatedResumes) ? updatedResumes : []).map((resume) => withResumeScore(resume));
    setResumes(scored);
    localStorage.setItem(resumeStorageKey, JSON.stringify(scored));
    const active = scored.find((resume) => resume.id === activeResumeId);
    if (active) scheduleBackendSync(active);
  };

  const handleOpenTitleModal = () => {
    setNewResumeTitle('');
    setIsTitleModalOpen(true);
  };

  const handleConfirmTitle = (e) => {
    e.preventDefault();
    if (!newResumeTitle.trim()) {
      toast.error(t('resume.enterTitle', { defaultValue: 'Please enter a resume title' }));
      return;
    }

    const newResume = createInitialResume(newResumeTitle.trim(), 'modern-ats');
    const updated = [...resumes, newResume];
    saveToStorage(updated);

    setActiveResumeId(newResume.id);
    setIsTitleModalOpen(false);
    setIsTemplateModalOpen(false);
    setView('editor');
    setActiveTab('Profile');
    setSaveMessage('');
    toast.success('CV created successfully');

    persistToBackend(newResume);
  };

  const handleSelectTemplate = (templateId) => {
    const resolvedTemplateId = resolveTemplateId(templateId);
    if (activeResume) {
      const templateDefinition = getTemplateDefinition(resolvedTemplateId);
      const updated = resumes.map((resume) =>
        resume.id === activeResume.id
          ? { ...resume, template: resolvedTemplateId, theme: getTemplateTheme(templateDefinition?.accent || 'blue') }
          : resume
      );
      saveToStorage(updated);
      setIsTemplateModalOpen(false);
      toast.success(`Template ${resolvedTemplateId} selected`);
      return;
    }

    const newResume = createInitialResume(newResumeTitle || 'Untitled Resume', resolvedTemplateId);
    const updated = [...resumes, newResume];
    saveToStorage(updated);

    setActiveResumeId(newResume.id);
    setIsTemplateModalOpen(false);
    toast.success(`Template ${templateId} selected`);
    persistToBackend(newResume);
  };

  const handleSelectTemplateColor = (colorName) => {
    if (!activeResume) return;
    const updated = resumes.map((resume) =>
      resume.id === activeResume.id ? { ...resume, theme: getTemplateTheme(colorName) } : resume
    );
    saveToStorage(updated);
    toast.success(`${TEMPLATE_COLORS[colorName]?.name || colorName} color applied`);
  };

  const handleEditResume = (resumeId) => {
    setActiveResumeId(resumeId);
    setView('editor');
    setActiveTab('Profile');
  };

  const handleDeleteResume = (resumeId) => {
    if (window.confirm('Are you sure you want to delete this resume?')) {
      const target = resumes.find((r) => r.id === resumeId);
      const filtered = resumes.filter(r => r.id !== resumeId);
      saveToStorage(filtered);
      toast.success('Resume deleted successfully');
      if (target && user?._id) {
        const backendId = target._id || target.id;
        deleteResume(backendId).catch(() => {});
      }
    }
  };

  const handleSetDefault = async (resumeId) => {
    const target = resumes.find((r) => r.id === resumeId);
    if (!target || target.isDefault) return;
    const backendId = target._id || target.id;
    try {
      await setDefaultResume(backendId);
      const updated = resumes.map((r) => ({ ...r, isDefault: r.id === resumeId }));
      saveToStorage(updated);
      toast.success('Default resume updated');
    } catch {
      toast.error('Failed to update default resume');
    }
  };

  const handleSaveForm = (e) => {
    if (e) e.preventDefault();
    if (!activeResume) return;

    saveToStorage(resumes);
    setSaveMessage('Saved successfully');
    toast.success('CV saved successfully');
    forceBackendSync(activeResume).then((saved) => {
      if (saved) setSaveMessage('Saved successfully (synced to your account)');
    });
  };

  // -------------------------------------------------------------------------
  // Import Resume (JSON file + parsed CV analysis)
  // -------------------------------------------------------------------------
  const handleOpenImportModal = () => {
    setIsImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
  };

  const handleImportFileClick = () => {
    importFileInputRef.current?.click();
  };

  const handleImportFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const imported = normalizeImportedResume(parsed);
        if (!imported) {
          toast.error('This JSON file does not look like a valid resume. Export a resume from the Resume Builder first.');
          setIsImporting(false);
          return;
        }
        const updated = [...resumes, imported];
        saveToStorage(updated);
        setActiveResumeId(imported.id);
        setIsImportModalOpen(false);
        setView('editor');
        setActiveTab('Profile');
        setSaveMessage('');
        toast.success('Resume imported successfully');
        persistToBackend(imported);
      } catch (error) {
        console.error('Failed to import resume:', error);
        toast.error('Failed to read the JSON file. Make sure it is a valid resume export.');
      } finally {
        setIsImporting(false);
        if (importFileInputRef.current) importFileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read the file.');
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  const hasParsedCVData = () => {
    const analysis = user?.resumeAnalysis || {};
    return Boolean(
      (Array.isArray(analysis.skills) && analysis.skills.length > 0) ||
      (Array.isArray(analysis.certifications) && analysis.certifications.length > 0) ||
      (Array.isArray(analysis.education) && analysis.education.length > 0) ||
      analysis.professionalTitle ||
      (Array.isArray(user?.skillNames) && user.skillNames.length > 0) ||
      (Array.isArray(user?.skills) && user.skills.length > 0)
    );
  };

  const handleImportFromParsedCV = () => {
    const parsed = buildResumeFromProfile(user);
    const analysis = user?.resumeAnalysis || {};
    const title = `${[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'My'} CV`.trim();
    const resume = createInitialResume(title, 'modern-ats');
    resume.profile = {
      ...resume.profile,
      ...parsed.profile,
      profession: parsed.profile?.profession || analysis.professionalTitle || resume.profile.profession || '',
    };
    if (analysis.location && !resume.profile.city) resume.profile.city = analysis.location;
    if (Array.isArray(parsed.skills) && parsed.skills.length > 0) resume.skills = parsed.skills;
    if (Array.isArray(parsed.languages) && parsed.languages.length > 0) resume.languages = parsed.languages;
    if (Array.isArray(analysis.certifications) && analysis.certifications.length > 0) {
      resume.certifications = analysis.certifications.map((c) => (typeof c === 'object' ? c : { name: c }));
    }
    if (Array.isArray(analysis.education) && analysis.education.length > 0) {
      resume.education = analysis.education.map((degree) => ({ ...resume.education, degree: String(degree), schoolName: '', fieldOfStudy: '' }));
    }
    const updated = [...resumes, resume];
    saveToStorage(updated);
    setActiveResumeId(resume.id);
    setIsImportModalOpen(false);
    setView('editor');
    setActiveTab('Profile');
    setSaveMessage('');
    toast.success('Imported data parsed from your uploaded CV');
    persistToBackend(resume);
  };

  // -------------------------------------------------------------------------
  // JSON Export
  // -------------------------------------------------------------------------
  const handleExportJson = (resume) => {
    if (!resume) return;
    const clean = buildBackendPayload(resume);
    clean.format = 'ethiojob-resume';
    clean.exportedAt = new Date().toISOString();
    const safeName = [resume.profile?.firstName, resume.profile?.middleName, resume.profile?.lastName]
      .filter(Boolean).join('_').replace(/[^\w-]+/g, '_') || 'Resume';
    const fileName = `${safeName}_Resume.json`;
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Resume exported as JSON');
  };

  // -------------------------------------------------------------------------
  // Add / edit custom resume sections
  // -------------------------------------------------------------------------
  const handleOpenAddSection = () => {
    setCustomSectionTitle('');
    setIsAddSectionModalOpen(true);
  };

  const handleAddSectionType = (type) => {
    if (!activeResume) return;
    const definition = SECTION_TYPES.find((section) => section.key === type);
    if (!definition) return;
    if (definition.fixed) {
      toast.info(`${definition.label} is already a fixed section — edit it in the Additional Info tab`);
      setIsAddSectionModalOpen(false);
      setActiveTab('Additional Info');
      return;
    }
    const title = type === 'custom' ? (customSectionTitle || '').trim() : definition.label;
    if (type === 'custom' && !title) {
      toast.error('Please enter a title for your custom section');
      return;
    }
    const key = type === 'custom' ? `custom_${Date.now()}` : type;
    const existing = activeResume.additionalInfo?.[key];
    const sectionKey = existing ? `${key}_${Date.now()}` : key;
    const updated = resumes.map((r) => {
      if (r.id !== activeResumeId) return r;
      return withDirty({
        ...r,
        additionalInfo: {
          ...(r.additionalInfo || {}),
          [sectionKey]: { title, items: [{ title: '', description: '' }] },
        },
        sectionOrder: [...(r.sectionOrder || []), sectionKey],
      }, 'additionalInfo');
    });
    saveToStorage(updated);
    setIsAddSectionModalOpen(false);
    setCustomSectionTitle('');
    setActiveTab('Additional Info');
    toast.success(`Section "${title}" added`);
  };

  const handleAdditionalSectionChange = (key, field, value) => {
    const updated = resumes.map((r) => {
      if (r.id !== activeResumeId) return r;
      return withDirty({
        ...r,
        additionalInfo: {
          ...(r.additionalInfo || {}),
          [key]: { ...(r.additionalInfo?.[key] || {}), [field]: value },
        },
      }, 'additionalInfo');
    });
    saveToStorage(updated);
  };

  const handleAdditionalItemChange = (key, index, field, value) => {
    const updated = resumes.map((r) => {
      if (r.id !== activeResumeId) return r;
      const section = r.additionalInfo?.[key] || {};
      const items = [...(Array.isArray(section.items) ? section.items : [])];
      items[index] = { ...(items[index] || {}), [field]: value };
      return withDirty({
        ...r,
        additionalInfo: { ...(r.additionalInfo || {}), [key]: { ...section, items } },
      }, 'additionalInfo');
    });
    saveToStorage(updated);
  };

  const handleAddAdditionalItem = (key) => {
    const updated = resumes.map((r) => {
      if (r.id !== activeResumeId) return r;
      const section = r.additionalInfo?.[key] || {};
      const items = [...(Array.isArray(section.items) ? section.items : []), { title: '', description: '' }];
      return withDirty({
        ...r,
        additionalInfo: { ...(r.additionalInfo || {}), [key]: { ...section, items } },
      }, 'additionalInfo');
    });
    saveToStorage(updated);
  };

  const handleRemoveAdditionalItem = (key, index) => {
    const updated = resumes.map((r) => {
      if (r.id !== activeResumeId) return r;
      const section = r.additionalInfo?.[key] || {};
      const items = (Array.isArray(section.items) ? section.items : []).filter((_, idx) => idx !== index);
      return withDirty({
        ...r,
        additionalInfo: { ...(r.additionalInfo || {}), [key]: { ...section, items } },
      }, 'additionalInfo');
    });
    saveToStorage(updated);
  };

  const handleRemoveAdditionalSection = (key) => {
    const updated = resumes.map((r) => {
      if (r.id !== activeResumeId) return r;
      const additionalInfo = { ...(r.additionalInfo || {}) };
      delete additionalInfo[key];
      return withDirty({
        ...r,
        additionalInfo,
        sectionOrder: (r.sectionOrder || []).filter((sectionKey) => sectionKey !== key),
      }, 'additionalInfo');
    });
    saveToStorage(updated);
    toast.success('Section removed');
  };

  const handleMoveSection = (key, direction) => {
    const updated = resumes.map((r) => {
      if (r.id !== activeResumeId) return r;
      const order = getCustomSectionOrder(r);
      const index = order.indexOf(key);
      if (index < 0) return r;
      const target = index + direction;
      if (target < 0 || target >= order.length) return r;
      const next = [...order];
      [next[index], next[target]] = [next[target], next[index]];
      return withDirty({ ...r, sectionOrder: next }, 'sectionOrder');
    });
    saveToStorage(updated);
  };

  const handleNextTab = () => {
    const currentIndex = TABS.indexOf(activeTab);
    if (currentIndex < TABS.length - 1) {
      setActiveTab(TABS[currentIndex + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setView('preview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevTab = () => {
    if (view === 'preview') {
      setView('editor');
      setActiveTab(TABS[TABS.length - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const currentIndex = TABS.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(TABS[currentIndex - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const activeResume = resumes.find(r => r.id === activeResumeId);

  // General field update
  const withDirty = (resume, keys) => {
    const dirtyFields = Array.from(new Set([
      ...(resume.dirtyFields || []),
      ...(Array.isArray(keys) ? keys : [keys]),
    ]));
    return { ...resume, dirtyFields };
  };

  const handleFieldChange = (section, field, value) => {
    setSaveMessage('');
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        const dirtyKey = `${section}.${field}`;
        if (section === 'skills' && field === 'value') {
          return withDirty({ ...r, skills: value }, 'skills');
        }
        if (section === 'softSkills' && field === 'value') {
          return withDirty({ ...r, softSkills: value }, 'softSkills');
        }
        if (section === 'languages' && field === 'value') {
          return withDirty({ ...r, languages: value }, 'languages');
        }
        if (Array.isArray(r[section])) {
          const entries = [...r[section]];
          if (entries.length === 0) entries.push({});
          entries[0] = { ...(entries[0] || {}), [field]: value };
          return withDirty({ ...r, [section]: entries }, dirtyKey);
        }
        return withDirty({
          ...r,
          [section]: {
            ...r[section],
            [field]: value
          }
        }, dirtyKey);
      }
      return r;
    });
    saveToStorage(updated);
  };

  const openPhotoEditor = (sourceUrl, fileName) => {
    setPhotoEditorSrc(sourceUrl);
    setPhotoEditorFileName(fileName || 'profile-photo.png');
    setPhotoEditorZoom(1);
    setPhotoEditorRotate(0);
    setIsPhotoEditorOpen(true);
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      openPhotoEditor(reader.result, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleCancelPhotoEditor = () => {
    setIsPhotoEditorOpen(false);
    setPhotoEditorSrc(null);
    setPhotoEditorFileName('');
    setPhotoEditorZoom(1);
    setPhotoEditorRotate(0);
  };

  const dataUrlToFile = (dataUrl, fileName) => {
    const [meta, base64] = dataUrl.split(',');
    const mime = meta.match(/:(.*?);/)?.[1] || 'image/jpeg';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], fileName, { type: mime });
  };

  const handleConfirmPhotoEditor = () => {
    if (!photoEditorSrc) {
      handleCancelPhotoEditor();
      return;
    }

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const sourceWidth = image.width * photoEditorZoom;
      const sourceHeight = image.height * photoEditorZoom;
      const angle = (photoEditorRotate * Math.PI) / 180;
      const cos = Math.abs(Math.cos(angle));
      const sin = Math.abs(Math.sin(angle));
      const canvasWidth = Math.round(sourceWidth * cos + sourceHeight * sin);
      const canvasHeight = Math.round(sourceWidth * sin + sourceHeight * cos);
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');

      ctx.translate(canvasWidth / 2, canvasHeight / 2);
      ctx.rotate(angle);
      ctx.drawImage(image, -sourceWidth / 2, -sourceHeight / 2, sourceWidth, sourceHeight);

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const updated = resumes.map(r => {
        if (r.id === activeResumeId) {
          return withDirty({
            ...r,
            photo: { ...(r.photo || {}), dataUrl: croppedDataUrl, fileName: photoEditorFileName }
          }, 'photo');
        }
        return r;
      });

      saveToStorage(updated);
      setIsPhotoEditorOpen(false);
      setPhotoEditorSrc(null);
      setPhotoEditorFileName('');
      setPhotoEditorZoom(1);
      setPhotoEditorRotate(0);
      toast.success('Photo updated');

      // Keep the profile avatar as the single source of truth: upload the same
      // cropped image to the profile so the CV and profile share one photo.
      try {
        const formData = new FormData();
        formData.append('avatar', dataUrlToFile(croppedDataUrl, photoEditorFileName || 'profile-photo.jpg'));
        dispatch(uploadAvatar(formData)).unwrap().catch(() => {});
      } catch (error) {
        console.error('Failed to sync photo to profile:', error);
      }
    };
    image.src = photoEditorSrc;
  };

  const openPhotoEditorFromCurrentPhoto = () => {
    const currentPhoto = activeResume?.photo?.dataUrl || activeResume?.photo?.url;
    if (!currentPhoto) return;
    openPhotoEditor(currentPhoto, activeResume.photo.fileName || 'profile-photo.png');
  };

  // Skills dynamic list update
  const handleSkillChange = (index, field, value) => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        const newSkills = [...(r.skills || [])];
        newSkills[index] = { ...newSkills[index], [field]: value };
        return withDirty({ ...r, skills: newSkills }, 'skills');
      }
      return r;
    });
    saveToStorage(updated);
  };

  const handleAddSkill = () => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        const newSkills = [...(r.skills || []), { name: '', level: 'Select', isDone: false }];
        return withDirty({ ...r, skills: newSkills }, 'skills');
      }
      return r;
    });
    saveToStorage(updated);
    setSkillEditorIndex((activeResume?.skills || []).length);
  };

  const handleToggleSkillDone = (index) => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        const newSkills = [...(r.skills || [])];
        newSkills[index] = { ...newSkills[index], isDone: !newSkills[index]?.isDone };
        return withDirty({ ...r, skills: newSkills }, 'skills');
      }
      return r;
    });
    saveToStorage(updated);
  };

  const handleSelectSuggestedSkill = (skillName) => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        const normalized = skillName.trim();
        const existing = (r.skills || []).some((skill) => skill.name?.toLowerCase() === normalized.toLowerCase());
        if (existing) return r;
        return withDirty({ ...r, skills: [...(r.skills || []), { name: normalized, level: 'Select', isDone: false }] }, 'skills');
      }
      return r;
    });
    saveToStorage(updated);
    setSkillEditorIndex((activeResume?.skills || []).length);
  };

  const handleGenerateTechnicalSkillSuggestions = () => {
    const nextSuggestions = TECHNICAL_SKILL_SUGGESTION_POOL
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);
    setTechnicalSkillSuggestions(nextSuggestions);
  };

  const handleGenerateSoftSkillSuggestions = () => {
    const nextSuggestions = SOFT_SKILL_SUGGESTION_POOL
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);
    setSoftSkillSuggestions(nextSuggestions);
  };

  const handleSelectSuggestedSoftSkill = (skillName) => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        const normalized = skillName.trim();
        const existing = (r.softSkills || []).some((skill) => skill?.toLowerCase() === normalized.toLowerCase());
        if (existing) return r;
        return withDirty({ ...r, softSkills: [...(r.softSkills || []), normalized] }, 'softSkills');
      }
      return r;
    });
    saveToStorage(updated);
  };

  const handleLanguageInputChange = (index, field, value) => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        const newLanguages = [...(r.languages || [])];
        const current = newLanguages[index] || { name: '', level: 'Select', isDone: false };
        newLanguages[index] = { ...current, [field]: value };
        return withDirty({ ...r, languages: newLanguages }, 'languages');
      }
      return r;
    });
    saveToStorage(updated);
  };

  const handleAddLanguage = () => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        return withDirty({ ...r, languages: [...(r.languages || []), { name: '', level: 'Select', isDone: false }] }, 'languages');
      }
      return r;
    });
    saveToStorage(updated);
    setLanguageEditorIndex((activeResume?.languages || []).length);
  };

  const handleToggleLanguageDone = (index) => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        const newLanguages = [...(r.languages || [])];
        const current = newLanguages[index] || { name: '', level: 'Select', isDone: false };
        newLanguages[index] = { ...current, isDone: !current.isDone };
        return withDirty({ ...r, languages: newLanguages }, 'languages');
      }
      return r;
    });
    saveToStorage(updated);
  };

  const handleSelectSuggestedLanguage = (languageName) => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        const normalized = languageName.trim();
        const existing = (r.languages || []).some((language) => (language?.name || language || '').toLowerCase() === normalized.toLowerCase());
        if (existing) return r;
        return withDirty({ ...r, languages: [...(r.languages || []), { name: normalized, level: 'Select', isDone: false }] }, 'languages');
      }
      return r;
    });
    saveToStorage(updated);
    setLanguageEditorIndex((activeResume?.languages || []).length);
  };

  const handleGenerateLanguageSuggestions = () => {
    const nextSuggestions = LANGUAGE_SUGGESTION_POOL
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);
    setLanguageSuggestions(nextSuggestions);
  };

  const handleSoftSkillChange = (index, value) => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        const newSoftSkills = [...(r.softSkills || [])];
        newSoftSkills[index] = value;
        return withDirty({ ...r, softSkills: newSoftSkills }, 'softSkills');
      }
      return r;
    });
    saveToStorage(updated);
  };

  const handleAddSoftSkill = () => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        return withDirty({ ...r, softSkills: [...(r.softSkills || []), ''] }, 'softSkills');
      }
      return r;
    });
    saveToStorage(updated);
  };

  const handleRemoveSoftSkill = (index) => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        const newSoftSkills = (r.softSkills || []).filter((_, idx) => idx !== index);
        return withDirty({ ...r, softSkills: newSoftSkills }, 'softSkills');
      }
      return r;
    });
    saveToStorage(updated);
  };

  const handleRemoveLanguage = (index) => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        const newLanguages = (r.languages || []).filter((_, idx) => idx !== index);
        return withDirty({ ...r, languages: newLanguages }, 'languages');
      }
      return r;
    });
    saveToStorage(updated);
  };

  const handleProjectChange = (index, field, value) => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        const newProjects = [...(r.projects || [])];
        newProjects[index] = { ...newProjects[index], [field]: value };
        return withDirty({ ...r, projects: newProjects }, 'projects');
      }
      return r;
    });
    saveToStorage(updated);
  };

  const handleAddProject = () => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        return withDirty({ ...r, projects: [...(r.projects || []), { title: '', description: '' }] }, 'projects');
      }
      return r;
    });
    saveToStorage(updated);
  };

  const handleRemoveProject = (index) => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        const newProjects = (r.projects || []).filter((_, idx) => idx !== index);
        return withDirty({ ...r, projects: newProjects }, 'projects');
      }
      return r;
    });
    saveToStorage(updated);
  };

  const handleRemoveSkill = (index) => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        const newSkills = (r.skills || []).filter((_, idx) => idx !== index);
        return withDirty({ ...r, skills: newSkills }, 'skills');
      }
      return r;
    });
    saveToStorage(updated);
  };

  const handleAddDutyExample = (example) => {
    if (!activeResume) return;
    const currentDuties = getFirstEntry(activeResume.experience).duties || '';
    const newDuties = currentDuties 
      ? `${currentDuties}\nâ€¢ ${example}` 
      : `â€¢ ${example}`;
    handleFieldChange('experience', 'duties', newDuties);
  };

  const filteredTemplates = templates.filter((template) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery = !query || template.name.toLowerCase().includes(query) || template.description.toLowerCase().includes(query);
    const matchesFilter = templateFilter === 'all' ||
      template.category === templateFilter ||
      template.style === templateFilter ||
      (templateFilter === 'academic' && template.bestFor?.toLowerCase().includes('academic')) ||
      (templateFilter === 'ats' && template.atsReady);
    return matchesQuery && matchesFilter;
  }).sort((a, b) => {
    switch (templateSort) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'ats':
        return b.atsScore - a.atsScore;
      case 'alphabetical':
        return a.name.localeCompare(b.name);
      case 'popular':
      default:
        return (b.popularity || 0) - (a.popularity || 0);
    }
  });

  const visibleTemplates = filteredTemplates.slice(0, page * 6);

  const renderLivePreview = (resume) => {
    // If a template is selected on the resume, render its component directly for 1:1 preview
    const templateId = resolveTemplateId(resume?.template || 'modern-ats');
    const TemplateComponent = getTemplateComponent(templateId);
    if (TemplateComponent) {
      const templateDefinition = getTemplateDefinition(templateId);
      const accentColor = getResumeThemeColor(resume, templateDefinition);
      return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="p-3">
            <TemplateComponent resume={resume} color={accentColor} />
          </div>
        </div>
      );
    }

    const fullName = [resume.profile?.firstName, resume.profile?.middleName, resume.profile?.lastName].filter(Boolean).join(' ');
    const profession = resume.profile?.profession?.trim();
    const hasSummary = Boolean(resume.summary?.text?.trim());
    const firstExperience = getFirstEntry(resume.experience);
    const firstEducation = getFirstEntry(resume.education);
    const hasExperience = Boolean(firstExperience?.jobTitle?.trim() || firstExperience?.employer?.trim());
    const hasEducation = Boolean(firstEducation?.degree?.trim() || firstEducation?.fieldOfStudy?.trim());
    const hasContact = Boolean(resume.profile?.email?.trim() || resume.profile?.phone?.trim());
    const hasSkills = (resume.skills || []).some(skill => skill?.name?.trim());
    const hasSoftSkills = (resume.softSkills || []).some(skill => skill?.trim());
    const hasLanguages = (resume.languages || []).some((language) => {
      if (!language) return false;
      return typeof language === 'object'
        ? Boolean(language.name?.trim())
        : Boolean(String(language).trim());
    });
    const hasInterests = Boolean(resume.interests?.text?.trim());
    const hasPhoto = Boolean(resume.photo?.dataUrl || resume.photo?.url);

    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="grid min-h-[320px] md:grid-cols-[280px_1fr]">
          <div className="flex flex-col justify-between bg-sky-700 p-6 text-white">
            <div>
              <h3 className="text-2xl font-bold">Resume</h3>
            </div>
            <div className="flex justify-center">
              {hasPhoto ? (
                <div className="h-40 w-40 overflow-hidden rounded-full border-4 border-white bg-white">
                  <img src={resume.photo.dataUrl || resume.photo.url} alt="Profile" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-40 w-40 rounded-full border-4 border-white/20 bg-white/20" />
              )}
            </div>
          </div>

          <div className="p-6">
            {(fullName || profession) && (
              <div className="mb-6 border-b border-gray-200 pb-4">
                {fullName && <h3 className="text-2xl font-bold text-gray-900">{fullName}</h3>}
{profession && <p className="text-sm text-[#1769E0] mt-1">{profession}</p>}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-[1fr_0.8fr]">
              <div className="space-y-4">
                {hasSummary && (
                  <section>
                    <h4 className="text-sm font-semibold uppercase text-gray-600">Summary</h4>
                    <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{resume.summary.text}</p>
                  </section>
                )}

                {hasExperience && (
                  <section>
                    <h4 className="text-sm font-semibold uppercase text-gray-600">Experience</h4>
                    {firstExperience?.jobTitle && <p className="mt-2 font-semibold">{firstExperience.jobTitle}</p>}
                    {firstExperience?.employer && <p className="text-sm text-gray-600">{firstExperience.employer}</p>}
                  </section>
                )}

                {hasEducation && (
                  <section>
                    <h4 className="text-sm font-semibold uppercase text-gray-600">Education</h4>
                    <p className="mt-2 text-sm text-gray-700">
                      {firstEducation?.degree ? firstEducation.degree : ''}
                      {firstEducation?.degree && firstEducation?.fieldOfStudy ? ' in ' : ''}
                      {firstEducation?.fieldOfStudy || ''}
                    </p>
                  </section>
                )}
              </div>

              {(hasContact || hasSkills || hasInterests) && (
                <div className="space-y-4 rounded-lg bg-gray-50 p-4">
                  {hasContact && (
                    <>
                      {resume.profile?.email && <p className="text-sm text-gray-700"><span className="font-semibold">Email:</span> {resume.profile.email}</p>}
                      {resume.profile?.phone && <p className="text-sm text-gray-700"><span className="font-semibold">Phone:</span> {resume.profile.phone}</p>}
                    </>
                  )}

                  {hasSkills && (
                    <section>
                      <h4 className="text-sm font-semibold uppercase text-gray-600">Technical Skills</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(resume.skills || []).filter(skill => skill?.name?.trim()).map((skill, idx) => (
                          <span key={idx} className="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-700">{skill.name}</span>
                        ))}
                      </div>
                    </section>
                  )}

                  {hasSoftSkills && (
                    <section>
                      <h4 className="text-sm font-semibold uppercase text-gray-600">Soft Skills</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(resume.softSkills || []).filter(skill => skill?.trim()).map((skill, idx) => (
                          <span key={idx} className="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-700">{skill}</span>
                        ))}
                      </div>
                    </section>
                  )}

                  {hasLanguages && (
                    <section>
                      <h4 className="text-sm font-semibold uppercase text-gray-600">Languages</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(resume.languages || [])
                          .filter((language) => {
                            if (!language) return false;
                            if (typeof language === 'object') return Boolean(language.name?.trim());
                            return Boolean(String(language).trim());
                          })
                          .map((language, idx) => {
                            const label = typeof language === 'object'
                              ? `${language.name || ''}${language.level && language.level !== 'Select' ? ` â€” ${language.level}` : ''}`.trim()
                              : String(language);
                            return (
                              <span key={idx} className="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-700">{label}</span>
                            );
                          })}
                      </div>
                    </section>
                  )}

                  {hasInterests && (
                    <section>
                      <h4 className="text-sm font-semibold uppercase text-gray-600">Interests</h4>
                      <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{resume.interests.text}</p>
                    </section>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {view === 'list' && (
        <div className="space-y-6 animate-fade-in">
          {/* Page header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1769E0] dark:text-[#3B82F6]">
                Resume Builder
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-[1.6rem]">
                {t('resume.mySavedCVs') || 'My Saved CVs'}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Create, manage and customize your professional CVs.
              </p>
            </div>

            <button
              onClick={handleOpenTitleModal}
              className="btn btn-primary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm hover:shadow-lg"
            >
              <FiPlus className="h-4 w-4" />
              Create Resume
            </button>
          </div>

          {/* Summary stats â€” only values backed by existing state */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-xs dark:border-slate-700/80 dark:bg-slate-800/80">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FE] text-[#1769E0] dark:bg-[#1769E0]/20 dark:text-[#3B82F6]">
                <FiFileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-none text-slate-900 dark:text-white">{resumes.length}</p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">CVs</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-xs dark:border-slate-700/80 dark:bg-slate-800/80">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-300">
                <FiEdit2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-none text-slate-900 dark:text-white">{resumes.filter((r) => r.status === 'draft').length}</p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Drafts</p>
              </div>
            </div>
          </div>

          {/* Resume Grid */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {resumes.length === 0 ? (
              <div className="col-span-full">
                <div className="flex min-h-[260px] w-full flex-col items-center justify-center rounded-2xl border border-slate-200/70 bg-white px-6 py-8 text-center shadow-xs dark:border-slate-700/80 dark:bg-slate-800/80">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF2FE] dark:bg-[#1769E0]/20">
                    <FiFileText className="h-7 w-7 text-[#1769E0] dark:text-[#3B82F6]" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{t('resume.noCVsTitle') || 'No CVs Created Yet'}</h3>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {t('resume.noCVsDesc') || 'Create your first CV to get started. You can create multiple CVs tailored to different job applications.'}
                  </p>
                  <button
                    onClick={handleOpenTitleModal}
                    className="btn btn-primary mt-6 inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold shadow-sm hover:shadow-lg"
                  >
                    <FiPlus className="h-4 w-4" /> {t('resume.createFirstCV') || 'Create Your First CV'}
                  </button>
                </div>
              </div>
                ) : (
                  resumes.map((resume) => (
                <div key={resume.id} className="group flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-800/80 dark:hover:border-slate-600">
                {/* Resume Structure Thumbnail */}
                <div className="h-32 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-inner dark:border-slate-600 dark:bg-slate-700">
                  <div className="relative h-full w-full">
                    <div className="absolute left-1/2 top-0 origin-top -translate-x-1/2" style={{ transform: 'translateX(-50%) scale(0.12)' }}>
                      {(() => {
                        const templateId = resolveTemplateId(resume.template);
                        const templateDefinition = getTemplateDefinition(templateId);
                        const ThumbComponent = templateDefinition?.component || getTemplateComponent(templateId);
                        return <ThumbComponent resume={resume} color={getResumeThemeColor(resume, templateDefinition)} compact />;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-slate-900 dark:text-white">{resume.title}</h3>
                      {resume.isDefault && (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#EAF2FE] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1769E0] dark:bg-[#1769E0]/20 dark:text-[#3B82F6]">
                          <FiCheckCircle className="h-3 w-3" /> Default
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                      <span>Score</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{resume.score}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                      <div className="h-1.5 rounded-full bg-[#1769E0] transition-all duration-700 ease-out" style={{ width: `${resume.score}%` }} />
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    {!resume.isDefault && (
                      <button
                        title="Set as default"
                        onClick={() => handleSetDefault(resume.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-[#1769E0] transition-colors hover:bg-[#EAF2FE] dark:border-slate-600 dark:text-[#3B82F6] dark:hover:bg-[#1769E0]/10"
                      >
                        <FiCheck className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button 
                      onClick={() => handleEditResume(resume.id)}
                      className="btn btn-outline inline-flex items-center gap-1 rounded-lg border-[#1769E0] px-3 py-1.5 text-xs font-semibold text-[#1769E0] hover:bg-[#EAF2FE] dark:hover:bg-[#1769E0]/10"
                    >
                      {t('common.edit') || 'Edit'} <FiEdit2 className="h-3 w-3" />
                    </button>

                    <button 
                      title={t('common.download') || 'Download'} 
                      onClick={() => handleDownloadPDF(resume)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    >
                      <FiDownload className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      title={t('common.print') || 'Print'} 
                      onClick={() => handleDownloadPDF(resume)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    >
                      <FiPrinter className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      title="Export JSON" 
                      onClick={() => handleExportJson(resume)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    >
                      <FiFileText className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      title={t('common.delete') || 'Delete'} 
                      onClick={() => handleDeleteResume(resume.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-red-500 transition-colors hover:bg-red-50 dark:border-slate-600 dark:hover:bg-red-950/30"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
                ))
              )}
            </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleOpenTitleModal}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1769E0] hover:shadow-md dark:border-slate-700/80 dark:bg-slate-800/80 dark:hover:border-[#3B82F6]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FE] text-[#1769E0] transition-colors group-hover:bg-[#DCEAFD] dark:bg-[#1769E0]/20 dark:text-[#3B82F6] dark:group-hover:bg-[#1769E0]/30">
                <FiPlus className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t('resume.createNewCV') || 'Create New CV'}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t('resume.startFresh') || 'Start Fresh'}</p>
              </div>
              <FiChevronRight className="ml-auto h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-[#1769E0] dark:text-slate-500" />
            </button>

            <button
              type="button"
              onClick={handleOpenImportModal}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-secondary-300 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-800/80 dark:hover:border-secondary-600"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600 transition-colors group-hover:bg-yellow-100 dark:bg-yellow-900/25 dark:text-yellow-400">
                <FiUpload className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t('resume.import') || 'Import'}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t('resume.useCurrentCV') || 'Import a JSON file or use your parsed CV'}</p>
              </div>
              <FiChevronRight className="ml-auto h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-secondary-500 dark:text-slate-500" />
            </button>
          </div>
        </div>
      )}


      {view === 'preview' && activeResume && (
        <div className="space-y-6 animate-slide-up">
          <div className="card p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Resume Preview</h2>
                <p className="text-sm text-gray-500">Your completed CV is ready to review.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setView('editor');
                    setActiveTab(TABS[TABS.length - 1]);
                  }}
                  className="btn btn-outline"
                >
                  Back to Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleExportJson(activeResume)}
                  className="btn btn-outline inline-flex items-center gap-1.5"
                  title="Export this resume as a JSON file that can be imported again"
                >
                  <FiDownload /> Export JSON
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadPDF(activeResume)}
                  className="btn btn-primary"
                >
                  Download / Print
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/40">
              <div className="resume-preview-scaled">
                {renderLivePreview(activeResume)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resume Form Editor */}
      {view === 'editor' && activeResume && (
        <div className="space-y-6 animate-slide-up">
          <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-white/95 pt-2 pb-2 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/95">
            <div className="flex flex-wrap gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === tab
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleOpenAddSection}
                className="flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-all shadow-sm hover:bg-red-600"
              >
                <FiPlusCircle /> Add Section
              </button>
              <button
                type="button"
                onClick={() => handleExportJson(activeResume)}
                title="Export this resume as a JSON file that can be imported again"
                className="flex items-center gap-1.5 rounded-lg border border-[#1769E0] bg-white px-4 py-2 text-sm font-semibold text-[#1769E0] transition-all shadow-sm hover:bg-[#EAF2FE]"
              >
                <FiDownload /> Export JSON
              </button>
              <button
                type="button"
                disabled
                title="AI assistance is not available yet"
                className="flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-500 shadow-sm"
              >
                Ask AI (unavailable)
              </button>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="card border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            {activeTab === 'Profile' && (
              <div className="space-y-5">
                <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                  <button
                    type="button"
                    onClick={() => setExpandedSections((current) => ({ ...current, personal: !current.personal }))}
                    className="flex w-full items-center justify-between rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <span className="flex items-center gap-2 text-base font-semibold text-slate-900">
                      <FiUser className="h-4 w-4 text-sky-600" /> Personal details
                    </span>
                    <FiChevronDown className={`h-4 w-4 text-slate-500 transition ${expandedSections.personal ? 'rotate-180' : ''}`} />
                  </button>

                  {expandedSections.personal && (
                    <div className="mt-5 space-y-5">
                      <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-4">
                        <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
                          <label className="group relative flex h-40 w-40 cursor-pointer items-center justify-center overflow-hidden rounded-[24px] border border-white bg-slate-100 transition hover:border-slate-300 hover:bg-slate-50">
                            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="sr-only" />

                            {activeResume.photo?.dataUrl || activeResume.photo?.url ? (
                              <img src={activeResume.photo.dataUrl || activeResume.photo.url} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-3 text-center text-slate-500">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm text-slate-400">
                                  <FiImage className="h-6 w-6" />
                                </div>
                                <p className="text-sm font-semibold text-slate-900">Photo</p>
                              </div>
                            )}

                            <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-slate-400">
                              {activeResume.photo?.dataUrl || activeResume.photo?.url ? 'Change photo' : ''}
                            </div>
                          </label>

                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">Profile Picture</p>
                            </div>
                            <p className="text-sm font-medium text-slate-600">{activeResume.photo?.fileName || 'No photo selected'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">First name</label>
                          <input
                            type="text"
                            value={activeResume.profile?.firstName || ''}
                            onChange={(e) => handleFieldChange('profile', 'firstName', e.target.value)}
                            maxLength={13}
                            className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">Middle name</label>
                          <input
                            type="text"
                            value={activeResume.profile?.middleName || ''}
                            onChange={(e) => handleFieldChange('profile', 'middleName', e.target.value)}
                            maxLength={13}
                            className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">Last name</label>
                          <input
                            type="text"
                            value={activeResume.profile?.lastName || ''}
                            onChange={(e) => handleFieldChange('profile', 'lastName', e.target.value)}
                            maxLength={13}
                            className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-medium text-slate-700">Desired job position</label>
                          <input
                            type="text"
                            value={activeResume.profile?.profession || ''}
                            onChange={(e) => handleFieldChange('profile', 'profession', e.target.value)}
                            className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
                          <input
                            type="email"
                            value={activeResume.profile?.email || ''}
                            onChange={(e) => handleFieldChange('profile', 'email', e.target.value)}
                            className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">Phone number</label>
                          <input
                            type="tel"
                            value={activeResume.profile?.phone || ''}
                            onChange={(e) => handleFieldChange('profile', 'phone', sanitizeEthiopianPhone(e.target.value, activeResume.profile?.phone || ''))}
                            onKeyDown={(e) => {
                              if (e.ctrlKey || e.metaKey || e.altKey) return;
                              if (e.key.length > 1) return;
                              if (!/^[0-9+]$/.test(e.key)) { e.preventDefault(); return; }
                              const el = e.currentTarget;
                              const current = activeResume.profile?.phone || '';
                              const next = sanitizeEthiopianPhone(current.slice(0, el.selectionStart) + e.key + current.slice(el.selectionEnd), current);
                              if (next === current) e.preventDefault();
                            }}
                            onPaste={(e) => {
                              e.preventDefault();
                              const pasted = e.clipboardData.getData('text/plain') || e.clipboardData.getData('text') || '';
                              if (!pasted) return;
                              const el = e.currentTarget;
                              const current = activeResume.profile?.phone || '';
                              const next = sanitizeEthiopianPhone(current.slice(0, el.selectionStart) + pasted + current.slice(el.selectionEnd), current);
                              if (next === current) return;
                              el.value = next;
                              el.setSelectionRange(next.length, next.length);
                              handleFieldChange('profile', 'phone', next);
                            }}
                            className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">Address</label>
                          <input
                            type="text"
                            value={activeResume.profile?.streetAddress || ''}
                            onChange={(e) => handleFieldChange('profile', 'streetAddress', e.target.value)}
                            className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">City</label>
                          <input
                            type="text"
                            value={activeResume.profile?.city || ''}
                            onChange={(e) => handleFieldChange('profile', 'city', e.target.value)}
                            className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'dateOfBirth', label: 'Date of birth' },
                          { key: 'placeOfBirth', label: 'Place of birth' },
                          { key: 'driverLicense', label: "Driver's license" },
                          { key: 'gender', label: 'Gender' },
                          { key: 'nationality', label: 'Nationality' },
                          { key: 'civilStatus', label: 'Civil status' },
                          { key: 'website', label: 'Website' },
                          { key: 'linkedIn', label: 'LinkedIn' },
                          { key: 'customField', label: 'Custom field' }
                        ].map((field) => {
                          const active = optionalFields[field.key] || Boolean(activeResume.profile?.[field.key]);
                          return (
                            <button
                              key={field.key}
                              type="button"
                              onClick={() => setOptionalFields((current) => ({ ...current, [field.key]: !current[field.key] }))}
                              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                                active
                                  ? 'border-sky-500 bg-sky-50 text-sky-700'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300'
                              }`}
                            >
                              + {field.label}
                            </button>
                          );
                        })}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        {optionalFields.dateOfBirth || activeResume.profile?.dateOfBirth ? (
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Date of birth</label>
                            <input
                              type="date"
                              value={activeResume.profile?.dateOfBirth || ''}
                              onChange={(e) => handleFieldChange('profile', 'dateOfBirth', e.target.value)}
                              className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            />
                          </div>
                        ) : null}
                        {optionalFields.placeOfBirth || activeResume.profile?.placeOfBirth ? (
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Place of birth</label>
                            <input
                              type="text"
                              value={activeResume.profile?.placeOfBirth || ''}
                              onChange={(e) => handleFieldChange('profile', 'placeOfBirth', e.target.value)}
                              className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            />
                          </div>
                        ) : null}
                        {optionalFields.driverLicense || activeResume.profile?.driverLicense ? (
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Driver's license</label>
                            <input
                              type="text"
                              value={activeResume.profile?.driverLicense || ''}
                              onChange={(e) => handleFieldChange('profile', 'driverLicense', e.target.value)}
                              className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            />
                          </div>
                        ) : null}
                        {optionalFields.gender || activeResume.profile?.gender ? (
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Gender</label>
                            <input
                              type="text"
                              value={activeResume.profile?.gender || ''}
                              onChange={(e) => handleFieldChange('profile', 'gender', e.target.value)}
                              className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            />
                          </div>
                        ) : null}
                        {optionalFields.nationality || activeResume.profile?.nationality ? (
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Nationality</label>
                            <input
                              type="text"
                              value={activeResume.profile?.nationality || ''}
                              onChange={(e) => handleFieldChange('profile', 'nationality', e.target.value)}
                              className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            />
                          </div>
                        ) : null}
                        {optionalFields.civilStatus || activeResume.profile?.civilStatus ? (
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Civil status</label>
                            <input
                              type="text"
                              value={activeResume.profile?.civilStatus || ''}
                              onChange={(e) => handleFieldChange('profile', 'civilStatus', e.target.value)}
                              className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            />
                          </div>
                        ) : null}
                        {optionalFields.website || activeResume.profile?.website ? (
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Website</label>
                            <input
                              type="text"
                              value={activeResume.profile?.website || ''}
                              onChange={(e) => handleFieldChange('profile', 'website', e.target.value)}
                              className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            />
                          </div>
                        ) : null}
                        {optionalFields.linkedIn || activeResume.profile?.linkedIn ? (
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">LinkedIn</label>
                            <input
                              type="text"
                              value={activeResume.profile?.linkedIn || ''}
                              onChange={(e) => handleFieldChange('profile', 'linkedIn', e.target.value)}
                              className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            />
                          </div>
                        ) : null}
                        {optionalFields.customField || activeResume.profile?.customField ? (
                          <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-slate-700">Custom field</label>
                            <input
                              type="text"
                              value={activeResume.profile?.customField || ''}
                              onChange={(e) => handleFieldChange('profile', 'customField', e.target.value)}
                              className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Experience' && (
              <div className="space-y-6">
                <div className="rounded-xl bg-sky-500 p-4 text-white shadow-sm">
                  <p className="text-sm font-medium flex items-center gap-2">
                    ðŸ’¡ Now, let's fill out your work history <span className="font-normal">| Here's what you need to know: Employers scan your resume for six seconds to decide if you're a match. We'll suggest bullet points that make a great impression.</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Job Title</label>
                        <input
                          type="text"
                          value={getFirstEntry(activeResume.experience).jobTitle || ''}
                          onChange={(e) => handleFieldChange('experience', 'jobTitle', e.target.value)}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Employer</label>
                        <input
                          type="text"
                          value={getFirstEntry(activeResume.experience).employer || ''}
                          onChange={(e) => handleFieldChange('experience', 'employer', e.target.value)}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">City</label>
                        <input
                          type="text"
                          value={getFirstEntry(activeResume.experience).city || ''}
                          onChange={(e) => handleFieldChange('experience', 'city', e.target.value)}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">State</label>
                        <input
                          type="text"
                          value={getFirstEntry(activeResume.experience).state || ''}
                          onChange={(e) => handleFieldChange('experience', 'state', e.target.value)}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Start Date</label>
                        <input
                          type="date"
                          value={getFirstEntry(activeResume.experience).startDate || ''}
                          onChange={(e) => handleFieldChange('experience', 'startDate', e.target.value)}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">End Date</label>
                        <input
                          type="date"
                          disabled={getFirstEntry(activeResume.experience).currentWork}
                          value={getFirstEntry(activeResume.experience).currentWork ? '' : (getFirstEntry(activeResume.experience).endDate || '')}
                          onChange={(e) => handleFieldChange('experience', 'endDate', e.target.value)}
                          className="input disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="currentWork"
                        checked={getFirstEntry(activeResume.experience).currentWork || false}
                        onChange={(e) => handleFieldChange('experience', 'currentWork', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="currentWork" className="text-sm text-gray-700 dark:text-gray-300">I currently work here</label>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between border-b bg-gray-50 p-2.5 dark:border-gray-700 dark:bg-gray-800">
                        <button
                          type="button"
                          disabled
                          title="AI assistance is not available yet"
                          className="flex cursor-not-allowed items-center gap-1 rounded bg-gray-300 px-3 py-1 text-xs font-bold text-gray-500 shadow-sm"
                        >
                          Ask AI for Assistance (unavailable)
                        </button>
                        <div className="text-[10px] text-gray-400">
                          PRO TIP: Ask AI any question about your job duties <span className="ml-1 rounded bg-blue-600 px-1.5 py-0.5 font-extrabold uppercase text-white">Jobs</span>
                        </div>
                      </div>
                      <textarea
                        rows="6"
                        placeholder="Enter Job Responsibilities"
                        value={getFirstEntry(activeResume.experience).duties || ''}
                        onChange={(e) => handleFieldChange('experience', 'duties', e.target.value)}
                        className="w-full resize-none border-none bg-white p-4 text-sm focus:outline-none dark:bg-gray-800"
                      />
                    </div>
                  </div>

                  <div className="flex h-[400px] flex-col overflow-hidden rounded-xl border bg-indigo-50/30 p-4 dark:border-gray-700 dark:bg-gray-900/40">
                    <h3 className="mb-2 text-base font-bold text-indigo-900 dark:text-indigo-400">Showing examples for:</h3>
                    <input
                      type="text"
                      placeholder="Ex: Cashier.."
                      value={exampleSearch}
                      onChange={(e) => setExampleSearch(e.target.value)}
                      className="input mb-4 bg-white text-sm dark:bg-gray-800"
                    />

                    <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                      {DUTY_EXAMPLES.map((ex, idx) => (
                        <div key={idx} className="flex items-start gap-2 rounded-lg border bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                          <button
                            type="button"
                            onClick={() => handleAddDutyExample(ex)}
                            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
                          >
                            <FiPlus className="h-3.5 w-3.5" />
                          </button>
                          <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">{ex}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Education' && (
              <div className="space-y-6">
                <div className="rounded-xl bg-sky-500 p-4 text-white shadow-sm">
                  <p className="text-sm font-medium flex items-center gap-2">
                    ðŸ’¡ Tell us about your education <span className="font-normal">| Include every school, even if you're still there or didn't graduate.</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">School Name</label>
                    <input
                      type="text"
                      value={getFirstEntry(activeResume.education).schoolName || ''}
                      onChange={(e) => handleFieldChange('education', 'schoolName', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">City</label>
                    <input
                      type="text"
                      value={getFirstEntry(activeResume.education).city || ''}
                      onChange={(e) => handleFieldChange('education', 'city', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">State</label>
                    <input
                      type="text"
                      value={getFirstEntry(activeResume.education).state || ''}
                      onChange={(e) => handleFieldChange('education', 'state', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Select a degree</label>
                    <select
                      value={getFirstEntry(activeResume.education).degree || 'Select'}
                      onChange={(e) => handleFieldChange('education', 'degree', e.target.value)}
                      className="select"
                    >
                      <option value="Select">Select</option>
                      <option value="High School Diploma">High School Diploma</option>
                      <option value="Bachelor's Degree">Bachelor's Degree</option>
                      <option value="Master's Degree">Master's Degree</option>
                      <option value="Ph.D.">Ph.D.</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Field of Study</label>
                    <input
                      type="text"
                      value={getFirstEntry(activeResume.education).fieldOfStudy || ''}
                      onChange={(e) => handleFieldChange('education', 'fieldOfStudy', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Graduation Start Date</label>
                    <input
                      type="date"
                      value={getFirstEntry(activeResume.education).startDate || ''}
                      onChange={(e) => handleFieldChange('education', 'startDate', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Graduation End Date</label>
                    <input
                      type="date"
                      disabled={getFirstEntry(activeResume.education).currentStudy}
                      value={getFirstEntry(activeResume.education).currentStudy ? '' : (getFirstEntry(activeResume.education).endDate || '')}
                      onChange={(e) => handleFieldChange('education', 'endDate', e.target.value)}
                      className="input disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="currentStudy"
                    checked={getFirstEntry(activeResume.education).currentStudy || false}
                    onChange={(e) => handleFieldChange('education', 'currentStudy', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="currentStudy" className="text-sm text-gray-700 dark:text-gray-300">I currently study here</label>
                </div>
              </div>
            )}

{activeTab === 'Additional Info' && (
              <div className="space-y-6">
                <div className="rounded-xl bg-sky-500 p-4 text-white shadow-sm">
                  <p className="text-sm font-medium flex items-center gap-2">
                    💡 Add your key projects <span className="font-normal">| Describe what you built and the impact of each project in concise bullet form.</span>
                  </p>
                </div>

                <div className="space-y-4">
                  {(activeResume.projects || []).map((project, idx) => (
                    <div key={idx} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Project Title</label>
                          <input
                            type="text"
                            value={project.title}
                            onChange={(e) => handleProjectChange(idx, 'title', e.target.value)}
                            className="input"
                            placeholder="Project title"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-1.5">Project Description</label>
                        <textarea
                          rows="5"
                          value={project.description}
                          onChange={(e) => handleProjectChange(idx, 'description', e.target.value)}
                          className="textarea w-full"
                          placeholder="Describe the project and your role, using bullet points if possible."
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveProject(idx)}
                        className="mt-4 inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
                      >
                        <FiTrash className="h-4 w-4" /> Remove project
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddProject}
                    className="flex items-center gap-1.5 py-2 text-sm font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    <FiPlusCircle /> Add Another Project
                  </button>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Personal Interests</label>
                    <textarea
                      rows="4"
                      value={activeResume.interests?.text || ''}
                      onChange={(e) => handleFieldChange('interests', 'text', e.target.value)}
                      className="textarea w-full"
                      placeholder="Examples: hiking, reading, public speaking, photography..."
                    />
                  </div>
                </div>

                {/* Custom sections added through "Add Section" */}
                <div className="pt-2">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-base font-bold text-gray-900 dark:text-white">Custom Sections</h4>
                    <button
                      type="button"
                      onClick={handleOpenAddSection}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      <FiPlusCircle /> Add Section
                    </button>
                  </div>

                  {getCustomSectionOrder(activeResume).length === 0 ? (
                    <div className="mt-3 rounded-xl border border-dashed border-gray-300 p-4 text-center dark:border-gray-600">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Add custom sections like Awards, Achievements, Volunteer Experience, Publications or References. They appear in the live preview and are saved with your CV.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-4">
                      {getCustomSectionOrder(activeResume).map((key, index) => {
                        const section = activeResume.additionalInfo?.[key] || {};
                        const items = Array.isArray(section.items) ? section.items : [];
                        const orderedKeys = getCustomSectionOrder(activeResume);
                        return (
                          <div key={key} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <input
                                type="text"
                                value={section.title || ''}
                                onChange={(e) => handleAdditionalSectionChange(key, 'title', e.target.value)}
                                className="input w-full flex-1 font-semibold"
                                placeholder="Section title"
                              />
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleMoveSection(key, -1)}
                                  disabled={index === 0}
                                  title="Move section up"
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-600 dark:text-gray-300"
                                >
                                  <FiArrowUp className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveSection(key, 1)}
                                  disabled={index === orderedKeys.length - 1}
                                  title="Move section down"
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-600 dark:text-gray-300"
                                >
                                  <FiArrowDown className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAdditionalSection(key)}
                                  title="Remove section"
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-red-600 transition hover:bg-red-50 dark:border-gray-600"
                                >
                                  <FiTrash className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            <div className="mt-4 space-y-3">
                              {items.map((item, itemIndex) => (
                                <div key={itemIndex} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                  <input
                                    type="text"
                                    value={item?.title || ''}
                                    onChange={(e) => handleAdditionalItemChange(key, itemIndex, 'title', e.target.value)}
                                    className="input w-full"
                                    placeholder="Item title (e.g. project, award or event name)"
                                  />
                                  <textarea
                                    rows="3"
                                    value={item?.description || ''}
                                    onChange={(e) => handleAdditionalItemChange(key, itemIndex, 'description', e.target.value)}
                                    className="textarea mt-2 w-full"
                                    placeholder="Description, details or bullet points"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAdditionalItem(key, itemIndex)}
                                    className="mt-2 inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700"
                                  >
                                    <FiTrash className="h-4 w-4" /> Remove item
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => handleAddAdditionalItem(key)}
                                className="inline-flex items-center gap-1.5 py-1 text-sm font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                              >
                                <FiPlusCircle /> Add item
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Skills' && (
              <div className="space-y-6">
                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                        <FiMenu className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Skills</p>
                        <h3 className="text-lg font-semibold text-slate-900">Manage your key abilities</h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsSkillsCollapsed((current) => !current)}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        {isSkillsCollapsed ? 'Expand' : 'Collapse'}
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                        aria-label="More options"
                      >
                        <FiMoreHorizontal className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {!isSkillsCollapsed && (
                  <div className="space-y-4">
                    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="grid gap-4 lg:grid-cols-[1.7fr_auto] lg:items-end">
                      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Skill</label>
                          <input
                            type="text"
                            value={(activeResume.skills?.[skillEditorIndex]?.name) || ''}
                            onChange={(e) => {
                              if (skillEditorIndex === null) return;
                              handleSkillChange(skillEditorIndex, 'name', e.target.value);
                            }}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                            placeholder="Enter a skill"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Level</label>
                          <select
                            value={(activeResume.skills?.[skillEditorIndex]?.level) || 'Select'}
                            onChange={(e) => {
                              if (skillEditorIndex === null) return;
                              handleSkillChange(skillEditorIndex, 'level', e.target.value);
                            }}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                          >
                            <option value="Select">Make a choice</option>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                            <option value="Expert">Expert</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (skillEditorIndex !== null) {
                              handleToggleSkillDone(skillEditorIndex);
                              setSkillEditorIndex(null);
                            }
                          }}
                          className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          Done
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (skillEditorIndex !== null) {
                              handleRemoveSkill(skillEditorIndex);
                              setSkillEditorIndex(null);
                            }
                          }}
                          className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                          title="Delete skill"
                        >
                          <FiTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                      <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-sm font-semibold text-slate-900">Suggested skills</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {technicalSkillSuggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => handleSelectSuggestedSkill(suggestion)}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                              >
                                <FiPlusCircle className="h-4 w-4 text-slate-400" />
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 justify-end">
                          <button
                            type="button"
                            onClick={handleAddSkill}
                            className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            <FiPlusCircle className="mr-2 h-4 w-4" /> Add skill
                          </button>
                          <button
                            type="button"
                            onClick={handleGenerateTechnicalSkillSuggestions}
                            className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                          >
                            AI Suggestions
                          </button>
                          <button
                            type="button"
                            onClick={handleGenerateTechnicalSkillSuggestions}
                            className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                            aria-label="Regenerate suggestions"
                          >
                            <FiRotateCcw className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-3">
                        {(activeResume.skills || []).map((skill, index) => (
                          <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                                <label className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Skill</label>
                                <input
                                  type="text"
                                  value={skill.name}
                                  onChange={(e) => handleSkillChange(index, 'name', e.target.value)}
                                  className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                                  placeholder="Skill name"
                                />
                              </div>
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                                <label className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Level</label>
                                <select
                                  value={skill.level || 'Select'}
                                  onChange={(e) => handleSkillChange(index, 'level', e.target.value)}
                                  className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                                >
                                  <option value="Select">Make a choice</option>
                                  <option value="Beginner">Beginner</option>
                                  <option value="Intermediate">Intermediate</option>
                                  <option value="Advanced">Advanced</option>
                                  <option value="Expert">Expert</option>
                                </select>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSkillEditorIndex(index);
                                  handleToggleSkillDone(index);
                                }}
                                className={`inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition ${skill.isDone ? 'bg-[#EAF2FE] text-[#1769E0] border border-[#1769E0]' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                              >
                                {skill.isDone ? 'Completed' : 'Done'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveSkill(index)}
                                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                                aria-label="Delete skill"
                              >
                                <FiTrash className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Soft skills</p>
                            <h4 className="mt-1 text-sm font-semibold text-slate-900">Add your interpersonal strengths</h4>
                          </div>
                          <button
                            type="button"
                            onClick={handleAddSoftSkill}
                            className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            <FiPlusCircle className="mr-2 h-4 w-4" /> Add soft skill
                          </button>
                        </div>

                        <div className="mt-4 space-y-3">
                          {(activeResume.softSkills || []).map((softSkill, softIndex) => (
                            <div key={softIndex} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                              <input
                                type="text"
                                value={softSkill}
                                onChange={(e) => handleSoftSkillChange(softIndex, e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                                placeholder="Soft skill name"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveSoftSkill(softIndex)}
                                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                                aria-label="Delete soft skill"
                              >
                                <FiTrash className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-900">Suggested soft skills</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {softSkillSuggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => handleSelectSuggestedSoftSkill(suggestion)}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                              >
                                <FiPlusCircle className="h-4 w-4 text-slate-400" />
                                {suggestion}
                              </button>
                            ))}
                          </div>
                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              onClick={handleGenerateSoftSkillSuggestions}
                              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                              Refresh soft suggestions
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    </div>
                )}
              </div>
            )}

                {activeTab === 'Languages' && (
                  <div className="space-y-6">
                    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                            <FiGlobe className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Languages</p>
                            <h3 className="text-lg font-semibold text-slate-900">Track your spoken and written fluency</h3>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddLanguage}
                          className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <FiPlusCircle className="mr-2 h-4 w-4" /> Add language
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {(activeResume.languages || []).length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
                          No languages added yet. Use the button above or choose from suggested languages.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {(activeResume.languages || []).map((language, index) => (
                            <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                                <div className="grid gap-4 md:grid-cols-[1fr_0.85fr]">
                                  <div>
                                    <label className="block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Language</label>
                                    <input
                                      type="text"
                                      value={(language?.name) || ''}
                                      onChange={(e) => handleLanguageInputChange(index, 'name', e.target.value)}
                                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                                      placeholder="Language name"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Proficiency</label>
                                    <select
                                      value={(language?.level) || 'Select'}
                                      onChange={(e) => handleLanguageInputChange(index, 'level', e.target.value)}
                                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                                    >
                                      <option value="Select">Select level</option>
                                      <option value="Beginner">Beginner</option>
                                      <option value="Intermediate">Intermediate</option>
                                      <option value="Advanced">Advanced</option>
                                      <option value="Expert">Expert</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleLanguageDone(index)}
                                    className={`inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition ${language?.isDone ? 'bg-[#EAF2FE] text-[#1769E0] border border-[#1769E0]' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                  >
                                    {language?.isDone ? 'Completed' : 'Done'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveLanguage(index)}
                                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                                    aria-label="Delete language"
                                  >
                                    <FiTrash className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-900">Suggested languages</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {languageSuggestions.map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => handleSelectSuggestedLanguage(suggestion)}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                              <FiPlusCircle className="h-4 w-4 text-slate-400" />
                              {suggestion}
                            </button>
                          ))}
                        </div>
                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={handleGenerateLanguageSuggestions}
                            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            Refresh language suggestions
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

            {activeTab === 'Summary' && (
              <div className="space-y-6">
                <div className="rounded-xl bg-sky-500 p-4 text-white shadow-sm">
                  <p className="text-sm font-medium">Add a short professional summary that highlights your strengths and career goals.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Professional Summary</label>
                  <textarea
                    rows="8"
                    value={activeResume.summary?.text || ''}
                    onChange={(e) => handleFieldChange('summary', 'text', e.target.value)}
                    className="textarea w-full"
                    placeholder="Write a concise summary of your experience, strengths, and career goals..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'Template' && (
              <div className="space-y-6">
                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                      <FiGrid className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Template</p>
                      <h3 className="text-lg font-semibold text-slate-900">Choose a layout and accent color</h3>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {templates.map((template) => {
                    const isSelected = activeResume?.template === template.id;
                    const TemplateComponent = template.component;
                    return (
                      <div
                        key={template.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectTemplate(template.id)}
                        onKeyDown={(event) => event.key === 'Enter' && handleSelectTemplate(template.id)}
                        className={`cursor-pointer rounded-[20px] border bg-white p-3 transition duration-200 ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-slate-200 hover:border-slate-400 hover:shadow-sm'}`}
                      >
                        <div className="thumbnail-container">
                          <TemplateComponent resume={activeResume || {}} color={getResumeThemeColor(activeResume, template)} compact />
                          {isSelected && (
                            <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white">Selected</span>
                          )}
                        </div>

                        <div className="mt-3 text-center">
                          <p className="text-sm font-semibold text-slate-900">{template.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{template.badge}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Accent color</p>
                  <h4 className="text-sm font-semibold text-slate-900">Pick a color to personalize your resume</h4>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {TEMPLATE_COLOR_NAMES.map((colorName) => {
                      const theme = getTemplateTheme(colorName);
                      const isSelected = activeResume?.theme?.color === colorName;
                      return (
                        <button
                          key={colorName}
                          type="button"
                          onClick={() => handleSelectTemplateColor(colorName)}
                          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${isSelected ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-200 hover:border-slate-400'}`}
                        >
                          <span className="inline-flex h-4 w-4 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                          <span className="capitalize">{colorName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {!['Profile', 'Experience', 'Education', 'Skills', 'Summary', 'Languages', 'Additional Info', 'Template'].includes(activeTab) && (
              <div className="py-10 text-center">
                <FiFileText className="mx-auto mb-3 h-16 w-16 text-gray-300" />
                <h3 className="text-lg font-semibold">{activeTab} Section Editor</h3>
                <p className="mt-1 text-sm text-gray-500">Fill out your {activeTab.toLowerCase()} entries here. These will render in your template.</p>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
              <button
                type="button"
                onClick={handlePrevTab}
                disabled={activeTab === 'Profile'}
                className="btn btn-primary flex items-center gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <FiArrowLeft /> Previous
              </button>

              <div className="flex items-center gap-3">
                {saveMessage && <span className="text-sm font-medium text-blue-600">{saveMessage}</span>}
                <button
                  type="button"
                  onClick={handleSaveForm}
                  className="flex items-center gap-1.5 rounded-lg bg-[#1769E0] px-6 py-2.5 font-bold text-white shadow transition hover:bg-[#0D5BC4]"
                >
                  <FiSave /> Save
                </button>
              </div>

              <button
                type="button"
                onClick={handleNextTab}
                className="btn btn-primary flex items-center gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {activeTab === TABS[TABS.length - 1] ? 'Finish' : 'Next'} <FiArrowRight />
              </button>
            </div>
          </div>
        </div>

        <div className="xl:sticky xl:top-6 self-start min-w-0">
          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm min-w-0 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Live preview</p>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Your CV updates instantly</h3>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                Live
              </span>
            </div>
            <div className="max-h-[780px] overflow-auto rounded-[18px] border border-slate-200 bg-slate-50 p-3 min-w-0 dark:border-gray-700 dark:bg-gray-900/50">
              <div className="resume-preview-scaled pt-6 overflow-hidden relative">
                {renderLivePreview(activeResume)}
              </div>
            </div>

            <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">CV Score</p>
                  <p className="text-xs text-slate-400 mt-0.5">Based on completed sections of your CV</p>
                </div>
                <span className="text-2xl font-bold text-[#1769E0] dark:text-[#3B82F6]">{activeResume.score}%</span>
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-gray-700">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-[#1769E0] to-[#0D5BC4] transition-all duration-700 ease-out"
                  style={{ width: `${activeResume.score}%` }}
                />
              </div>
            </div>

            <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex flex-row items-center justify-between gap-3">
                <button type="button" onClick={() => setIsTemplateModalOpen((current) => !current)} className="inline-flex items-center gap-2 rounded-full border border-indigo-500 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100">
                  <FiGrid className="h-4 w-4" />
                  Templates
                  {isTemplateModalOpen ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
                </button>

                <div className="flex items-center gap-2">
                  <button type="button" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-100">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em]">Aa</span>
                    Arial
                  </button>
                  <button type="button" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-100">
                    <FiType className="h-4 w-4" />
                  </button>
                  <button type="button" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-100">
                    <FiTool className="h-4 w-4" />
                  </button>
                  <span className="inline-flex h-3.5 w-3.5 rounded-full bg-sky-500 ring-2 ring-white shadow-sm" />
                </div>
              </div>

              {isTemplateModalOpen && (
                <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 p-3 shadow-sm min-w-0">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Choose template</p>
                      <h4 className="text-sm font-semibold text-slate-900">Select a resume layout</h4>
                    </div>
                    <button type="button" onClick={() => setIsTemplateModalOpen(false)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                      <FiChevronUp className="h-4 w-4" /> Close
                    </button>
                  </div>

                  <div className="w-full max-w-full overflow-hidden box-border min-w-0">
                    <div className="w-full max-w-full overflow-x-auto overflow-y-hidden box-border min-w-0 template-gallery-scroll">
                      <div className="flex flex-nowrap w-max min-w-full gap-4 pb-3 pr-2">
                        {templates.map((template) => {
                          const isSelected = activeResume?.template === template.id;
                          const TemplateComponent = template.component;
                          return (
                            <div
                              key={template.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => handleSelectTemplate(template.id)}
                              onKeyDown={(event) => event.key === 'Enter' && handleSelectTemplate(template.id)}
                              className={`min-w-[220px] md:min-w-[260px] xl:min-w-[300px] max-w-[300px] flex-shrink-0 rounded-[20px] border bg-white p-3 transition duration-200 ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-[0_16px_48px_rgba(99,102,241,0.12)]' : 'border-slate-200 hover:border-slate-400 hover:shadow-sm'} cursor-pointer`}
                            >
                              <div className="thumbnail-container">
                                <TemplateComponent resume={activeResume || {}} color={getResumeThemeColor(activeResume, template)} compact />
                                {isSelected && (
                                  <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white">Selected</span>
                                )}
                              </div>

                              <div className="mt-3 text-center">
                                <p className="text-sm font-semibold text-slate-900">{template.name}</p>
                                <p className="mt-1 text-xs text-slate-500">{template.badge}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
                    <span className="mr-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Color</span>
                    {TEMPLATE_COLOR_NAMES.map((colorName) => {
                      const theme = getTemplateTheme(colorName);
                      const isSelected = activeResume?.theme?.color === colorName;
                      return (
                        <button
                          key={colorName}
                          type="button"
                          onClick={() => handleSelectTemplateColor(colorName)}
                          title={colorName}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 transition ${isSelected ? 'border-slate-900' : 'border-white hover:border-slate-400'}`}
                          style={{ backgroundColor: theme.primaryColor }}
                          aria-label={`Accent color ${colorName}`}
                        >
                          {isSelected && <FiCheck className="h-4 w-4 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

      {isPhotoEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/80 p-4">
          <div className="my-8 w-full max-w-4xl overflow-hidden rounded-[28px] border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-700 px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Edit profile photo</h2>
                <p className="text-sm text-slate-400">Preview your photo, apply zoom and rotation, then confirm.</p>
              </div>
              <button
                type="button"
                onClick={handleCancelPhotoEditor}
                className="rounded-full border border-slate-700 bg-slate-800 p-2 text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-[1.5fr_0.9fr]">
              <div className="flex min-h-[240px] items-center justify-center rounded-[24px] bg-slate-800 p-4">
                {photoEditorSrc ? (
                  <div className="relative h-[240px] w-full overflow-hidden rounded-[24px] bg-slate-900 sm:h-[320px]">
                    <img
                      src={photoEditorSrc}
                      alt="Profile editor preview"
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{
                        transform: `scale(${photoEditorZoom}) rotate(${photoEditorRotate}deg)`,
                        transformOrigin: 'center center'
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center text-slate-400">No image loaded. Please choose a photo again.</div>
                )}
              </div>

              <div className="space-y-6 rounded-[24px] border border-slate-700 bg-slate-950 p-5">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-white">Photo file</p>
                  <p className="text-sm text-slate-400">{photoEditorFileName || 'profile-photo.png'}</p>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-white">Zoom</label>
                  <input
                    type="range"
                    min="0.8"
                    max="2"
                    step="0.05"
                    value={photoEditorZoom}
                    onChange={(e) => setPhotoEditorZoom(parseFloat(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>0.8x</span>
                    <span>{photoEditorZoom.toFixed(2)}x</span>
                    <span>2x</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-white">Rotate</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPhotoEditorRotate((current) => current - 90)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-slate-300 transition hover:border-slate-500 hover:text-white"
                    >
                      <FiRotateCcw className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoEditorRotate((current) => current + 90)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-slate-300 transition hover:border-slate-500 hover:text-white"
                    >
                      <FiRotateCw className="h-5 w-5" />
                    </button>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={photoEditorRotate}
                      onChange={(e) => setPhotoEditorRotate(parseInt(e.target.value, 10))}
                      className="w-full accent-sky-500"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>-180Â°</span>
                    <span>{photoEditorRotate}Â°</span>
                    <span>180Â°</span>
                  </div>
                </div>

                <div className="space-y-3 rounded-3xl border border-slate-700 bg-slate-900 p-4">
                  <p className="text-sm font-semibold text-white">Preview notes</p>
                  <p className="text-sm text-slate-400">Use zoom to fit your face and rotate if your photo is tilted. The final image will be saved into your resume preview.</p>
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleCancelPhotoEditor}
                    className="rounded-full border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPhotoEditor}
                    className="rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                  >
                    Confirm Photo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Enter Resume Title Modal */}
      {isTitleModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-slide-down">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center w-full relative">
                Enter Resume Title
                <button 
                  onClick={() => setIsTitleModalOpen(false)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </h2>
            </div>
            
            <form onSubmit={handleConfirmTitle}>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-500 text-center">This name will be use to save your resume.</p>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Enter Resume Title"
                    value={newResumeTitle}
                    onChange={(e) => setNewResumeTitle(e.target.value)}
                    className="input w-full px-4 py-3 border border-gray-300 rounded-lg text-center"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex justify-center gap-4 p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                <button
                  type="button"
                  onClick={() => setIsTitleModalOpen(false)}
                  className="bg-red-50 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-full transition shadow"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-full transition shadow"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {isAddSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-800 animate-slide-down">
            <div className="flex items-center justify-between border-b p-5 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Section</h2>
                <p className="text-sm text-gray-500">Choose a section to add to your resume. It appears in the live preview and is saved with your CV.</p>
              </div>
              <button type="button" onClick={() => setIsAddSectionModalOpen(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {SECTION_TYPES.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.key}
                      type="button"
                      onClick={() => handleAddSectionType(section.key)}
                      disabled={section.fixed}
                      className={`group flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                        section.fixed
                          ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60 dark:border-gray-700 dark:bg-gray-800'
                          : 'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 dark:border-gray-700 dark:hover:bg-indigo-900/20'
                      }`}
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${section.fixed ? 'bg-gray-200 text-gray-500 dark:bg-gray-700' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-gray-900 dark:text-white">{section.label}</span>
                        {section.fixed && <span className="block text-xs text-gray-500">Already a fixed section</span>}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Custom section title</label>
                <input
                  type="text"
                  value={customSectionTitle}
                  onChange={(e) => setCustomSectionTitle(e.target.value)}
                  placeholder="e.g. Volunteering, Hobbies, Community Work"
                  className="input w-full"
                />
                <button
                  type="button"
                  onClick={() => handleAddSectionType('custom')}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  <FiPlusCircle /> Add Custom Section
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Resume Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-800 animate-slide-down">
            <div className="flex items-center justify-between border-b p-5 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Import Resume</h2>
                <p className="text-sm text-gray-500">Restore a resume from a JSON export or from the data already parsed from your uploaded CV.</p>
              </div>
              <button type="button" onClick={handleCloseImportModal} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <button
                type="button"
                onClick={handleImportFileClick}
                disabled={isImporting}
                className="flex w-full items-center gap-4 rounded-xl border border-gray-200 p-4 text-left transition hover:border-indigo-400 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:hover:bg-indigo-900/20"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600 dark:bg-yellow-900/25 dark:text-yellow-400">
                  <FiUpload className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                    {isImporting ? 'Importing...' : 'Import from JSON file'}
                  </span>
                  <span className="block text-xs text-gray-500">Select a resume JSON file exported from the Resume Builder.</span>
                </span>
              </button>
              <input
                ref={importFileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={handleImportFromParsedCV}
                disabled={!hasParsedCVData()}
                className="flex w-full items-center gap-4 rounded-xl border border-gray-200 p-4 text-left transition hover:border-indigo-400 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:hover:bg-indigo-900/20"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-900/25 dark:text-sky-400">
                  <FiDatabase className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white">Use data parsed from your uploaded CV</span>
                  <span className="block text-xs text-gray-500">
                    {hasParsedCVData()
                      ? 'Creates a new CV pre-filled with the skills, education and certifications detected from your uploaded CV file.'
                      : 'Upload a CV on your profile first so it can be parsed.'}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Choose Template Modal */}
    </div>
  );
};

export default ResumeBuilder;
