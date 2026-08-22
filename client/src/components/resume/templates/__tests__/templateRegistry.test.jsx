import { describe, it, expect } from 'vitest';
import { getTemplateDefinitions, resolveTemplateId } from '../config';

describe('resume template registry', () => {
  it('exposes the required production-ready templates', () => {
    const templates = getTemplateDefinitions();

    expect(templates.map((template) => template.id)).toEqual([
      'modern-ats',
      'professional',
      'minimal',
      'classic',
      'executive',
      'creative',
      'chrono',
      'elegant',
      'circular',
      'luxe',
      'casual',
      'horizontal'
    ]);
  });

  it('normalizes legacy template ids', () => {
    expect(resolveTemplateId('modern_ats')).toBe('modern-ats');
    expect(resolveTemplateId('general_ats')).toBe('modern-ats');
    expect(resolveTemplateId('graphic')).toBe('creative');
  });
});
