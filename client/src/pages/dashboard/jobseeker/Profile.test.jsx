import { render, screen, within, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Profile from './Profile';

const mockDispatch = vi.fn();

const buildUser = (overrides = {}) => ({
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  profileCompleteness: 35,
  technicalSkills: ['Java', 'Python'],
  softSkills: ['Communication', 'Teamwork'],
  skillNames: ['Java', 'Python', 'Communication', 'Teamwork'],
  ...overrides,
});

const buildStore = (user) => ({
  auth: { user, loading: false },
});

// Module-level mutable store read by the mocked useSelector. The component
// re-renders whenever the `user` reference changes (it is a dependency of an
// effect), so the mock must return the same reference on every call to avoid
// an infinite re-render loop. Each test gets a fresh store via `beforeEach`.
let currentStore = buildStore(buildUser());

vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) => selector(currentStore),
}));

vi.mock('react-hot-toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key, i18n: { language: 'en' } }),
}));

describe('JobSeekerProfile', () => {
  beforeEach(() => {
    currentStore = buildStore(buildUser());
    mockDispatch.mockClear();
  });

  it('renders technical and soft skills in two separate labeled groups', () => {
    render(<Profile />);

    const technicalGroup = screen.getByTestId('technical-skills-group');
    const softGroup = screen.getByTestId('soft-skills-group');

    expect(within(technicalGroup).getByText('profile.technicalSkills')).toBeInTheDocument();
    expect(within(softGroup).getByText('profile.softSkills')).toBeInTheDocument();

    expect(within(technicalGroup).getByText('Java')).toBeInTheDocument();
    expect(within(technicalGroup).getByText('Python')).toBeInTheDocument();
    expect(within(softGroup).getByText('Communication')).toBeInTheDocument();
    expect(within(softGroup).getByText('Teamwork')).toBeInTheDocument();

    // Skills must not leak into the wrong category
    expect(within(softGroup).queryByText('Java')).not.toBeInTheDocument();
    expect(within(technicalGroup).queryByText('Communication')).not.toBeInTheDocument();
  });

  it('shows empty-state guidance when the profile has no saved skills', () => {
    currentStore = buildStore(buildUser({ technicalSkills: [], softSkills: [], skillNames: [] }));

    render(<Profile />);

    // The empty-state text can appear in the header preview and the Skills section
    expect(screen.getAllByText('profile.noSkills').length).toBeGreaterThan(0);
  });

  it('shows the Edit Skills modal with category-specific inputs and controls', () => {
    render(<Profile />);

    fireEvent.click(screen.getByText('profile.editSkills'));

    const technicalGroup = screen.getByTestId('modal-technical-skills-group');
    const softGroup = screen.getByTestId('modal-soft-skills-group');

    expect(within(technicalGroup).getByPlaceholderText(/e.g. Java, Python, React/)).toBeInTheDocument();
    expect(within(softGroup).getByPlaceholderText(/e.g. Communication, Teamwork/)).toBeInTheDocument();

    // Existing skills are pre-loaded into their correct category
    expect(within(technicalGroup).getByText('Java')).toBeInTheDocument();
    expect(within(softGroup).getByText('Communication')).toBeInTheDocument();

    // Each pill has edit and delete controls
    expect(within(technicalGroup).getAllByTitle('Edit').length).toBeGreaterThan(0);
    expect(within(technicalGroup).getAllByTitle('Delete').length).toBeGreaterThan(0);
    expect(within(softGroup).getAllByTitle('Edit').length).toBeGreaterThan(0);
    expect(within(softGroup).getAllByTitle('Delete').length).toBeGreaterThan(0);
  });

  it('adds a new skill to the selected category before saving', () => {
    render(<Profile />);

    fireEvent.click(screen.getByText('profile.editSkills'));

    const technicalGroup = screen.getByTestId('modal-technical-skills-group');
    const softGroup = screen.getByTestId('modal-soft-skills-group');

    fireEvent.change(within(technicalGroup).getByPlaceholderText(/e.g. Java, Python, React/), { target: { value: 'Node.js' } });
    fireEvent.click(within(technicalGroup).getByText('Add'));
    expect(within(technicalGroup).getByText('Node.js')).toBeInTheDocument();

    fireEvent.change(within(softGroup).getByPlaceholderText(/e.g. Communication, Teamwork/), { target: { value: 'Adaptability' } });
    fireEvent.click(within(softGroup).getByText('Add'));
    expect(within(softGroup).getByText('Adaptability')).toBeInTheDocument();

    // The new soft skill stays in the soft category only
    expect(within(technicalGroup).queryByText('Adaptability')).not.toBeInTheDocument();
  });

  it('removes a skill from the selected category when deleted', () => {
    render(<Profile />);

    fireEvent.click(screen.getByText('profile.editSkills'));

    const technicalGroup = screen.getByTestId('modal-technical-skills-group');
    const deleteButtons = within(technicalGroup).getAllByTitle('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(within(technicalGroup).queryByText('Java')).not.toBeInTheDocument();
    expect(within(technicalGroup).getByText('Python')).toBeInTheDocument();
  });
});