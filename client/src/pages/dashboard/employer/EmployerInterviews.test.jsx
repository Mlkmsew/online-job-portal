import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import EmployerInterviews from './EmployerInterviews';
import api from '../../../services/api';

vi.mock('../../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('EmployerInterviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({
      data: {
        data: [
          {
            _id: '1',
            status: 'scheduled',
            scheduledDate: '2026-08-03T10:00:00.000Z',
            type: 'Google Meet',
            location: 'https://meet.google.com/abc-defg-hij',
            note: 'Bring portfolio',
            applicant: { firstName: 'Alice', lastName: 'Bekele', email: 'alice@example.com' },
            job: { title: 'Frontend Developer' },
            company: { name: 'EthioSoft' },
          },
        ],
      },
    });
  });

  it('renders interviews and opens the scheduling modal', async () => {
    renderWithRouter(<EmployerInterviews />);

    expect(await screen.findByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('Upcoming')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /schedule new interview/i }));
    expect(screen.getByText(/schedule interview/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/candidate/i)).toBeInTheDocument();
  });

  it('shows completed interview evaluation controls and opens the assessment modal', async () => {
    api.get.mockResolvedValue({
      data: {
        data: [
          {
            _id: '2',
            status: 'completed',
            scheduledDate: '2026-08-01T10:00:00.000Z',
            type: 'Google Meet',
            location: 'https://meet.google.com/abc-defg-hij',
            feedback: 'Strong communicator',
            rating: 5,
            strengths: 'Communication, React',
            weaknesses: 'Needs more depth in testing',
            finalDecision: 'Hired',
            result: 'Hired',
            applicant: { firstName: 'Bob', lastName: 'Dawit', email: 'bob@example.com', cvUrl: 'https://example.com/cv.pdf' },
            job: { title: 'Product Designer' },
            company: { name: 'EthioSoft' },
          },
        ],
      },
    });

    renderWithRouter(<EmployerInterviews />);

    await userEvent.click(screen.getByRole('button', { name: /completed/i }));

    expect(await screen.findByText('Product Designer')).toBeInTheDocument();
    expect(screen.getAllByText(/hired/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/rating/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^complete assessment$/i }));
    expect(screen.getByRole('heading', { name: /complete assessment/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/interview notes/i)).toBeInTheDocument();
  });

  it('launches the pre-interview workflow from a scheduled interview card', async () => {
    renderWithRouter(<EmployerInterviews />);

    expect(await screen.findByText('Frontend Developer')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /start interview/i }));

    expect(await screen.findByRole('heading', { name: /start interview/i })).toBeInTheDocument();
    expect(screen.getByText(/candidate overview/i)).toBeInTheDocument();
  });
});
