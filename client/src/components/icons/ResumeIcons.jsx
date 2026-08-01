import React from 'react';

export const PhoneIcon = ({ className = '', width = 14, height = 14 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M22 16.92a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18A2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.72c.12.97.33 1.92.63 2.82a2 2 0 0 1-.45 2L8.09 9.91a16 16 0 0 0 6 6l1.37-1.37a2 2 0 0 1 2-.45c.9.3 1.85.51 2.82.63A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const MailIcon = ({ className = '', width = 14, height = 14 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="4" y="4" width="16" height="16" rx="0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LocationIcon = ({ className = '', width = 14, height = 14 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="10" r="3" fill="currentColor" />
  </svg>
);

export const GlobeIcon = ({ className = '', width = 14, height = 14 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.2" />
    <path d="M2 12h20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M12 2a15 15 0 0 1 0 20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const DotIcon = ({ className = '', size = 10, color = '#10b981' }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="5" cy="5" r="5" fill={color} />
  </svg>
);

export default {
  PhoneIcon,
  MailIcon,
  LocationIcon,
  GlobeIcon,
  DotIcon,
};
