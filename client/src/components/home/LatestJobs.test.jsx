import { render, screen } from '@testing-library/react';
import LatestJobs from './LatestJobs';
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
    render(<LatestJobs />);

    expect(await screen.findByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('EthioTech')).toBeInTheDocument();
  });
});
