import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Profile from './Profile';

const mockDispatch = vi.fn();

vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) => selector({ auth: { user: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', profileCompleteness: 35 }, loading: false } }),
}));

vi.mock('react-hot-toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('JobSeekerProfile', () => {
  it('shows empty-state guidance when the profile has no saved details', () => {
    render(<Profile />);

    expect(screen.getByText(/Add your professional summary/i)).toBeInTheDocument();
    expect(screen.getByText(/No certifications added yet/i)).toBeInTheDocument();
  });
});
