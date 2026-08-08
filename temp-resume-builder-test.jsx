// ============================================
// Resume Builder Wizard Component
// ============================================
import { useState, useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Link } from 'react-router-dom';
import { 
  FiFileText, FiPlus, FiUpload, FiEdit2, FiDownload, 
  FiPrinter, FiInfo, FiTrash2, FiX, FiSearch, FiSave, FiPlusCircle,
  FiArrowLeft, FiArrowRight, FiTrash, FiMail, FiPhone, FiMapPin, FiCheckCircle, FiTool, FiDatabase, FiCode, FiGlobe, FiBriefcase, FiMoreVertical, FiChevronRight, FiCamera, FiEye
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { PhoneIcon, MailIcon, LocationIcon, GlobeIcon, DotIcon } from '../../../components/icons/ResumeIcons';
import { updateProfile } from '../../../store/slices/authSlice';
import { getTemplateDefinitions, getTemplateComponent, getTemplateDefinition, resolveTemplateId } from '../../../components/resume/templates';
import { getResumeViewModel, RESUME_TEMPLATE_CSS } from '../../../components/resume/templates/templateUtils';
import TemplateGallery from '../../../components/resume/templates/TemplateGallery';

const TEMPLATES = getTemplateDefinitions();

const TemplatePreview = ({ template, resume, color = 'blue' }) => {
  const TemplateComponent = template.component;
  const viewModel = getResumeViewModel(resume);

  return (
    <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50 p-2">
      <div className="overflow-hidden rounded-[14px] bg-white">
        <TemplateComponent resume={viewModel} color={color} compact />
      </div>
    </div>
  );
};

const TABS = ['Profile', 'Experience', 'Education', 'Projects', 'Skills', 'Summary', 'Interests', 'Photo'];

// Predefined suggestion examples for Experience
const DUTY_EXAMPLES = [
  'Manage and archive quality documentation and participate in internal and external quality audits',
  'Resolved conflicts and negotiated agreements between parties in order to reach win-win solutions to disagreements and clarify misunderstandings',
  'Presented metric reporting and [Timeframe] account reviews to [Type] team and clients',
  'Developed, updated and maintained database of existing and potential customers in [Software]'
];

const ResumeBuilder = () => {
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
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [activeMenuResumeId, setActiveMenuResumeId] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const handleDownloadPDF = (resume) => {
    const templateId = resolveTemplateId(resume?.template);
    const definition = getTemplateDefinition(templateId);
    const TemplateComponent = definition?.component || getTemplateComponent(templateId);
    const viewModel = getResumeViewModel(resume);
    const markup = renderToStaticMarkup(<TemplateComponent resume={viewModel} color="blue" />);
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');

    if (!printWindow) {
      toast.error('Please allow popups to download the resume.');
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${resume?.title || 'Resume'} - PDF</title>
          <style>${RESUME_TEMPLATE_CSS}</style>
        </head>
        <body>
          <div class="resume-template-shell">${markup}</div>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };
  const [activeTab, setActiveTab] = useState('Profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [exampleSearch, setExampleSearch] = useState('');
  const [previewTemplateId, setPreviewTemplateId] = useState(null);

  // Load resumes from storage scoped to the current authenticated user.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(resumeStorageKey);
      const legacyStored = localStorage.getItem('ethiojob_resumes');

      if (stored) {
        const parsed = JSON.parse(stored);
        setResumes(Array.isArray(parsed) ? parsed : []);
      } else if (legacyStored) {
        const parsed = JSON.parse(legacyStored);
        const migratedResumes = Array.isArray(parsed) ? parsed : [];
        setResumes(migratedResumes);
        localStorage.setItem(resumeStorageKey, JSON.stringify(migratedResumes));
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
    setResumes(updatedResumes);
    localStorage.setItem(resumeStorageKey, JSON.stringify(updatedResumes));
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
    setIsTitleModalOpen(false);
    setIsTemplateModalOpen(true);
  };

  const handleSelectTemplate = (templateId) => {
    if (activeResume) {
      const updated = resumes.map((resume) =>
        resume.id === activeResume.id ? { ...resume, template: templateId } : resume
      );
      saveToStorage(updated);
      setIsTemplateModalOpen(false);
      setView('editor');
      setActiveTab('Profile');
      toast.success(`Template ${templateId} selected`);
      return;
    }

    const newResume = {
      id: `resume_${Date.now()}`,
      title: newResumeTitle,
      score: 10,
      template: templateId,
      profile: {
        firstName: user?.firstName || '',
        middelName: '',
        lastName: user?.lastName || '',
        gender: 'Select',
        dateOfBirth: '',
        maritalStatus: 'Select',
        profession: user?.profession || user?.jobTitle || '',
        streetAddress: '',
        city: user?.city || '',
        stateProvince: '',
        country: user?.country || 'Ethiopia',
        nationality: user?.country || 'Ethiopia',
        passportNumber: '',
        phone: user?.phone || '',
        email: user?.email || ''
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
        degree: 'Select',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        currentStudy: false
      },
      projects: [{ title: '', description: '' }],
      skills: [{ name: '', level: 'Select' }],
      softSkills: ['', '', ''],
      languages: ['', ''],
      summary: { text: '' },
      interests: { text: '' },
      photo: null
    };

    const updated = [...resumes, newResume];
    saveToStorage(updated);
    
    setActiveResumeId(newResume.id);
    setIsTemplateModalOpen(false);
    setView('editor');
    setActiveTab('Profile');
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

  const toggleMenu = (resumeId) => {
    setActiveMenuResumeId((prev) => (prev === resumeId ? null : resumeId));
  };

  const closeMenu = () => setActiveMenuResumeId(null);

  const getATSStatus = (score = 0) => {
    if (score >= 90) return { label: 'Excellent Match', ringClass: 'border-emerald-400/40', textClass: 'text-emerald-700' };
    if (score >= 75) return { label: 'Good Match', ringClass: 'border-amber-400/40', textClass: 'text-amber-700' };
    return { label: 'Average Match', ringClass: 'border-orange-400/40', textClass: 'text-orange-700' };
  };

  const getFileType = (resume) => resume.fileType || 'PDF';
  const getFileSize = (resume) => resume.fileSize || '245 KB';
  const getUpdatedAt = (resume) => resume.updatedAt || 'May 15, 2024';
  const getRelativeTime = (resume) => resume.relativeTime || '2 days ago';

  const hasResumes = resumes.length > 0;
  const primaryResumeId = resumes.find((r) => r.isPrimary)?.id || resumes[0]?.id || null;
  const totalDownloads = resumes.reduce((sum, resume) => sum + (resume.downloads || 0), 0);
  const applicationsUsed = resumes.reduce((sum, resume) => sum + (resume.applicationsUsed || 0), 0);

  const handleDuplicateResume = (resumeId) => {
    const resume = resumes.find((r) => r.id === resumeId);
    if (!resume) return;

    const copy = {
      ...resume,
      id: `resume_${Date.now()}`,
      title: `${resume.title || 'Resume'} Copy`,
      isPrimary: false,
      downloads: resume.downloads || 0,
      applicationsUsed: resume.applicationsUsed || 0,
    };

    saveToStorage([...resumes, copy]);
    toast.success('Resume duplicated');
  };

  const handleSetPrimaryResume = (resumeId) => {
    const updated = resumes.map((resume) => ({
      ...resume,
      isPrimary: resume.id === resumeId,
    }));
    saveToStorage(updated);
    toast.success('Primary resume updated');
  };

  const handleRenameResume = (resumeId) => {
    const resume = resumes.find((r) => r.id === resumeId);
    if (!resume) return;
    const newName = window.prompt('Enter a new resume name', resume.title || 'Resume');
    if (newName && newName.trim()) {
      const updated = resumes.map((item) =>
        item.id === resumeId ? { ...item, title: newName.trim() } : item
      );
      saveToStorage(updated);
      toast.success('Resume renamed');
    }
  };

  const validateProfile = () => {
    if (!activeResume) return {};

    const profile = activeResume.profile || {};
    const nextErrors = {};
    const requiredFields = [
      ['firstName', profile.firstName],
      ['lastName', profile.lastName],
      ['profession', profile.profession],
      ['phone', profile.phone],
      ['email', profile.email],
      ['city', profile.city],
      ['country', profile.country || profile.nationality],
    ];

    requiredFields.forEach(([field, value]) => {
      if (!String(value || '').trim()) {
        nextErrors[field] = 'This field is required.';
      }
    });

    if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (profile.phone && !/^\+?[0-9\s-]{7,15}$/.test(profile.phone)) {
      nextErrors.phone = 'Please enter a valid phone number.';
    }

    setFormErrors(nextErrors);
    return nextErrors;
  };

  const handleSaveForm = async (e) => {
    if (e) e.preventDefault();
    if (!activeResume) return;

    // Persist current resumes state to localStorage
    saveToStorage(resumes);
    setFormErrors({});
    setSaveMessage('Saved successfully');
    toast.success('Saved successfully');
  };

  const handleSaveAndContinue = () => {
    if (!activeResume) return;

    const errors = validateProfile();
    if (Object.keys(errors).length > 0) {
      toast.error('Please complete the required fields before continuing.');
      return;
    }

    handleSaveForm();
    setActiveTab('Experience');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
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

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPG or PNG image.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Photo size should be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSaveMessage('');
      const updated = resumes.map(r => {
        if (r.id === activeResumeId) {
          return {
            ...r,
            photo: {
              fileName: file.name,
              dataUrl: reader.result
            }
          };
        }
        return r;
      });
      saveToStorage(updated);
      toast.success('Photo uploaded');
    };
    reader.readAsDataURL(file);
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
        return { ...r, skills: [...(r.skills || []), { name: '', level: 'Select' }] };
      }
      return r;
    });
    saveToStorage(updated);
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

  const handleLanguageChange = (index, value) => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        const newLanguages = [...(r.languages || [])];
        newLanguages[index] = value;
        return { ...r, languages: newLanguages };
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

  const handleAddLanguage = () => {
    const updated = resumes.map(r => {
      if (r.id === activeResumeId) {
        return { ...r, languages: [...(r.languages || []), ''] };
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

  const filteredTemplates = TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const renderTemplatePreview = (resume, fullScreen = false) => {
    const templateId = resolveTemplateId(resume?.template);
    const definition = getTemplateDefinition(templateId);
    const TemplateComponent = definition?.component || getTemplateComponent(templateId);
    const viewModel = getResumeViewModel(resume);
    if (fullScreen) {
      return (
        <div className="w-full h-full">
          <TemplateComponent resume={viewModel} color="blue" />
        </div>
      );
    }

    return (
      <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
        <TemplateComponent resume={viewModel} color="blue" />
      </div>
    );
  };
  const editorSteps = [
    {
      key: 'Template',
      label: 'Template',
      completed: Boolean(activeResume?.template),
      action: () => setIsTemplateModalOpen(true),
    },
    {
      key: 'Profile',
      label: 'Profile',
      active: activeTab === 'Profile' && view === 'editor',
      action: () => {
        setActiveTab('Profile');
        setView('editor');
      },
    },
    {
      key: 'Experience',
      label: 'Experience',
      active: activeTab === 'Experience' && view === 'editor',
      action: () => {
        setActiveTab('Experience');
        setView('editor');
      },
    },
    {
      key: 'Education',
      label: 'Education',
      active: activeTab === 'Education' && view === 'editor',
      action: () => {
        setActiveTab('Education');
        setView('editor');
      },
    },
    {
      key: 'Skills',
      label: 'Skills',
      active: activeTab === 'Skills' && view === 'editor',
      action: () => {
        setActiveTab('Skills');
        setView('editor');
      },
    },
    {
      key: 'Summary',
      label: 'Summary',
      active: activeTab === 'Summary' && view === 'editor',
      action: () => {
        setActiveTab('Summary');
        setView('editor');
      },
    },
    {
      key: 'Projects',
      label: 'Projects',
      active: activeTab === 'Projects' && view === 'editor',
      action: () => {
        setActiveTab('Projects');
        setView('editor');
      },
    },
    {
      key: 'Preview',
      label: 'Preview',
      active: view === 'preview',
      action: () => {
        setView('preview');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
  ];

  return (
    <div className="space-y-6">
      {view === 'list' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Banner */}
          {showInfoBanner && (
            <div className="rounded-[20px] border border-sky-200/80 bg-sky-50 px-5 py-4 shadow-sm shadow-sky-100/60 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-10 w-10 rounded-2xl bg-sky-600/10 text-sky-700 flex items-center justify-center shadow-sm">
                  <FiInfo className="h-5 w-5" />
                </div>
                <p className="text-sm leading-6 text-slate-700">
                  <span className="font-semibold">PRO TIP:</span> Customize your resume for each job application to improve ATS matching and stand out to recruiters.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoBanner(false)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Header and stats */}
          <div className="flex flex-col items-start gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">My Saved CVs</h1>
              <p className="mt-2 text-sm text-slate-500 max-w-2xl">Create, manage, and customize your resumes for different job applications.</p>
            </div>
            <button
              type="button"
              onClick={handleOpenTitleModal}
              className="self-end xl:self-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-200/50 transition hover:bg-emerald-700"
            >
              <FiPlus className="h-4 w-4" /> Create Resume
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Total CVs', value: resumes.length, description: 'Active resumes', icon: FiFileText },
              { label: 'Default CV', value: resumes.some((r) => r.isPrimary) ? 1 : 0, description: 'Primary resume', icon: FiCheckCircle },
              { label: 'Downloads', value: totalDownloads, description: 'Total resume downloads', icon: FiDownload },
              { label: 'Applications Used', value: applicationsUsed, description: 'Application submissions', icon: FiBriefcase },
            ].map((card, idx) => (
              <div key={idx} className="group rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm">
                  <card.icon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-3xl font-semibold text-slate-900">{card.value}</p>
                <p className="mt-2 text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-1 text-xs text-slate-400">{card.description}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Your Resume Library</h2>
                <p className="mt-1 text-sm text-slate-500">Keep all resume versions organized with quick access to preview, edit, and actions.</p>
              </div>
            </div>

            {hasResumes ? (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead>
                    <tr className="text-slate-500">
                      <th className="whitespace-nowrap px-4 py-4 font-medium">Resume Name</th>
                      <th className="whitespace-nowrap px-4 py-4 font-medium">Last Updated</th>
                      <th className="whitespace-nowrap px-4 py-4 font-medium">ATS Score</th>
                      <th className="whitespace-nowrap px-4 py-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resumes.map((resume) => {
                      const status = getATSStatus(resume.score);
                      const isPrimary = resume.id === primaryResumeId;
                      return (
                        <tr key={resume.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-5">
                            <div className="flex items-start gap-4">
                              <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 shadow-sm">
                                <FiFileText className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="truncate text-base font-semibold text-slate-900">{resume.title || 'Untitled Resume'}</h3>
                                  {isPrimary && (
                                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">Primary</span>
                                  )}
                                </div>
                                <p className="mt-2 text-sm text-slate-500">Tailored for {resume.template?.replace('_', ' ') || 'professional'} positions</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-5 text-slate-600">
                            <div className="font-medium text-slate-900">{getUpdatedAt(resume)}</div>
                            <div className="mt-1 text-sm">{getRelativeTime(resume)}</div>
                          </td>
                          <td className="px-4 py-5">
                            <div className="flex items-center gap-4">
                              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                                <div className="absolute inset-0 rounded-full bg-slate-100"></div>
                                <div
                                  className={`absolute inset-0 rounded-full border-[10px] ${status.ringClass}`}
                                  style={{ clipPath: 'circle(50% at 50% 50%)' }}
                                />
                                <span className={`relative text-sm font-semibold ${status.textClass}`}>{resume.score || 0}%</span>
                              </div>
                              <div>
                                <div className={`text-sm font-semibold ${status.textClass}`}>{status.label}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-5">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => toast.success('Preview opened')}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
                              >
                                Preview
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditResume(resume.id)}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadPDF(resume)}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
                              >
                                Download
                              </button>
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => toggleMenu(resume.id)}
                                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100"
                                >
                                  <FiMoreVertical className="h-5 w-5" />
                                </button>
                                {activeMenuResumeId === resume.id && (
                                  <div className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleDuplicateResume(resume.id);
                                        closeMenu();
                                      }}
                                      className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                      Duplicate
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleRenameResume(resume.id);
                                        closeMenu();
                                      }}
                                      className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                      Rename
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleSetPrimaryResume(resume.id);
                                        closeMenu();
                                      }}
                                      className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                      Set as Primary
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleDeleteResume(resume.id);
                                        closeMenu();
                                      }}
                                      className="w-full px-4 py-3 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-12 text-center shadow-sm">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700 shadow-sm">
                  <FiFileText className="h-8 w-8" />
                </div>
                <div className="mt-6 space-y-3">
                  <h3 className="text-2xl font-semibold text-slate-900">No resumes yet</h3>
                  <p className="mx-auto max-w-xl text-sm text-slate-500">Create your first resume and keep all versions organized in one place.</p>
                </div>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleOpenTitleModal}
                    className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                  >
                    Create Resume
                  </button>
                  <button
                    type="button"
                    onClick={() => toast('Import feature coming soon')}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50 transition"
                  >
                    Import Resume
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[20px] border border-slate-200 bg-emerald-50/50 px-5 py-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="mt-1 text-xl">💡</span>
                <div>
                  <p className="font-semibold text-slate-900">Tip</p>
                  <p className="text-sm text-slate-600">Customize every resume for each application to improve ATS matching and increase interview chances.</p>
                </div>
              </div>
              <button type="button" className="text-sm font-semibold text-emerald-700 hover:underline">Learn More</button>
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
              {renderTemplatePreview(activeResume)}
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
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-[28px] w-full max-w-6xl shadow-2xl overflow-hidden my-8 animate-slide-down border border-slate-200">
            <div className="relative border-b border-slate-200 bg-slate-50 px-6 py-7 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.32em] text-emerald-600">Resume Builder</p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-900">Choose a CV template</h2>
                  <p className="mt-2 text-sm text-slate-600">ATS-friendly layouts with polished typography and premium presentation.</p>
                </div>
                <button
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-700"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="border-b border-slate-200 bg-white px-6 py-5 sm:px-8">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                  Free
                </span>
                <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">
                  Premium
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <TemplateGallery
                selectedTemplateId={resolveTemplateId(activeResume?.template)}
                onSelectTemplate={handleSelectTemplate}
                onPreviewTemplate={(templateId) => setPreviewTemplateId(templateId)}
                resume={activeResume ? getResumeViewModel(activeResume) : getResumeViewModel({})}
              />

              {previewTemplateId && (
                <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm">
                  <div className="absolute inset-0 flex flex-col bg-white resume-modal-full">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Full Screen Resume Preview</h3>
                        <p className="text-sm text-slate-500">Previewing the selected template at full width for a polished, printable layout.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewTemplateId(null)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 mr-4"
                      >
                        Close
                      </button>
                    </div>

                    <div className="flex-1 w-full h-full overflow-auto bg-slate-100">
                      <div className="w-full h-full">
                        {renderTemplatePreview({ ...(activeResume || {}), template: previewTemplateId }, true)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeBuilder;
