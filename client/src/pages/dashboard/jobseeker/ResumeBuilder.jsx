// ============================================
// Resume Builder Wizard Component
// ============================================
import { useState, useEffect } from 'react';
import { 
  FiFileText, FiPlus, FiUpload, FiEdit2, FiDownload, 
  FiPrinter, FiInfo, FiTrash2, FiX, FiSearch, FiSave, FiPlusCircle,
  FiArrowLeft, FiArrowRight, FiTrash, FiMail, FiPhone, FiMapPin, FiCheckCircle, FiTool, FiDatabase, FiCode, FiGlobe,
  FiCloud, FiChevronDown, FiChevronUp, FiMoreHorizontal, FiRotateCcw, FiRotateCw, FiBookOpen, FiBriefcase, FiSmile, FiImage, FiType, FiLayers, FiUser, FiGrid, FiMenu
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { PhoneIcon, MailIcon, LocationIcon, GlobeIcon, DotIcon } from '../../../components/icons/ResumeIcons';
import { updateProfile } from '../../../store/slices/authSlice';
import TemplateBadge from '../../../components/resume/templates/TemplateBadge';
import TemplateSearch from '../../../components/resume/templates/TemplateSearch';
import TemplateFilter from '../../../components/resume/templates/TemplateFilter';
import TemplateToolbar from '../../../components/resume/templates/TemplateToolbar';
import TemplateCard from '../../../components/resume/templates/TemplateCard';
import { getTemplateDefinition, getTemplateDefinitions, getTemplateComponent, resolveTemplateId } from '../../../components/resume/templates/config';
import { calculateResumeCompletion, withResumeScore } from '../../../utils/resumeCompletion';

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

  const createInitialResume = (title, templateId = 'modern-ats') => ({
    id: `resume_${Date.now()}`,
    title: title || 'Untitled Resume',
    score: 0,
    status: 'draft',
    template: templateId,
    profile: {
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
    },
    experience: {
      jobTitle: '',
      employer: '',
      city: '',
      state: '',
      startDate: '',
      endDate: '',
      currentWork: false,
      duties: ''
    },
    education: {
      schoolName: '',
      city: '',
      state: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      currentStudy: false
    },
    projects: [{ title: '', description: '' }],
    skills: [{ name: '' }],
    softSkills: [''],
    languages: [{ name: '', level: 'Select', isDone: false }],
    summary: { text: '' },
    interests: { text: '' },
    certifications: [],
    photo: null
  });

  const handleDownloadPDF = (resume) => {
    const printWindow = window.open('', '_blank');
    const technicalSkills = (resume.skills || []).map(s => `<li>${s.name || ''}${s.level ? ` — ${s.level}` : ''}</li>`).join('');
    const softSkills = (resume.softSkills || []).filter(Boolean).map(skill => `<li>${skill}</li>`).join('');
const languages = (resume.languages || []).filter(Boolean).map(lang => {
    if (typeof lang === 'object') return `${lang.name || ''}${lang.level && lang.level !== 'Select' ? ` — ${lang.level}` : ''}`.trim();
    return lang;
  }).filter(Boolean).map(lang => `<li>${lang}</li>`).join('');
    const projects = (resume.projects || []).filter(p => p.title || p.description).map((project) => `
        <div class="project-entry">
          <div class="project-title">${project.title || 'Project title'}</div>
          <p class="project-description">${project.description || 'Project details'}</p>
        </div>
      `).join('');

    const content = `
      <html>
      <head>
        <title>${resume.title || 'Resume'} - CV</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Montserrat:wght@500;600;700&display=swap" rel="stylesheet" />
        <style>
          body { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; margin: 0; color: #0f172a; background: #f8fafc; }
          .page { max-width: 900px; margin: 24px auto; background: white; box-shadow: 0 20px 70px rgba(15, 23, 42, 0.12); display: flex; }
          .sidebar { width: 300px; background: #0b5137; color: #f8fafc; padding: 32px 28px; display: flex; flex-direction: column; gap: 24px; }
          .sidebar h2 { margin: 0; font-size: 24px; letter-spacing: 0.02em; font-family: 'Montserrat', system-ui, sans-serif; }
          .topbar-title { font-family: 'Montserrat', system-ui, sans-serif; }
          .sidebar p.subtitle { color: #d1fae5; margin: 0; font-size: 14px; line-height: 1.6; }
          .sidebar .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.18em; margin-bottom: 12px; color: #d1fae5; }
          .sidebar .info-item { margin-bottom: 12px; font-size: 13px; line-height: 1.7; }
          .sidebar .info-item span { display: block; color: #a7f3d0; margin-bottom: 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.16em; }
          .sidebar .badge { display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,.1); border-radius: 999px; font-size: 12px; padding: 8px 12px; margin-bottom: 8px; }
          .content { flex: 1; padding: 32px 36px; }
          .topbar { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
          .topbar-title { margin: 0; font-size: 34px; letter-spacing: -0.04em; line-height: 1.05; }
          .topbar-subtitle { margin: 6px 0 0; color: #4b5563; font-size: 14px; line-height: 1.25; }
          .section { margin-top: 28px; }
          .section-title { font-size: 12px; font-weight: 700; color: #064e3b; text-transform: uppercase; letter-spacing: 0.18em; margin-bottom: 12px; }
          .section-text { font-size: 13px; color: #334155; line-height: 1.6; white-space: pre-line; }
          .entry-title { display: flex; justify-content: space-between; gap: 16px; font-weight: 700; color: #0f172a; font-size: 14px; }
          .entry-subtitle { margin-top: 4px; color: #475569; font-size: 13px; }
          .project-title { font-weight: 700; font-size: 14px; margin-top: 14px; }
          .project-description { margin-top: 6px; color: #334155; font-size: 13px; line-height: 1.7; white-space: pre-line; }
          .entry-list { margin-top: 12px; padding-left: 18px; }
          .entry-list li { margin-bottom: 8px; font-size: 13px; color: #334155; }
          .contact-item { display: flex; align-items: baseline; gap: 8px; margin-bottom: 12px; }
          .contact-item strong { min-width: 80px; font-size: 12px; color: #a7f3d0; text-transform: uppercase; letter-spacing: 0.14em; }
          .photo { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; border-radius: 9999px; margin-top: 12px; background: rgba(255,255,255,.12); border: 4px solid rgba(255,255,255,0.08); }
          .sidebar-header { display:flex; gap:12px; align-items:center }
          .avatar-circle { width:72px; height:72px; border-radius:9999px; object-fit:cover; border:3px solid rgba(255,255,255,0.12); }
          .button-print { display: inline-flex; align-items: center; justify-content: center; margin-top: 12px; padding: 10px 16px; background: #10b981; color: white; border-radius: 999px; border: none; cursor: pointer; font-size: 13px; font-weight: 700; }
          @media print {
            body { background: white; margin: 0; }
            .page { box-shadow: none; margin: 0; }
            .button-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="sidebar">
            <div class="sidebar-header">
              ${resume.photo?.dataUrl ? `<img src="${resume.photo.dataUrl}" alt="Photo" class="avatar-circle" />` : `<div style="width:72px;height:72px;border-radius:9999px;background:rgba(255,255,255,0.06);border:3px solid rgba(255,255,255,0.08)"></div>`}
              <div>
                 <h2>${[resume.profile?.firstName, resume.profile?.middleName, resume.profile?.lastName].filter(Boolean).join(' ') || ''}</h2>
                <p class="subtitle">${resume.profile?.profession || 'Professional Title'}</p>
              </div>
            </div>

            <div>
              <div class="section-title">Contact</div>
                <div class="info-item">${/* phone */ ''}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;margin-right:8px"><path d="M22 16.92a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18A2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.72c.12.97.33 1.92.63 2.82a2 2 0 0 1-.45 2L8.09 9.91a16 16 0 0 0 6 6l1.37-1.37a2 2 0 0 1 2-.45c.9.3 1.85.51 2.82.63A2 2 0 0 1 22 16.92z" stroke="#a7f3d0" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Phone</span>: ${resume.profile?.phone || 'N/A'}</div>
                <div class="info-item">${/* email */ ''}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;margin-right:8px"><path d="M4 4h16v16H4z" stroke="#a7f3d0" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="22,6 12,13 2,6" stroke="#a7f3d0" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Email</span>: ${resume.profile?.email || 'N/A'}</div>
                <div class="info-item">${/* location */ ''}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;margin-right:8px"><path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 0 1 18 0z" stroke="#a7f3d0" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="10" r="3" fill="#a7f3d0"/></svg><span>Location</span>: ${resume.profile?.streetAddress || ''}${resume.profile?.city ? `, ${resume.profile.city}` : ''}${resume.profile?.stateProvince ? `, ${resume.profile.stateProvince}` : ''}</div>
                ${resume.profile?.nationality ? `<div class="info-item">${/* globe */ ''}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;margin-right:8px"><circle cx="12" cy="12" r="10" stroke="#a7f3d0" stroke-width="1.2"/><path d="M2 12h20" stroke="#a7f3d0" stroke-width="1.2" stroke-linecap="round"/><path d="M12 2a15 15 0 0 1 0 20" stroke="#a7f3d0" stroke-width="1.2" stroke-linecap="round"/></svg><span>Nationality</span>: ${resume.profile.nationality}</div>` : ''}
            </div>

            <div>
              <div class="section-title">Technical Skills</div>
              <div class="entry-list">
                ${renderTechnicalSkillsForPDF(resume)}
              </div>
            </div>

            <div>
              <div class="section-title">Soft Skills</div>
              <ul class="entry-list">
                ${softSkills || '<li>No soft skills listed.</li>'}
              </ul>
            </div>

            <div>
              <div class="section-title">Languages</div>
              <ul class="entry-list">
                ${languages || '<li>No languages listed.</li>'}
              </ul>
            </div>

            ${resume.photo?.dataUrl ? `<img src="${resume.photo.dataUrl}" alt="Photo" class="photo" />` : ''}
          </div>

          <div class="content">
            <div class="topbar">
              <div>
                <h1 class="topbar-title">${[resume.profile?.firstName, resume.profile?.middleName, resume.profile?.lastName].filter(Boolean).join(' ') || ''}</h1>
                <p class="topbar-subtitle">${resume.profile?.profession || 'Professional Summary Subtitle'}</p>
              </div>
              <button class="button-print" onclick="window.print()">Print / Save PDF</button>
            </div>

            <div class="section">
              <div class="section-title">Career Objective</div>
              <div class="section-text">${resume.summary?.text || 'Write a short career objective that highlights your goals, value to employers, and key strengths.'}</div>
            </div>

            <div class="section">
              <div class="section-title">Work Experience</div>
              <div class="entry-title">
                <span>${resume.experience?.jobTitle || 'Job Title'}</span>
                <span>${resume.experience?.startDate || ''} - ${resume.experience?.currentWork ? 'Present' : (resume.experience?.endDate || '')}</span>
              </div>
              <div class="entry-subtitle">${resume.experience?.employer || 'Employer'}${resume.experience?.city ? ` • ${resume.experience.city}` : ''}${resume.experience?.state ? `, ${resume.experience.state}` : ''}</div>
              <div class="section-text">${resume.experience?.duties || 'Describe your main responsibilities and achievements in this position.'}</div>
            </div>

            <div class="section">
              <div class="section-title">Projects</div>
              ${projects || '<p class="section-text">Add a project to highlight your hands-on experience.</p>'}
            </div>

            <div class="section">
              <div class="section-title">Education</div>
              <div class="entry-title">
                <span>${resume.education?.degree || 'Degree'} in ${resume.education?.fieldOfStudy || 'Field of Study'}</span>
                <span>${resume.education?.startDate || ''} - ${resume.education?.currentStudy ? 'Present' : (resume.education?.endDate || '')}</span>
              </div>
              <div class="entry-subtitle">${resume.education?.schoolName || 'School Name'}${resume.education?.city ? ` • ${resume.education.city}` : ''}${resume.education?.state ? `, ${resume.education.state}` : ''}</div>
            </div>

            <div class="section">
              <div class="section-title">Interests</div>
              <div class="section-text">${resume.interests?.text || 'List a few interests that demonstrate your personality and work style.'}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };
  const TABS = ['Profile', 'Experience', 'Education', 'Projects', 'Skills', 'Languages', 'Summary'];
  const [activeTab, setActiveTab] = useState('Profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [exampleSearch, setExampleSearch] = useState('');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [templateSort, setTemplateSort] = useState('popular');
  const [page, setPage] = useState(1);
  const templates = getTemplateDefinitions();

  // Load resumes from storage scoped to the current authenticated user.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(resumeStorageKey);
      const legacyStored = localStorage.getItem('ethiojob_resumes');

      if (stored) {
        const parsed = JSON.parse(stored);
        const scored = (Array.isArray(parsed) ? parsed : []).map((resume) => withResumeScore(resume));
        setResumes(scored);
        localStorage.setItem(resumeStorageKey, JSON.stringify(scored));
      } else if (legacyStored) {
        const parsed = JSON.parse(legacyStored);
        const scored = (Array.isArray(parsed) ? parsed : []).map((resume) => withResumeScore(resume));
        setResumes(scored);
        localStorage.setItem(resumeStorageKey, JSON.stringify(scored));
        localStorage.removeItem('ethiojob_resumes');
      } else {
        setResumes([]);
        localStorage.setItem(resumeStorageKey, JSON.stringify([]));
      }
    } catch (error) {
      console.error('Failed to load resumes from storage:', error);
      setResumes([]);
      localStorage.setItem(resumeStorageKey, JSON.stringify([]));
    }

    setActiveResumeId(null);
    setView('list');
    setSaveMessage('');
    setNewResumeTitle('');
    setIsTitleModalOpen(false);
    setIsTemplateModalOpen(false);
  }, [resumeStorageKey]);

  const saveToStorage = (updatedResumes) => {
    const scored = (Array.isArray(updatedResumes) ? updatedResumes : []).map((resume) => withResumeScore(resume));
    setResumes(scored);
    localStorage.setItem(resumeStorageKey, JSON.stringify(scored));
  };

  const handleOpenTitleModal = () => {
    setNewResumeTitle('');
    setIsTitleModalOpen(true);
  };

  const handleConfirmTitle = (e) => {
    e.preventDefault();
    if (!newResumeTitle.trim()) {
      toast.error('Please enter a resume title');
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
  };

  const handleSelectTemplate = (templateId) => {
    const resolvedTemplateId = resolveTemplateId(templateId);
    if (activeResume) {
      const updated = resumes.map((resume) =>
        resume.id === activeResume.id ? { ...resume, template: resolvedTemplateId } : resume
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
  };

  const handleEditResume = (resumeId) => {
    setActiveResumeId(resumeId);
    setView('editor');
    setActiveTab('Profile');
  };

  const handleDeleteResume = (resumeId) => {
    if (window.confirm('Are you sure you want to delete this resume?')) {
      const filtered = resumes.filter(r => r.id !== resumeId);
      saveToStorage(filtered);
      toast.success('Resume deleted successfully');
    }
  };

  const handleSaveForm = async (e) => {
    if (e) e.preventDefault();
    if (!activeResume) return;

    // Persist current resumes state to localStorage
    saveToStorage(resumes);
    setSaveMessage('Saved successfully');

    // Sync the created CV data into the job seeker profile so it can be used
    // for matching and personalized job recommendations.
    try {
      const profile = activeResume.profile || {};
      const resumePayload = {};
      if (profile.firstName) resumePayload.firstName = profile.firstName;
      if (profile.lastName) resumePayload.lastName = profile.lastName;
      if (profile.profession) {
        resumePayload.headline = profile.profession;
        resumePayload.currentRole = profile.profession;
      }
      if (activeResume.summary?.text) resumePayload.bio = activeResume.summary.text;
      if (profile.phone) resumePayload.phone = profile.phone;
      if (profile.city || profile.stateProvince || profile.streetAddress) {
        resumePayload.location = {
          city: profile.city || '',
          address: profile.streetAddress || '',
          region: profile.stateProvince || '',
        };
      }
      const skills = (activeResume.skills || []).map((s) => s?.name || s).filter(Boolean);
      if (skills.length) resumePayload.skillNames = skills;
      const languages = (activeResume.languages || [])
        .filter((l) => l && (l.name || typeof l === 'string'))
        .map((l) => (typeof l === 'string' ? { name: l, level: 'Fluent' } : { name: l.name, level: l.level || 'Fluent' }))
        .filter((l) => l.name);
      if (languages.length) resumePayload.languages = languages;
      if (activeResume.education?.degree) {
        resumePayload.educationDetails = [{
          degree: [activeResume.education.degree, activeResume.education.fieldOfStudy].filter(Boolean).join(' in '),
          institution: activeResume.education.schoolName || '',
          startDate: activeResume.education.startDate || '',
          endDate: activeResume.education.currentStudy ? '' : (activeResume.education.endDate || ''),
          location: [activeResume.education.city, activeResume.education.state].filter(Boolean).join(', '),
        }];
      }
      if (activeResume.experience?.jobTitle) {
        resumePayload.experienceDetails = [{
          title: activeResume.experience.jobTitle,
          company: activeResume.experience.employer || '',
          startDate: activeResume.experience.startDate || '',
          endDate: activeResume.experience.currentWork ? '' : (activeResume.experience.endDate || ''),
          location: [activeResume.experience.city, activeResume.experience.state].filter(Boolean).join(', '),
          description: activeResume.experience.duties || '',
        }];
      }
      if (Object.keys(resumePayload).length > 0) {
        await dispatch(updateProfile(resumePayload)).unwrap();
        setSaveMessage('Saved and profile updated');
        toast.success('CV saved and profile updated');
      }
    } catch (err) {
      console.error('Failed to sync CV data to profile:', err);
      toast.success('Saved successfully');
    }
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
  const handleFieldChange = (section, field, value) => {
    setSaveMessage('');
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        if (section === 'skills' && field === 'value') {
          return { ...r, skills: value };
        }
        if (section === 'softSkills' && field === 'value') {
          return { ...r, softSkills: value };
        }
        if (section === 'languages' && field === 'value') {
          return { ...r, languages: value };
        }
        return {
          ...r,
          [section]: {
            ...r[section],
            [field]: value
          }
        };
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
          return {
            ...r,
            photo: {
              fileName: photoEditorFileName,
              dataUrl: croppedDataUrl
            }
          };
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
    };
    image.src = photoEditorSrc;
  };

  const openPhotoEditorFromCurrentPhoto = () => {
    if (!activeResume?.photo?.dataUrl) return;
    openPhotoEditor(activeResume.photo.dataUrl, activeResume.photo.fileName || 'profile-photo.png');
  };

  // Skills dynamic list update
  const handleSkillChange = (index, field, value) => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        const newSkills = [...(r.skills || [])];
        newSkills[index] = { ...newSkills[index], [field]: value };
        return { ...r, skills: newSkills };
      }
      return r;
    });
    saveToStorage(updated);
  };

  const handleAddSkill = () => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        const newSkills = [...(r.skills || []), { name: '', level: 'Select', isDone: false }];
        return { ...r, skills: newSkills };
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
        return { ...r, skills: newSkills };
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
        return { ...r, skills: [...(r.skills || []), { name: normalized, level: 'Select', isDone: false }] };
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
        return { ...r, softSkills: [...(r.softSkills || []), normalized] };
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
        return { ...r, languages: newLanguages };
      }
      return r;
    });
    saveToStorage(updated);
  };

  const handleAddLanguage = () => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        return { ...r, languages: [...(r.languages || []), { name: '', level: 'Select', isDone: false }] };
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
        return { ...r, languages: newLanguages };
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
        return { ...r, languages: [...(r.languages || []), { name: normalized, level: 'Select', isDone: false }] };
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
        return { ...r, softSkills: newSoftSkills };
      }
      return r;
    });
    saveToStorage(updated);
  };

  const handleAddSoftSkill = () => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        return { ...r, softSkills: [...(r.softSkills || []), ''] };
      }
      return r;
    });
    saveToStorage(updated);
  };

  const handleRemoveSoftSkill = (index) => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        const newSoftSkills = (r.softSkills || []).filter((_, idx) => idx !== index);
        return { ...r, softSkills: newSoftSkills };
      }
      return r;
    });
    saveToStorage(updated);
  };

  const handleRemoveLanguage = (index) => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        const newLanguages = (r.languages || []).filter((_, idx) => idx !== index);
        return { ...r, languages: newLanguages };
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
        return { ...r, projects: newProjects };
      }
      return r;
    });
    saveToStorage(updated);
  };

  const handleAddProject = () => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        return { ...r, projects: [...(r.projects || []), { title: '', description: '' }] };
      }
      return r;
    });
    saveToStorage(updated);
  };

  const handleRemoveProject = (index) => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        const newProjects = (r.projects || []).filter((_, idx) => idx !== index);
        return { ...r, projects: newProjects };
      }
      return r;
    });
    saveToStorage(updated);
  };

  const handleRemoveSkill = (index) => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        const newSkills = (r.skills || []).filter((_, idx) => idx !== index);
        return { ...r, skills: newSkills };
      }
      return r;
    });
    saveToStorage(updated);
  };

  const handleAddDutyExample = (example) => {
    if (!activeResume) return;
    const currentDuties = activeResume.experience?.duties || '';
    const newDuties = currentDuties 
      ? `${currentDuties}\n• ${example}` 
      : `• ${example}`;
    handleFieldChange('experience', 'duties', newDuties);
  };

  // Render a visual layout of the CV structure based on template style
  const renderCVStructure = (templateId) => {
    switch (templateId) {
      case 'general_ats':
        return (
          <div className="w-full h-full p-2 flex flex-col gap-1.5 bg-white dark:bg-gray-800">
            <div className="w-12 h-2 bg-gray-400 dark:bg-gray-500 rounded mx-auto mb-1"></div>
            <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="w-2/3 h-1 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="w-full h-8 border border-dashed border-gray-200 dark:border-gray-700 rounded p-1 flex flex-col gap-1">
              <div className="w-1/3 h-1 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded"></div>
              <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="w-full h-8 border border-dashed border-gray-200 dark:border-gray-700 rounded p-1 flex flex-col gap-1">
              <div className="w-1/4 h-1 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        );
      case 'fresh_man':
        return (
          <div className="w-full h-full p-2 flex gap-2 bg-white dark:bg-gray-800">
            <div className="w-1/3 h-full border-r dark:border-gray-700 pr-1 flex flex-col gap-1.5">
              <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 mx-auto"></div>
              <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="w-4/5 h-1 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="w-full h-1.5 bg-gray-300 dark:bg-gray-600 rounded mt-2"></div>
              <div className="w-5/6 h-1 bg-gray-100 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="w-2/3 h-full flex flex-col gap-2">
              <div className="w-16 h-2 bg-gray-400 dark:bg-gray-500 rounded"></div>
              <div className="w-full h-8 border border-dashed border-gray-200 dark:border-gray-700 rounded p-1 flex flex-col gap-1">
                <div className="w-1/2 h-1 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="w-full h-8 border border-dashed border-gray-200 dark:border-gray-700 rounded p-1 flex flex-col gap-1">
                <div className="w-1/3 h-1 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        );
      case 'graphic':
      default:
        return (
          <div className="w-full h-full p-2 flex flex-col gap-2 bg-white dark:bg-gray-800">
            <div className="w-full h-6 bg-teal-600 dark:bg-teal-700 rounded flex items-center justify-between px-2">
              <div className="w-10 h-1.5 bg-white/70 rounded"></div>
              <div className="w-4 h-4 rounded-full bg-white/50"></div>
            </div>
            <div className="flex gap-2 flex-1">
              <div className="w-1/2 h-full flex flex-col gap-1.5">
                <div className="w-3/4 h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded"></div>
                <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="w-1/2 h-full flex flex-col gap-1.5">
                <div className="w-3/4 h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded"></div>
                <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        );
    }
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
  // Helper: categorize technical skills into named groups for display
  const categorizeSkills = (skills = []) => {
    const groups = {
      'Web Development': [],
      'Programming Languages': [],
      'Database': [],
      'Tools & Technologies': [],
      Other: []
    };

    const web = ['html','css','javascript','react','vue','angular','next','nuxt'];
    const langs = ['python','java','php','c#','c++','c','ruby','go','rust','typescript'];
    const dbs = ['mysql','postgresql','postgres','mongodb','sqlite','mssql','oracle'];
    const tools = ['git','github','vscode','docker','xamp','xampp','gitlab','jenkins','aws','azure','firebase'];

    skills.forEach(s => {
      const name = (s.name || '').toLowerCase();
      if (web.some(w => name.includes(w))) groups['Web Development'].push(s.name);
      else if (langs.some(l => name.includes(l))) groups['Programming Languages'].push(s.name);
      else if (dbs.some(d => name.includes(d))) groups['Database'].push(s.name);
      else if (tools.some(t => name.includes(t))) groups['Tools & Technologies'].push(s.name);
      else groups.Other.push(s.name || s);
    });

    return groups;
  };

  const renderTechnicalSkills = (resume) => {
    const groups = categorizeSkills(resume.skills || []);
    return (
      <div className="space-y-3">
        {Object.entries(groups).map(([title, items]) => (
          items.length > 0 && (
            <div key={title}>
              <div className="text-xs font-semibold uppercase text-teal-100">{title}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {items.map((it, idx) => (
                  <span key={idx} className="rounded-full bg-white/10 px-3 py-1 text-xs flex items-center gap-2">
                    <FiCheckCircle className="w-3 h-3 text-white/80" />
                    <span>{it}</span>
                  </span>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    );
  };

  // PDF helper returning HTML string for categorized skills
  const renderTechnicalSkillsForPDF = (resume) => {
    const groups = categorizeSkills(resume.skills || []);
    return Object.entries(groups).map(([title, items]) => {
      if (!items.length) return '';
      const list = items.map(i => `<li style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><svg width=\"10\" height=\"10\" viewBox=\"0 0 10 10\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"5\" cy=\"5\" r=\"5\" fill=\"#10b981\"/></svg><span>${i}</span></li>`).join('');
      return `<div style=\"margin-bottom:10px\"><strong style=\"display:block;font-size:12px;color:#e6fff2;margin-bottom:6px\">${title}</strong><ul style=\"margin:0;padding-left:0;color:#f0fff5;list-style:none\">${list}</ul></div>`;
    }).join('') || '<div style="color:#f0fff5">No technical skills listed.</div>';
  };

  const renderLivePreview = (resume) => {
    // If a template is selected on the resume, render its component directly for 1:1 preview
    const templateId = resolveTemplateId(resume?.template || 'modern-ats');
    const TemplateComponent = getTemplateComponent(templateId);
    if (TemplateComponent) {
      const templateDefinition = getTemplateDefinition(templateId);
      const accentColor = templateDefinition?.accent || 'blue';
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
    const hasExperience = Boolean(resume.experience?.jobTitle?.trim() || resume.experience?.employer?.trim());
    const hasEducation = Boolean(resume.education?.degree?.trim() || resume.education?.fieldOfStudy?.trim());
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
    const hasPhoto = Boolean(resume.photo?.dataUrl);

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
                  <img src={resume.photo.dataUrl} alt="Profile" className="h-full w-full object-cover" />
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
                {profession && <p className="text-sm text-primary-600 mt-1">{profession}</p>}
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
                    {resume.experience?.jobTitle && <p className="mt-2 font-semibold">{resume.experience.jobTitle}</p>}
                    {resume.experience?.employer && <p className="text-sm text-gray-600">{resume.experience.employer}</p>}
                  </section>
                )}

                {hasEducation && (
                  <section>
                    <h4 className="text-sm font-semibold uppercase text-gray-600">Education</h4>
                    <p className="mt-2 text-sm text-gray-700">
                      {resume.education?.degree ? resume.education.degree : ''}
                      {resume.education?.degree && resume.education?.fieldOfStudy ? ' in ' : ''}
                      {resume.education?.fieldOfStudy || ''}
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
                              ? `${language.name || ''}${language.level && language.level !== 'Select' ? ` — ${language.level}` : ''}`.trim()
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

  const renderTemplatePreview = (resume) => {
    const templateId = resume?.template || 'general_ats';
    const fullName = [resume.profile?.firstName, resume.profile?.middleName, resume.profile?.lastName].filter(Boolean).join(' ');

    if (templateId === 'fresh_man') {
      return (
        <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-slate-900 to-slate-700 p-6 text-white shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold" style={{ fontFamily: 'Montserrat, system-ui, sans-serif', lineHeight: 1.05 }}>{fullName}</h3>
              <p className="text-sm text-slate-300 mt-1" style={{ fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.3 }}>{resume.profile?.profession || 'Your Profession'}</p>
            </div>
            {resume.photo?.dataUrl && (
              <img src={resume.photo.dataUrl} alt="Profile" className="h-20 w-20 rounded-full border-4 border-white/20 object-cover" />
            )}
          </div>
            <div className="mt-6 grid gap-3 text-sm text-slate-200">
            <p className="flex items-center gap-2"><MailIcon className="text-white" /><span className="font-semibold text-white">Email:</span> {resume.profile?.email || 'N/A'}</p>
            <p className="flex items-center gap-2"><PhoneIcon className="text-white" /><span className="font-semibold text-white">Phone:</span> {resume.profile?.phone || 'N/A'}</p>
          </div>
          <div className="mt-6 space-y-4">
            <section>
              <h4 className="text-sm uppercase tracking-[0.2em] text-teal-300">Summary</h4>
              <p className="mt-2 text-sm text-slate-200 whitespace-pre-line">{resume.summary?.text || 'Add a summary.'}</p>
            </section>
            <section>
              <h4 className="text-sm uppercase tracking-[0.2em] text-teal-300">Experience</h4>
              <p className="mt-2 font-semibold">{resume.experience?.jobTitle || 'Job Title'}</p>
              <p className="text-sm text-slate-300">{resume.experience?.employer || 'Employer'}</p>
            </section>
            <section>
              <h4 className="text-sm uppercase tracking-[0.2em] text-teal-300">Skills</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {(resume.skills || []).filter(Boolean).map((skill, idx) => (
                  <span key={idx} className="rounded-full bg-white/10 px-3 py-1 text-xs">{skill.name || 'Skill'}</span>
                ))}
              </div>
            </section>
          </div>
        </div>
      );
    }

    if (templateId === 'graphic') {
      return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="rounded-lg bg-indigo-600 p-4 text-white">
            <h3 className="text-2xl font-bold" style={{ fontFamily: 'Montserrat, system-ui, sans-serif', lineHeight: 1.05 }}>{fullName}</h3>
            <p className="text-sm text-indigo-100" style={{ fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.25 }}>{resume.profile?.profession || 'Your Profession'}</p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <section>
                <h4 className="text-sm font-semibold uppercase text-indigo-600">Professional Summary</h4>
                <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">{resume.summary?.text || 'Add your professional summary here.'}</p>
              </section>
              <section>
                <h4 className="text-sm font-semibold uppercase text-indigo-600">Experience</h4>
                <p className="mt-2 font-semibold">{resume.experience?.jobTitle || 'Job Title'}</p>
                <p className="text-sm text-gray-600">{resume.experience?.employer || 'Employer'}</p>
              </section>
            </div>
            <div className="space-y-4 rounded-lg bg-gray-50 p-4">
              <div className="text-sm text-gray-600 space-y-2">
                <p className="flex items-center gap-2"><MailIcon className="text-slate-700" /><strong className="font-semibold">Email:</strong> {resume.profile?.email || 'N/A'}</p>
                <p className="flex items-center gap-2"><PhoneIcon className="text-slate-700" /><strong className="font-semibold">Phone:</strong> {resume.profile?.phone || 'N/A'}</p>
              </div>
              <section>
                <h4 className="text-sm font-semibold uppercase text-indigo-600">Skills</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                {(resume.skills || []).filter(Boolean).map((skill, idx) => (
                  <span key={idx} className="rounded-full bg-indigo-100 px-3 py-1 text-xs text-indigo-700 flex items-center gap-2"><FiCheckCircle className="w-3 h-3" />{skill.name || 'Skill'}</span>
                ))}
              </div>
              </section>
              <section>
                <h4 className="text-sm font-semibold uppercase text-indigo-600">Interests</h4>
                <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">{resume.interests?.text || 'No interests added yet.'}</p>
              </section>
            </div>
          </div>
        </div>
      );
    }

    if (templateId === 'professional') {
      return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="border-b pb-4">
            <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, system-ui, sans-serif', fontWeight: 700 }}>{fullName}</h3>
            <p className="text-sm text-primary-600 mt-1" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{resume.profile?.profession || 'Your Profession'}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              <div className="flex items-center gap-2"><PhoneIcon className="text-slate-700" />{resume.profile?.phone || 'N/A'}</div>
              <div className="flex items-center gap-2"><MailIcon className="text-slate-700" />{resume.profile?.email || 'N/A'}</div>
              <div className="flex items-center gap-2"><LocationIcon className="text-slate-700" />{resume.profile?.city || ''}{resume.profile?.state ? `, ${resume.profile.state}` : ''}</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-700 text-white">
              <div className="grid md:grid-cols_[0.9fr_0.65fr]">
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Montserrat, system-ui, sans-serif', lineHeight: 1.02 }}>{fullName}</h3>
                    <p className="mt-2 text-sm text-slate-300" style={{ fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.25 }}>{resume.profile?.profession || 'Professional Title'}</p>
                </div>

                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-300">Career Objective</h4>
                  <p className="mt-3 text-sm leading-7 text-slate-700 whitespace-pre-line">{resume.summary?.text || 'Write a short career objective that highlights your goals and value to employers.'}</p>
                </section>

                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-300">Work Experience</h4>
                  <div className="mt-3">
                    <p className="font-semibold text-white">{resume.experience?.jobTitle || 'Job Title'}</p>
                    <p className="text-sm text-slate-300">{resume.experience?.employer || 'Employer'} • {resume.experience?.city || 'City'}, {resume.experience?.state || 'State'}</p>
                    <p className="mt-2 text-sm text-slate-200 whitespace-pre-line">{resume.experience?.duties || 'Describe your primary responsibilities and accomplishments in this role.'}</p>
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-300">Projects</h4>
                  <div className="mt-3 space-y-4">
                    {(resume.projects || []).filter(p => p.title || p.description).map((project, idx) => (
                      <div key={idx}>
                        <p className="font-semibold text-white">{project.title || 'Project title'}</p>
                        <p className="mt-1 text-sm text-slate-300 whitespace-pre-line">{project.description || 'Brief project description.'}</p>
                      </div>
                    ))}
                    {!((resume.projects || []).filter(p => p.title || p.description).length) && (
                      <p className="text-sm text-slate-300">Add your most important projects to showcase real-world experience.</p>
                    )}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-300">Education</h4>
                  <div className="mt-3">
                    <p className="font-semibold text-white">{resume.education?.degree || 'Degree'} in {resume.education?.fieldOfStudy || 'Field of Study'}</p>
                    <p className="text-sm text-slate-300">{resume.education?.schoolName || 'School Name'} • {resume.education?.startDate || 'Start'} - {resume.education?.currentStudy ? 'Present' : (resume.education?.endDate || 'End')}</p>
                  </div>
                </section>
              </div>

              <div className="" style={{background:'#0b5137',padding:'24px',color:'#f0fff5',borderLeft:'1px solid rgba(255,255,255,0.04)'}}>
                <div className="flex items-start gap-3">
                  {resume.photo?.dataUrl ? (
                    <img src={resume.photo.dataUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-white/10" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/10" />
                  )}
                  <div>
                    <h4 className="text-lg font-bold">{fullName}</h4>
                    <p className="text-sm mt-1">{resume.profile?.profession || ''}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-100">Contact</h4>
                  <div className="mt-3 space-y-2 text-sm">
                    <p className="flex items-center gap-2"><FiMail className="w-4 h-4 text-teal-200" /><strong className="text-teal-100">Email:</strong> <span className="ml-1">{resume.profile?.email || 'N/A'}</span></p>
                    <p className="flex items-center gap-2"><FiPhone className="w-4 h-4 text-teal-200" /><strong className="text-teal-100">Phone:</strong> <span className="ml-1">{resume.profile?.phone || 'N/A'}</span></p>
                    <p className="flex items-center gap-2"><FiMapPin className="w-4 h-4 text-teal-200" /><strong className="text-teal-100">Location:</strong> <span className="ml-1">{resume.profile?.city || resume.profile?.streetAddress || 'N/A'}</span></p>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-100">Technical Skills</h4>
                  <div className="mt-3">
                    {renderTechnicalSkills(resume)}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-200">Contact</h4>
                  <div className="mt-4 space-y-3 text-sm text-slate-200">
                    <p><span className="font-semibold text-teal-300">Email:</span> {resume.profile?.email || 'N/A'}</p>
                    <p><span className="font-semibold text-teal-300">Phone:</span> {resume.profile?.phone || 'N/A'}</p>
                    <p><span className="font-semibold text-teal-300">Location:</span> {resume.profile?.streetAddress || ''}{resume.profile?.city ? `, ${resume.profile.city}` : ''}</p>
                  </div>
                </div>

                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-200">Skills</h4>
                  <div className="mt-4 space-y-2 text-sm text-slate-200">
                    {(resume.skills || []).filter(Boolean).map((skill, idx) => (
                      <p key={idx} className="rounded-lg bg-white/10 px-3 py-2">{skill.name || 'Skill'}{skill.level ? ` — ${skill.level}` : ''}</p>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-200">Soft Skills</h4>
                  <div className="mt-4 space-y-2 text-sm text-slate-200">
                    {(resume.softSkills || []).filter(Boolean).map((skill, idx) => (
                      <p key={idx} className="rounded-lg bg-white/10 px-3 py-2">{skill}</p>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-200">Languages</h4>
                  <div className="mt-4 space-y-2 text-sm text-slate-200">
                    {(resume.languages || []).filter(Boolean).map((language, idx) => (
                      <p key={idx} className="rounded-lg bg-white/10 px-3 py-2">{language}</p>
                    ))}
                  </div>
                </section>

                {resume.photo?.dataUrl && false}
              </div>
            </div>
          </div>
        </div>
      );
    }

    const hasSummary = Boolean(resume.summary?.text?.trim());
    const hasExperience = Boolean(resume.experience?.jobTitle?.trim() || resume.experience?.employer?.trim());
    const hasEducation = Boolean(resume.education?.degree?.trim() || resume.education?.fieldOfStudy?.trim());
    const hasContact = Boolean(resume.profile?.email?.trim() || resume.profile?.phone?.trim());
    const hasSkills = (resume.skills || []).some(skill => skill?.name?.trim());
    const hasInterests = Boolean(resume.interests?.text?.trim());
    const profession = resume.profile?.profession?.trim();

    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {(fullName || profession) && (
          <div className="border-b pb-4">
            <h3 className="text-2xl font-bold text-gray-900">{fullName || ''}</h3>
            {profession && <p className="text-sm text-primary-600 mt-1">{profession}</p>}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_0.8fr]">
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
                {resume.experience?.jobTitle && <p className="mt-2 font-semibold">{resume.experience.jobTitle}</p>}
                {resume.experience?.employer && <p className="text-sm text-gray-600">{resume.experience.employer}</p>}
              </section>
            )}

            {hasEducation && (
              <section>
                <h4 className="text-sm font-semibold uppercase text-gray-600">Education</h4>
                <p className="mt-2 text-sm text-gray-700">
                  {resume.education?.degree ? resume.education.degree : ''}
                  {resume.education?.degree && resume.education?.fieldOfStudy ? ' in ' : ''}
                  {resume.education?.fieldOfStudy || ''}
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
                  <h4 className="text-sm font-semibold uppercase text-gray-600">Skills</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(resume.skills || []).filter(skill => skill?.name?.trim()).map((skill, idx) => (
                      <span key={idx} className="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-700">{skill.name}</span>
                    ))}
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
    );
  };
  return (
    <div className="space-y-6">
      {view === 'list' && (
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FiDatabase className="w-6 h-6 text-primary-500" />
                  {t('resume.mySavedCVs') || 'My Saved CVs'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {resumes.length === 0 
                    ? (t('resume.noCVsSubtitle') || "You haven't created any CVs yet. Start by creating a new one!")
                    : `${resumes.length} CV${resumes.length !== 1 ? 's' : ''} saved`}
                </p>
              </div>
            </div>

            {/* Resume Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumes.length === 0 ? (
                <div className="col-span-full">
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4">
                      <FiFileText className="w-8 h-8 text-primary-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('resume.noCVsTitle') || 'No CVs Created Yet'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                      {t('resume.noCVsDesc') || 'Create your first CV to get started. You can create multiple CVs tailored to different job applications.'}
                    </p>
                    <button
                      onClick={handleOpenTitleModal}
                      className="btn btn-primary inline-flex items-center gap-2"
                    >
                      <FiPlus className="w-4 h-4" /> {t('resume.createFirstCV') || 'Create Your First CV'}
                    </button>
                  </div>
                </div>
                ) : (
                  resumes.map((resume) => (
                    <div key={resume.id} className="card p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-4">
                {/* Resume Structure Thumbnail */}
                <div className="w-24 h-32 rounded border bg-gray-50 dark:bg-gray-700 flex items-center justify-center shrink-0 relative overflow-hidden shadow-inner">
                  {renderCVStructure(resume.template)}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{resume.title}</h3>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>Score</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{resume.score}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mt-1 overflow-hidden">
                      <div className="bg-primary-500 h-2 rounded-full transition-all duration-700 ease-out" style={{ width: `${resume.score}%` }} />
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2 mt-4">
                    <button 
                      onClick={() => handleEditResume(resume.id)}
                      className="btn btn-outline py-1 px-3 text-xs flex items-center gap-1 border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10"
                    >
                      {t('common.edit') || 'Edit'} <FiEdit2 className="w-3 h-3" />
                    </button>

                    <button 
                      title={t('common.download') || 'Download'} 
                      onClick={() => handleDownloadPDF(resume)}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                    >
                      <FiDownload className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      title={t('common.print') || 'Print'} 
                      onClick={() => handleDownloadPDF(resume)}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                    >
                      <FiPrinter className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      title={t('common.delete') || 'Delete'} 
                      onClick={() => handleDeleteResume(resume.id)}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
                ))
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              onClick={handleOpenTitleModal}
              className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition group"
            >
              <div className="w-12 h-12 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FiPlus className="w-6 h-6 text-primary-500" />
              </div>
              <span className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                {t('resume.createNewCV') || 'Create New CV'} <FiEdit2 className="w-4 h-4 text-gray-400" />
              </span>
              <p className="text-sm text-gray-500 mt-1">{t('resume.startFresh') || 'Start Fresh'}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 flex flex-col items-center justify-center cursor-pointer hover:border-secondary transition group">
              <div className="w-12 h-12 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FiUpload className="w-6 h-6 text-secondary-500" />
              </div>
              <span className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                {t('resume.import') || 'Import'} <FiUpload className="w-4 h-4 text-gray-400" />
              </span>
              <p className="text-sm text-gray-500 mt-1">{t('resume.useCurrentCV') || 'Use Current CV'}</p>
            </div>
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
              <div className="flex gap-2">
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
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-2 dark:border-gray-700">
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

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toast.success('Section addition prompt coming soon')}
                className="flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-all shadow-sm hover:bg-red-600"
              >
                <FiPlusCircle /> Add Section
              </button>
              <button
                type="button"
                onClick={() => toast.success('AI Resume optimization activated')}
                className="flex items-center gap-1.5 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition-all shadow-sm hover:bg-gray-900"
              >
                🧠 Ask AI
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

                            {activeResume.photo?.dataUrl ? (
                              <img src={activeResume.photo.dataUrl} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-3 text-center text-slate-500">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm text-slate-400">
                                  <FiImage className="h-6 w-6" />
                                </div>
                                <p className="text-sm font-semibold text-slate-900">Photo</p>
                              </div>
                            )}

                            <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-slate-400">
                              {activeResume.photo?.dataUrl ? 'Change photo' : ''}
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
                            className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">Middle name</label>
                          <input
                            type="text"
                            value={activeResume.profile?.middleName || ''}
                            onChange={(e) => handleFieldChange('profile', 'middleName', e.target.value)}
                            className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">Last name</label>
                          <input
                            type="text"
                            value={activeResume.profile?.lastName || ''}
                            onChange={(e) => handleFieldChange('profile', 'lastName', e.target.value)}
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
                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-medium text-slate-700">Professional summary</label>
                          <textarea
                            rows="4"
                            value={activeResume.summary?.text || ''}
                            onChange={(e) => handleFieldChange('summary', 'text', e.target.value)}
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
                            onChange={(e) => handleFieldChange('profile', 'phone', e.target.value)}
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
                    💡 Now, let's fill out your work history <span className="font-normal">| Here's what you need to know: Employers scan your resume for six seconds to decide if you're a match. We'll suggest bullet points that make a great impression.</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Job Title</label>
                        <input
                          type="text"
                          value={activeResume.experience?.jobTitle || ''}
                          onChange={(e) => handleFieldChange('experience', 'jobTitle', e.target.value)}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Employer</label>
                        <input
                          type="text"
                          value={activeResume.experience?.employer || ''}
                          onChange={(e) => handleFieldChange('experience', 'employer', e.target.value)}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">City</label>
                        <input
                          type="text"
                          value={activeResume.experience?.city || ''}
                          onChange={(e) => handleFieldChange('experience', 'city', e.target.value)}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">State</label>
                        <input
                          type="text"
                          value={activeResume.experience?.state || ''}
                          onChange={(e) => handleFieldChange('experience', 'state', e.target.value)}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Start Date</label>
                        <input
                          type="date"
                          value={activeResume.experience?.startDate || ''}
                          onChange={(e) => handleFieldChange('experience', 'startDate', e.target.value)}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">End Date</label>
                        <input
                          type="date"
                          disabled={activeResume.experience?.currentWork}
                          value={activeResume.experience?.currentWork ? '' : (activeResume.experience?.endDate || '')}
                          onChange={(e) => handleFieldChange('experience', 'endDate', e.target.value)}
                          className="input disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="currentWork"
                        checked={activeResume.experience?.currentWork || false}
                        onChange={(e) => handleFieldChange('experience', 'currentWork', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="currentWork" className="text-sm text-gray-700 dark:text-gray-300">I currently work here</label>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between border-b bg-gray-50 p-2.5 dark:border-gray-700 dark:bg-gray-800">
                        <button
                          type="button"
                          onClick={() => toast.success('AI generation helper activated')}
                          className="flex items-center gap-1 rounded bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-sm hover:bg-red-600"
                        >
                          🧠 Ask AI for Assistance
                        </button>
                        <div className="text-[10px] text-gray-400">
                          PRO TIP: Ask AI any question about your job duties <span className="ml-1 rounded bg-blue-600 px-1.5 py-0.5 font-extrabold uppercase text-white">Jobs</span>
                        </div>
                      </div>
                      <textarea
                        rows="6"
                        placeholder="Enter Job Responsibilities"
                        value={activeResume.experience?.duties || ''}
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
                    💡 Tell us about your education <span className="font-normal">| Include every school, even if you're still there or didn't graduate.</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">School Name</label>
                    <input
                      type="text"
                      value={activeResume.education?.schoolName || ''}
                      onChange={(e) => handleFieldChange('education', 'schoolName', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">City</label>
                    <input
                      type="text"
                      value={activeResume.education?.city || ''}
                      onChange={(e) => handleFieldChange('education', 'city', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">State</label>
                    <input
                      type="text"
                      value={activeResume.education?.state || ''}
                      onChange={(e) => handleFieldChange('education', 'state', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Select a degree</label>
                    <select
                      value={activeResume.education?.degree || 'Select'}
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
                      value={activeResume.education?.fieldOfStudy || ''}
                      onChange={(e) => handleFieldChange('education', 'fieldOfStudy', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Graduation Start Date</label>
                    <input
                      type="date"
                      value={activeResume.education?.startDate || ''}
                      onChange={(e) => handleFieldChange('education', 'startDate', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Graduation End Date</label>
                    <input
                      type="date"
                      disabled={activeResume.education?.currentStudy}
                      value={activeResume.education?.currentStudy ? '' : (activeResume.education?.endDate || '')}
                      onChange={(e) => handleFieldChange('education', 'endDate', e.target.value)}
                      className="input disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="currentStudy"
                    checked={activeResume.education?.currentStudy || false}
                    onChange={(e) => handleFieldChange('education', 'currentStudy', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="currentStudy" className="text-sm text-gray-700 dark:text-gray-300">I currently study here</label>
                </div>
              </div>
            )}

            {activeTab === 'Projects' && (
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

            {activeTab === 'Interests' && (
              <div className="space-y-6">
                <div className="rounded-xl bg-sky-500 p-4 text-white shadow-sm">
                  <p className="text-sm font-medium">Mention personal interests that can add personality to your resume.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Personal Interests</label>
                  <textarea
                    rows="8"
                    value={activeResume.interests?.text || ''}
                    onChange={(e) => handleFieldChange('interests', 'text', e.target.value)}
                    className="textarea w-full"
                    placeholder="Examples: hiking, reading, public speaking, photography..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'Photo' && (
              <div className="space-y-6">
                <div className="rounded-xl bg-sky-500 p-4 text-white shadow-sm">
                  <p className="text-sm font-medium">Upload a profile photo to include in your resume preview.</p>
                </div>

                <label className="group relative block rounded-xl border border-dashed border-gray-300 p-6 text-center transition hover:border-slate-400 hover:bg-slate-50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="sr-only"
                  />
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm text-slate-400">
                      <FiImage className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">Upload a photo</p>
                    <p className="max-w-[20rem] text-xs leading-5 text-slate-500">Click here to select a profile image that will appear in your resume preview.</p>
                  </div>
                </label>

                {activeResume.photo?.dataUrl && (
                  <div className="mt-4 flex justify-center">
                    <img
                      src={activeResume.photo.dataUrl}
                      alt="Resume preview photo"
                      className="h-32 w-32 rounded-full border-4 border-indigo-100 object-cover"
                    />
                  </div>
                )}
              </div>
            )}

            {!['Profile', 'Experience', 'Education', 'Skills', 'Summary', 'Interests', 'Photo'].includes(activeTab) && (
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
                {saveMessage && <span className="text-sm font-medium text-green-600">{saveMessage}</span>}
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
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
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
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{activeResume.score}%</span>
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-gray-700">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-700 ease-out"
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
                                <TemplateComponent resume={activeResume || {}} color={template.accent} compact />
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
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

      {isPhotoEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-slate-700 bg-slate-900 shadow-2xl">
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
              <div className="flex min-h-[340px] items-center justify-center rounded-[24px] bg-slate-800 p-4">
                {photoEditorSrc ? (
                  <div className="relative h-[320px] w-full overflow-hidden rounded-[24px] bg-slate-900">
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
                    <span>-180°</span>
                    <span>{photoEditorRotate}°</span>
                    <span>180°</span>
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

      {/* Step 3: Choose Template Modal */}
    </div>
  );
};

export default ResumeBuilder;
