import modernAtsThumb from './thumbnails/modern-ats.svg';
import professionalThumb from './thumbnails/professional.svg';
import minimalThumb from './thumbnails/minimal.svg';
import classicThumb from './thumbnails/classic.svg';
import executiveThumb from './thumbnails/executive.svg';
import creativeThumb from './thumbnails/creative.svg';

import { ModernATS } from './ModernATS';
import { Professional } from './Professional';
import { Minimal } from './Minimal';
import { Classic } from './Classic';
import { Executive } from './Executive';
import { Creative } from './Creative';
import { Chrono } from './Chrono';
import { Elegant } from './Elegant';
import { Circular } from './Circular';
import { Luxe } from './Luxe';
import { Casual } from './Casual';
import { Horizontal } from './Horizontal';

export const TEMPLATE_DEFINITIONS = [
  {
    id: 'modern-ats',
    name: 'Modern ATS',
    description: 'A clean, ATS-friendly layout designed for fast scanning and strong readability.',
    badge: 'Free',
    formats: ['PDF'],
    atsReady: true,
    thumbnail: modernAtsThumb,
    component: ModernATS,
    accent: 'blue',
    category: 'ats',
    style: 'modern',
    atsScore: 97,
    columns: '2-column',
    bestFor: 'Corporate roles',
    popularity: 5,
    createdAt: '2024-01-10'
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Balanced structure with a polished corporate presence for industry roles.',
    badge: 'Free',
    formats: ['PDF'],
    atsReady: true,
    thumbnail: professionalThumb,
    component: Professional,
    accent: 'blue',
    category: 'professional',
    style: 'professional',
    atsScore: 95,
    columns: '2-column',
    bestFor: 'Mid-level professionals',
    popularity: 4,
    createdAt: '2024-02-12'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'A refined layout with generous whitespace and a calm editorial tone.',
    badge: 'Free',
    formats: ['PDF'],
    atsReady: true,
    thumbnail: minimalThumb,
    component: Minimal,
    accent: 'black',
    category: 'minimal',
    style: 'minimal',
    atsScore: 93,
    columns: '1-column',
    bestFor: 'Design and creative roles',
    popularity: 3,
    createdAt: '2024-03-05'
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'A traditional resume format with formal hierarchy and timeless appeal.',
    badge: 'Free',
    formats: ['PDF'],
    atsReady: true,
    thumbnail: classicThumb,
    component: Classic,
    accent: 'blue',
    category: 'professional',
    style: 'classic',
    atsScore: 90,
    columns: '2-column',
    bestFor: 'Academic and finance',
    popularity: 2,
    createdAt: '2023-11-20'
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'An elegant, leadership-oriented format with premium typography and presence.',
    badge: 'Premium',
    formats: ['PDF'],
    atsReady: true,
    thumbnail: executiveThumb,
    component: Executive,
    accent: 'purple',
    category: 'executive',
    style: 'executive',
    atsScore: 98,
    columns: '2-column',
    bestFor: 'Leadership and C-suite',
    popularity: 5,
    createdAt: '2024-05-18'
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'A vivid, modern layout for design, marketing, and product-focused professionals.',
    badge: 'Premium',
    formats: ['PDF'],
    atsReady: false,
    thumbnail: creativeThumb,
    component: Creative,
    accent: 'blue',
    category: 'creative',
    style: 'creative',
    atsScore: 86,
    columns: '1-column',
    bestFor: 'Creative and marketing',
    popularity: 4,
    createdAt: '2024-04-08'
  }
];

// add missing templates to reach parity with gallery
TEMPLATE_DEFINITIONS.push(
  {
    id: 'chrono',
    name: 'Chrono',
    description: 'A timeline-focused layout for chronological CVs.',
    badge: 'Free',
    formats: ['PDF'],
    atsReady: false,
    thumbnail: professionalThumb,
    component: Chrono,
    accent: 'blue',
    category: 'chronological',
    style: 'chrono',
    atsScore: 85,
    columns: '2-column',
    bestFor: 'All levels',
    popularity: 3,
    createdAt: '2024-06-01'
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'A refined, sidebar-accented layout with premium feel.',
    badge: 'Premium',
    formats: ['PDF'],
    atsReady: false,
    thumbnail: executiveThumb,
    component: Elegant,
    accent: 'purple',
    category: 'executive',
    style: 'elegant',
    atsScore: 88,
    columns: '2-column',
    bestFor: 'Leadership',
    popularity: 4,
    createdAt: '2024-06-02'
  },
  {
    id: 'circular',
    name: 'Circular',
    description: 'Photo-forward layout with circular avatar and modern typography.',
    badge: 'Free',
    formats: ['PDF'],
    atsReady: false,
    thumbnail: creativeThumb,
    component: Circular,
    accent: 'blue',
    category: 'creative',
    style: 'circular',
    atsScore: 80,
    columns: '2-column',
    bestFor: 'Creative roles',
    popularity: 2,
    createdAt: '2024-06-03'
  },
  {
    id: 'luxe',
    name: 'Luxe',
    description: 'Minimal yet luxurious layout with ample whitespace and refined details.',
    badge: 'Premium',
    formats: ['PDF'],
    atsReady: false,
    thumbnail: executiveThumb,
    component: Luxe,
    accent: 'indigo',
    category: 'premium',
    style: 'luxe',
    atsScore: 89,
    columns: '1-column',
    bestFor: 'Senior professionals',
    popularity: 4,
    createdAt: '2024-06-04'
  },
  {
    id: 'casual',
    name: 'Casual',
    description: 'A relaxed, modern layout with a friendly sidebar accent.',
    badge: 'Free',
    formats: ['PDF'],
    atsReady: false,
    thumbnail: minimalThumb,
    component: Casual,
    accent: 'blue',
    category: 'casual',
    style: 'casual',
    atsScore: 78,
    columns: '2-column',
    bestFor: 'Early career',
    popularity: 3,
    createdAt: '2024-06-05'
  },
  {
    id: 'horizontal',
    name: 'Horizontal',
    description: 'Header-first layout with strong top branding and clear sections.',
    badge: 'Free',
    formats: ['PDF'],
    atsReady: false,
    thumbnail: modernAtsThumb,
    component: Horizontal,
    accent: 'blue',
    category: 'modern',
    style: 'horizontal',
    atsScore: 82,
    columns: '1-column',
    bestFor: 'All levels',
    popularity: 3,
    createdAt: '2024-06-06'
  }
);

export const getTemplateDefinitions = () => TEMPLATE_DEFINITIONS;

export const resolveTemplateId = (templateId = '') => {
  if (!templateId) return 'modern-ats';
  const normalized = templateId.toLowerCase().replace(/_/g, '-');
  const match = TEMPLATE_DEFINITIONS.find((template) => template.id === normalized);
  if (match) return match.id;
  if (normalized === 'general-ats' || normalized === 'modern-ats') return 'modern-ats';
  if (normalized === 'graphic') return 'creative';
  if (normalized === 'fresh-man') return 'professional';
  return 'modern-ats';
};

export const getTemplateDefinition = (templateId) => {
  const resolved = resolveTemplateId(templateId);
  return TEMPLATE_DEFINITIONS.find((template) => template.id === resolved);
};

export const getTemplateComponent = (templateId) => {
  const definition = getTemplateDefinition(templateId);
  return definition?.component || ModernATS;
};
