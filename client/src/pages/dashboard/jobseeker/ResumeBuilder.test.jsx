import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { setupStore } from '../../../store/store';
import ResumeBuilder from './ResumeBuilder';

describe('ResumeBuilder', () => {
  it('renders the redesigned builder shell with a visible resume builder heading', () => {
    render(
      <Provider store={setupStore()}>
        <MemoryRouter>
          <ResumeBuilder />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText(/Resume Builder/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Resume/i)).toBeInTheDocument();
  });
});
