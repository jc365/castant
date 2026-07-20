import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Layout from './Layout';

const mockRefreshUser = vi.fn();

vi.mock('../context/UserContext', () => ({
  useUser: () => ({
    user: null,
    refreshUser: mockRefreshUser,
  }),
  UserProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
    allThemes: ['light', 'dark', 'ocean', 'forest', 'sunset', 'night'],
    themeLabels: {
      light: 'Claro',
      dark: 'Oscuro',
      ocean: 'Océano',
      forest: 'Bosque',
      sunset: 'Atardecer',
      night: 'Noche',
    },
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import client from '../api/client';

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    Object.defineProperty(import.meta, 'env', {
      value: { VITE_DEMO_MODE: 'true' },
      writable: true,
    });
  });

  it('shows login form when not authenticated', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );
    expect(screen.getAllByText('Slate Casting').length).toBeGreaterThan(0);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('toggle demo llama a POST /auth/login con xUserId', async () => {
    const mockPost = vi.mocked(client.post);
    mockPost.mockResolvedValueOnce({
      data: { token: 'demo-token', userId: 'user-director-1' },
    });

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    const toggle = screen.getByText('Modo Demo').closest('div')?.querySelector('.relative');
    if (toggle) {
      fireEvent.click(toggle);
    }

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/auth/login', { xUserId: 'director' });
    });
  });

  it('toggle demo guarda token y userId en localStorage', async () => {
    const mockPost = vi.mocked(client.post);
    mockPost.mockResolvedValueOnce({
      data: { token: 'demo-token', userId: 'user-director-1' },
    });

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    const toggle = screen.getByText('Modo Demo').closest('div')?.querySelector('.relative');
    if (toggle) {
      fireEvent.click(toggle);
    }

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('demo-token');
      expect(localStorage.getItem('userId')).toBe('user-director-1');
    });
  });

  it('toggle demo OFF limpia localStorage', async () => {
    localStorage.setItem('token', 'existing-token');
    localStorage.setItem('userId', 'user-123');

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    const toggle = screen.getByText('Modo Demo').closest('div')?.querySelector('.relative');
    if (toggle) {
      fireEvent.click(toggle);
    }

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('userId')).toBeNull();
      expect(mockRefreshUser).toHaveBeenCalled();
    });
  });

  it('role selector changes selected role', async () => {
    const mockPost = vi.mocked(client.post);
    mockPost.mockResolvedValue({
      data: { token: 'demo-token', userId: 'user-actor-1' },
    });

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    const toggle = screen.getByText('Modo Demo').closest('div')?.querySelector('.relative');
    if (toggle) {
      fireEvent.click(toggle);
    }

    await waitFor(() => {
      expect(screen.getByText('Demo: director')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const roleSelect = selects.find((s) => s.querySelector('option[value="director"]'));
    if (roleSelect) {
      fireEvent.change(roleSelect, { target: { value: 'actor' } });
    }

    expect(screen.getByText('Demo: actor')).toBeInTheDocument();
  });
});
