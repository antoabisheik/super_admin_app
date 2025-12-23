import { render, screen } from '@testing-library/react';
import LandingPage from '../LandingPage';

describe('LandingPage Integration', () => {
  it('renders sign in and sign up buttons', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign Up/i)).toBeInTheDocument();
  });

  it('renders the main heading', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Your All-In-One Fitness/i)).toBeInTheDocument();
  });
});
