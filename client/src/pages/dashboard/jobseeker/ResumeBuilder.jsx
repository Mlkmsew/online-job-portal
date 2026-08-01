// ============================================
// Resume Builder Wizard Component
// ============================================
import { useState, useEffect } from 'react';
import { 
  FiFileText, FiPlus, FiUpload, FiEdit2, FiDownload, 
  FiPrinter, FiInfo, FiTrash2, FiX, FiSearch, FiSave, FiPlusCircle,
  FiArrowLeft, FiArrowRight, FiTrash, FiMail, FiPhone, FiMapPin, FiCheckCircle, FiTool, FiDatabase, FiCode, FiGlobe
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { PhoneIcon, MailIcon, LocationIcon, GlobeIcon, DotIcon } from '../../../components/icons/ResumeIcons';
import { updateProfile } from '../../../store/slices/authSlice';

// Static Resume Templates Definition
const TEMPLATES = [
  {
    id: 'general_ats',
    name: 'GENERAL ATS',
    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'fresh_man',
    name: 'FRESH MAN',
    image: 'https://images.unsplash.com/photo-1626379616459-b2ce1d9decbc?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'graphic',
    name: 'GRAPHIC',
    image: 'https://images.unsplash.com/photo-1590608897129-79da98d15969?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'james_mark',
    name: 'JAMES MARK',
    image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'mark_brown',
    name: 'MARK BROWN',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'professional',
    name: 'PROFESSIONAL',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=300&auto=format&fit=crop',
  }
];

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

  const handleDownloadPDF = (resume) => {
    const printWindow = window.open('', '_blank');
    const technicalSkills = (resume.skills || []).map(s => `<li>${s.name || ''}${s.level ? ` — ${s.level}` : ''}</li>`).join('');
    const softSkills = (resume.softSkills || []).filter(Boolean).map(skill => `<li>${skill}</li>`).join('');
    const languages = (resume.languages || []).filter(Boolean).map(lang => `<li>${lang}</li>`).join('');
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
                <h2>${resume.profile?.firstName || ''} ${resume.profile?.middelName || ''} ${resume.profile?.lastName || ''}</h2>
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
                <h1 class="topbar-title">${resume.profile?.firstName || ''} ${resume.profile?.middelName || ''} ${resume.profile?.lastName || ''}</h1>
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
  const [activeTab, setActiveTab] = useState('Profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [exampleSearch, setExampleSearch] = useState('');

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
        firstName: '',
        middelName: '',
        lastName: '',
        gender: 'Select',
        dateOfBirth: '',
        maritalStatus: 'Select',
        profession: '',
        streetAddress: '',
        city: '',
        stateProvince: '',
        nationality: '',
        passportNumber: '',
        phone: '',
        email: ''
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

  const handleSaveForm = async (e) => {
    if (e) e.preventDefault();
    if (!activeResume) return;

    // Persist current resumes state to localStorage
    saveToStorage(resumes);
    setSaveMessage('Saved successfully');
    toast.success('Saved successfully');
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

  const renderTemplatePreview = (resume) => {
    const templateId = resume?.template || 'general_ats';
    const fullName = `${resume.profile?.firstName || ''} ${resume.profile?.middelName || ''} ${resume.profile?.lastName || ''}`.trim() || 'Your Name';

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
                    <h4 className="text-lg font-bold">{resume.profile?.firstName || ''} {resume.profile?.middelName || ''} {resume.profile?.lastName || ''}</h4>
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

    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="border-b pb-4">
          <h3 className="text-2xl font-bold text-gray-900">{fullName}</h3>
          <p className="text-sm text-primary-600 mt-1">{resume.profile?.profession || 'Your Profession'}</p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_0.8fr]">
          <div className="space-y-4">
            <section>
              <h4 className="text-sm font-semibold uppercase text-gray-600">Summary</h4>
              <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{resume.summary?.text || 'Add a professional summary.'}</p>
            </section>
            <section>
              <h4 className="text-sm font-semibold uppercase text-gray-600">Experience</h4>
              <p className="mt-2 font-semibold">{resume.experience?.jobTitle || 'Job Title'}</p>
              <p className="text-sm text-gray-600">{resume.experience?.employer || 'Employer'}</p>
            </section>
            <section>
              <h4 className="text-sm font-semibold uppercase text-gray-600">Education</h4>
              <p className="mt-2 text-sm text-gray-700">{resume.education?.degree || 'Degree'} in {resume.education?.fieldOfStudy || 'Field of Study'}</p>
            </section>
          </div>
          <div className="space-y-4 rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-700"><span className="font-semibold">Email:</span> {resume.profile?.email || 'N/A'}</p>
            <p className="text-sm text-gray-700"><span className="font-semibold">Phone:</span> {resume.profile?.phone || 'N/A'}</p>
            <section>
              <h4 className="text-sm font-semibold uppercase text-gray-600">Skills</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {(resume.skills || []).filter(Boolean).map((skill, idx) => (
                  <span key={idx} className="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-700">{skill.name || 'Skill'}</span>
                ))}
              </div>
            </section>
            <section>
              <h4 className="text-sm font-semibold uppercase text-gray-600">Interests</h4>
              <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{resume.interests?.text || 'No interests added yet.'}</p>
            </section>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="space-y-6">
      {view === 'list' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Banner */}
          <div className="bg-sky-500 text-white rounded-xl p-5 shadow-sm relative overflow-hidden flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold flex items-center gap-2">
                💡 PRO TIP: <span className="font-normal">It's important to <span className="font-semibold underline">create a custom resume</span> tailored to each job application to increase your chances of success!</span>
              </p>
            </div>
            <button className="bg-white/20 hover:bg-white/30 text-white font-medium text-xs py-1.5 px-3 rounded-full transition-all shrink-0 ml-4">
              Crafts
            </button>
          </div>

          {/* My Saved CVs Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FiDatabase className="w-6 h-6 text-primary-500" />
                  My Saved CVs
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {resumes.length === 0 
                    ? 'You haven\'t created any CVs yet. Start by creating a new one!'
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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No CVs Created Yet</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                      Create your first CV to get started. You can create multiple CVs tailored to different job applications.
                    </p>
                    <button
                      onClick={handleOpenTitleModal}
                      className="btn btn-primary inline-flex items-center gap-2"
                    >
                      <FiPlus className="w-4 h-4" /> Create Your First CV
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
                      <div className="bg-primary-500 h-2 rounded-full transition-all duration-300" style={{ width: `${resume.score}%` }} />
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2 mt-4">
                    <button 
                      onClick={() => handleEditResume(resume.id)}
                      className="btn btn-outline py-1 px-3 text-xs flex items-center gap-1 border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10"
                    >
                      Edit <FiEdit2 className="w-3 h-3" />
                    </button>

                    <button 
                      title="Download" 
                      onClick={() => handleDownloadPDF(resume)}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                    >
                      <FiDownload className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      title="Print" 
                      onClick={() => handleDownloadPDF(resume)}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                    >
                      <FiPrinter className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      title="Delete" 
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
                Create New CV <FiEdit2 className="w-4 h-4 text-gray-400" />
              </span>
              <p className="text-sm text-gray-500 mt-1">Start Fresh</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 flex flex-col items-center justify-center cursor-pointer hover:border-secondary transition group">
              <div className="w-12 h-12 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FiUpload className="w-6 h-6 text-secondary-500" />
              </div>
              <span className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                Import <FiUpload className="w-4 h-4 text-gray-400" />
              </span>
              <p className="text-sm text-gray-500 mt-1">Use Current CV</p>
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

      {/* Resume Form Editor */}
      {view === 'editor' && activeResume && (
        <div className="space-y-6 animate-slide-up">
          {/* Tabbed Menu Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b dark:border-gray-700 pb-2">
            <div className="flex flex-wrap gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    activeTab === tab 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Extra Section buttons */}
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => toast.success('Section addition prompt coming soon')}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <FiPlusCircle /> Add Section
              </button>
              <button 
                type="button"
                onClick={() => toast.success('AI Resume optimization activated')}
                className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                🧠 Ask AI
              </button>
            </div>
          </div>

          {/* Form Content card */}
          <div className="card p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            
            {/* PROFILE TAB */}
            {activeTab === 'Profile' && (
              <div className="space-y-6">
                <div className="bg-sky-500 text-white rounded-xl p-4 shadow-sm">
                  <p className="text-sm font-medium flex items-center gap-2">
                    💡 What's the best way for Employers to contact you? <span className="font-normal">We suggest including an email and phone number.</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">First Name</label>
                    <input 
                      type="text" 
                      value={activeResume.profile?.firstName || ''}
                      onChange={(e) => handleFieldChange('profile', 'firstName', e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Middel Name (Optional)</label>
                    <input 
                      type="text" 
                      value={activeResume.profile?.middelName || ''}
                      onChange={(e) => handleFieldChange('profile', 'middelName', e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Last Name</label>
                    <input 
                      type="text" 
                      value={activeResume.profile?.lastName || ''}
                      onChange={(e) => handleFieldChange('profile', 'lastName', e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Gender (Optional)</label>
                    <select
                      value={activeResume.profile?.gender || 'Select'}
                      onChange={(e) => handleFieldChange('profile', 'gender', e.target.value)}
                      className="select"
                    >
                      <option value="Select">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Date of Birth (Optional)</label>
                    <input 
                      type="date" 
                      value={activeResume.profile?.dateOfBirth || ''}
                      onChange={(e) => handleFieldChange('profile', 'dateOfBirth', e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Marital Status (Optional)</label>
                    <select
                      value={activeResume.profile?.maritalStatus || 'Select'}
                      onChange={(e) => handleFieldChange('profile', 'maritalStatus', e.target.value)}
                      className="select"
                    >
                      <option value="Select">Select</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Profession</label>
                    <input 
                      type="text" 
                      placeholder="eg. Sr. Accountant"
                      value={activeResume.profile?.profession || ''}
                      onChange={(e) => handleFieldChange('profile', 'profession', e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Street Address</label>
                    <input 
                      type="text" 
                      value={activeResume.profile?.streetAddress || ''}
                      onChange={(e) => handleFieldChange('profile', 'streetAddress', e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">City</label>
                    <input 
                      type="text" 
                      value={activeResume.profile?.city || ''}
                      onChange={(e) => handleFieldChange('profile', 'city', e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">State/Province</label>
                    <input 
                      type="text" 
                      value={activeResume.profile?.stateProvince || ''}
                      onChange={(e) => handleFieldChange('profile', 'stateProvince', e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Nationality (Optional)</label>
                    <select
                      value={activeResume.profile?.nationality || ''}
                      onChange={(e) => handleFieldChange('profile', 'nationality', e.target.value)}
                      className="select"
                    >
                      <option value="">Select Country</option>
                      <option value="Ethiopia">Ethiopia</option>
                      <option value="Kenya">Kenya</option>
                      <option value="Sudan">Sudan</option>
                      <option value="Eritrea">Eritrea</option>
                      <option value="Somalia">Somalia</option>
                      <option value="United States">United States</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Passport number (Optional)</label>
                    <input 
                      type="text" 
                      value={activeResume.profile?.passportNumber || ''}
                      onChange={(e) => handleFieldChange('profile', 'passportNumber', e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Phone</label>
                    <input 
                      type="tel" 
                      value={activeResume.profile?.phone || ''}
                      onChange={(e) => handleFieldChange('profile', 'phone', e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Email</label>
                    <input 
                      type="email" 
                      value={activeResume.profile?.email || ''}
                      onChange={(e) => handleFieldChange('profile', 'email', e.target.value)}
                      className="input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* EXPERIENCE TAB (Screenshot 2) */}
            {activeTab === 'Experience' && (
              <div className="space-y-6">
                <div className="bg-sky-500 text-white rounded-xl p-4 shadow-sm">
                  <p className="text-sm font-medium flex items-center gap-2">
                    💡 Now, let's fill out your work history <span className="font-normal">| Here's what you need to know: Employers scan your resume for six seconds to decide if you're a match. We'll suggest bullet points that make a great impression.</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Form */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <label htmlFor="currentWork" className="text-sm text-gray-700 dark:text-gray-300">I currently work here</label>
                    </div>

                    {/* Duties Text Editor Mockup */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 dark:bg-gray-800 p-2.5 border-b dark:border-gray-700 flex items-center justify-between">
                        <button 
                          type="button"
                          onClick={() => toast.success('AI generation helper activated')}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 px-3 rounded flex items-center gap-1 shadow-sm"
                        >
                          🧠 Ask AI for Assistance
                        </button>
                        <div className="text-[10px] text-gray-400">
                          PRO TIP: Ask AI any question about your job duties <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded font-extrabold uppercase ml-1">Jobs</span>
                        </div>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-900 px-3 py-1 flex items-center gap-3 border-b dark:border-gray-700 text-xs text-gray-600 font-bold">
                        <span>B</span> <span>I</span> <span>U</span> <span className="text-gray-300">|</span> <span>List</span> <span>Align</span>
                      </div>
                      <textarea
                        rows="6"
                        placeholder="Enter Job Responsibilities"
                        value={activeResume.experience?.duties || ''}
                        onChange={(e) => handleFieldChange('experience', 'duties', e.target.value)}
                        className="w-full p-4 text-sm focus:outline-none dark:bg-gray-800 border-none resize-none"
                      />
                    </div>
                  </div>

                  {/* Right Suggestions Examples Panel */}
                  <div className="border dark:border-gray-700 rounded-xl overflow-hidden bg-indigo-50/30 dark:bg-gray-900/40 p-4 flex flex-col h-[400px]">
                    <h3 className="font-bold text-base text-indigo-900 dark:text-indigo-400 mb-2">Showing examples for:</h3>
                    <input 
                      type="text" 
                      placeholder="Ex: Cashier.."
                      value={exampleSearch}
                      onChange={(e) => setExampleSearch(e.target.value)}
                      className="input mb-4 text-sm bg-white dark:bg-gray-800"
                    />

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {DUTY_EXAMPLES.map((ex, idx) => (
                        <div key={idx} className="p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg flex items-start gap-2 shadow-sm">
                          <button
                            type="button"
                            onClick={() => handleAddDutyExample(ex)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5"
                          >
                            <FiPlus className="w-3.5 h-3.5" />
                          </button>
                          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{ex}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EDUCATION TAB (Screenshot 3) */}
            {activeTab === 'Education' && (
              <div className="space-y-6">
                <div className="bg-sky-500 text-white rounded-xl p-4 shadow-sm">
                  <p className="text-sm font-medium flex items-center gap-2">
                    💡 Tell us about your education <span className="font-normal">| Include every school, even if you're still there or didn't graduate.</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <label htmlFor="currentStudy" className="text-sm text-gray-700 dark:text-gray-300">I currently study here</label>
                </div>
              </div>
            )}

            {/* PROJECTS TAB */}
            {activeTab === 'Projects' && (
              <div className="space-y-6">
                <div className="bg-sky-500 text-white rounded-xl p-4 shadow-sm">
                  <p className="text-sm font-medium flex items-center gap-2">
                    💡 Add your key projects <span className="font-normal">| Describe what you built and the impact of each project in concise bullet form.</span>
                  </p>
                </div>

                <div className="space-y-4">
                  {(activeResume.projects || []).map((project, idx) => (
                    <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <FiTrash className="w-4 h-4" /> Remove project
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddProject}
                    className="text-indigo-600 dark:text-indigo-400 text-sm font-bold flex items-center gap-1.5 hover:underline py-2"
                  >
                    <FiPlusCircle /> Add Another Project
                  </button>
                </div>
              </div>
            )}

            {/* SKILLS TAB (Screenshot 4) */}
            {activeTab === 'Skills' && (
              <div className="space-y-6">
                <div className="bg-sky-500 text-white rounded-xl p-4 shadow-sm">
                  <p className="text-sm font-medium flex items-center gap-2">
                    💡 Next, let's take care of your skills <span className="font-normal">| Here's what you need to know: Employers scan skills for relevant keywords. Enter 4-6 skills that are most relevant to your desired job.</span>
                  </p>
                </div>

                <div className="space-y-4">
                  {(activeResume.skills || []).map((skill, index) => (
                    <div key={index} className="flex items-center gap-3 animate-fade-in">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold mb-1 text-gray-500">Technical Skill</label>
                        <input 
                          type="text" 
                          value={skill.name}
                          onChange={(e) => handleSkillChange(index, 'name', e.target.value)}
                          className="input"
                          placeholder="e.g. React, Node.js, SQL"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(index)}
                        className="bg-red-50 hover:bg-red-100 text-red-500 p-2.5 rounded-lg border border-red-200 mt-5 self-end transition"
                        title="Remove Skill"
                      >
                        <FiTrash className="w-5 h-5" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="text-indigo-600 dark:text-indigo-400 text-sm font-bold flex items-center gap-1.5 hover:underline py-2"
                  >
                    <FiPlusCircle /> Add Technical Skill
                  </button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-900">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold uppercase tracking-[0.15em] text-gray-700 dark:text-gray-200">Soft Skills</h4>
                      <button
                        type="button"
                        onClick={handleAddSoftSkill}
                        className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(activeResume.softSkills || []).map((skill, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <input
                            type="text"
                            value={skill}
                            onChange={(e) => handleSoftSkillChange(index, e.target.value)}
                            className="input"
                            placeholder="e.g. Problem solving"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSoftSkill(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <FiTrash className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-900">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold uppercase tracking-[0.15em] text-gray-700 dark:text-gray-200">Languages</h4>
                      <button
                        type="button"
                        onClick={handleAddLanguage}
                        className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(activeResume.languages || []).map((language, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <input
                            type="text"
                            value={language}
                            onChange={(e) => handleLanguageChange(index, e.target.value)}
                            className="input"
                            placeholder="e.g. English — Fluent"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveLanguage(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <FiTrash className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUMMARY TAB */}
            {activeTab === 'Summary' && (
              <div className="space-y-6">
                <div className="bg-sky-500 text-white rounded-xl p-4 shadow-sm">
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

            {/* INTERESTS TAB */}
            {activeTab === 'Interests' && (
              <div className="space-y-6">
                <div className="bg-sky-500 text-white rounded-xl p-4 shadow-sm">
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

            {/* PHOTO TAB */}
            {activeTab === 'Photo' && (
              <div className="space-y-6">
                <div className="bg-sky-500 text-white rounded-xl p-4 shadow-sm">
                  <p className="text-sm font-medium">Upload a profile photo to include in your resume preview.</p>
                </div>

                <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {activeResume.photo?.dataUrl && (
                    <div className="mt-4 flex justify-center">
                      <img
                        src={activeResume.photo.dataUrl}
                        alt="Resume preview photo"
                        className="h-32 w-32 rounded-full object-cover border-4 border-indigo-100"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {!['Profile', 'Experience', 'Education', 'Skills', 'Summary', 'Interests', 'Photo'].includes(activeTab) && (
              <div className="text-center py-10">
                <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <h3 className="font-semibold text-lg">{activeTab} Section Editor</h3>
                <p className="text-gray-500 text-sm mt-1">Fill out your {activeTab.toLowerCase()} entries here. These will render in your template.</p>
              </div>
            )}

            {/* Form Actions Footer Navigation (Previous, Save, Next) */}
            <div className="flex justify-between items-center pt-6 border-t dark:border-gray-700 mt-8">
              <button 
                type="button" 
                onClick={handlePrevTab}
                disabled={activeTab === 'Profile'}
                className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <FiArrowLeft /> Previous
              </button>
              
              <div className="flex items-center gap-3">
                {saveMessage && (
                  <span className="text-sm text-green-600 font-medium">{saveMessage}</span>
                )}
                <button 
                  type="button"
                  onClick={handleSaveForm}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-6 rounded-lg flex items-center gap-1.5 transition shadow"
                >
                  <FiSave /> Save
                </button>
              </div>

              <button 
                type="button" 
                onClick={handleNextTab}
                className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
              >
                {activeTab === TABS[TABS.length - 1] ? 'Finish' : 'Next'} <FiArrowRight />
              </button>
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden my-8 animate-slide-down">
            <div className="p-6 border-b dark:border-gray-700 relative text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Choose a Resume Template</h2>
              <p className="text-sm text-gray-500 mt-1">This Template will be use for your personal resume.</p>
              <button 
                onClick={() => setIsTemplateModalOpen(false)}
                className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4 border-b dark:border-gray-700">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-full transition text-sm shadow">
                  Free Template
                </button>
                
                <div className="relative w-full sm:w-72">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10 pr-4 py-2 w-full text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[50vh] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className={`group relative rounded-xl border overflow-hidden bg-white dark:bg-gray-900 shadow-sm flex flex-col items-center cursor-pointer transition ${activeResume?.template === tpl.id ? 'border-indigo-400 ring-2 ring-indigo-200 dark:ring-indigo-800' : 'border-gray-200 dark:border-gray-700'}`}
                  onClick={() => handleSelectTemplate(tpl.id)}
                >
                  <div className="w-full h-64 overflow-hidden relative bg-gray-100">
                    <img 
                      src={tpl.image} 
                      alt={tpl.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="bg-green-500 text-white font-bold py-2.5 px-6 rounded transition shadow-lg text-sm">
                        SELECT
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-3 text-center w-full bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700">
                    <span className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider">{tpl.name}</span>
                  </div>
                </div>
              ))}

              {filteredTemplates.length === 0 && (
                <div className="col-span-full text-center py-10 text-gray-500">
                  No templates match your search.
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
