import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupStore } from '../store/store';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockGet = vi.fn();

vi.mock('../services/api', () => ({
  default: {
    get: (...args) => mockGet(...args),
  },
}));

vi.mock('../services/jobSearchService', () => ({
  getSavedSearches: vi.fn(() => Promise.resolve({ data: { data: [] } })),
  createSavedSearch: vi.fn(),
  updateSavedSearch: vi.fn(),
  deleteSavedSearch: vi.fn(),
  toggleSavedSearchNotification: vi.fn(),
  getJobAlerts: vi.fn(() => Promise.resolve({ data: { data: [] } })),
  createJobAlert: vi.fn(),
  updateJobAlert: vi.fn(),
  deleteJobAlert: vi.fn(),
}));

import Jobs from './Jobs';

describe('Jobs page', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockImplementation((url) => {
      if (url === '/categories') {
        return Promise.resolve({ data: { data: [{ _id: 'cat-1', name: 'IT' }] } });
      }

      if (url === '/jobs') {
        return Promise.resolve({
          data: {
            data: [
              {
                _id: 'job-1',
                title: 'Frontend Developer',
                company: { name: 'Acme Labs' },
                location: { city: 'Addis Ababa', region: 'Addis Ababa' },
                jobType: 'Full-time',
                salary: { min: 15000, max: 25000 },
                category: { name: 'IT' },
                skillsRequired: [{ _id: 'skill-1', name: 'React' }],
                applicationDeadline: '2026-12-31T00:00:00.000Z',
                isFeatured: true,
              },
            ],
          },
        });
      }

      return Promise.resolve({ data: {} });
    });
  });

  it('renders jobs from the backend payload', async () => {
    render(
      <Provider store={setupStore()}>
        <MemoryRouter>
          <Jobs />
        </MemoryRouter>
      </Provider>
    );

    expect(await screen.findByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('Acme Labs')).toBeInTheDocument();
  });
});
