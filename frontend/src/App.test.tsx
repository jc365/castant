import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getAllByText('Slate Casting').length).toBeGreaterThan(0);
  });

  it('shows login form when not authenticated', () => {
    render(<App />);
    expect(screen.getByText('Entrar')).toBeInTheDocument();
  });
});
