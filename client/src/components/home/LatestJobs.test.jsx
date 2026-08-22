import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import LatestJobs from './LatestJobs';
import { setupStore } from '../../store/store';
import { vi } from 'vitest';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            _id: '1',
            title: 'Frontend Developer',
            company: { name: 'EthioTech' },
            location: { city: 'Addis Ababa', region: 'Addis Ababa' },
          },
        ],
      },
    }),
  },
}));

describe('LatestJobs', () => {
  it('renders job cards without crashing when location is an object', async () => {
    render(
      <Provider store={setupStore()}>
        <MemoryRouter>
          <LatestJobs />
        </MemoryRouter>
      </Provider>
    );

    expect(await screen.findByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('EthioTech')).toBeInTheDocument();
  });
});
