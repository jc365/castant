import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginForm from './LoginForm';

const mockOnLoginSuccess = vi.fn();

vi.mock('../api/client', () => ({
  default: {
    post: vi.fn(),
  },
}));

import client from '../api/client';

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form with email and password fields', () => {
    const { container } = render(<LoginForm onLoginSuccess={mockOnLoginSuccess} />);
    expect(container.querySelector('input[type="email"]')).toBeInTheDocument();
    expect(container.querySelector('input[type="password"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('login exitoso llama a onLoginSuccess', async () => {
    const mockPost = vi.mocked(client.post);
    mockPost.mockResolvedValueOnce({
      data: { token: 'test-token', userId: 'user-123' },
    });

    const { container } = render(<LoginForm onLoginSuccess={mockOnLoginSuccess} />);

    const emailInput = container.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('test-token');
      expect(localStorage.getItem('userId')).toBe('user-123');
      expect(mockOnLoginSuccess).toHaveBeenCalled();
    });
  });

  it('login fallido muestra mensaje de error', async () => {
    const mockPost = vi.mocked(client.post);
    mockPost.mockRejectedValueOnce(new Error('Credenciales inválidas'));

    const { container } = render(<LoginForm onLoginSuccess={mockOnLoginSuccess} />);

    const emailInput = container.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
    });

    expect(mockOnLoginSuccess).not.toHaveBeenCalled();
  });

  it('shows loading state while submitting', async () => {
    const mockPost = vi.mocked(client.post);
    mockPost.mockImplementationOnce(() => new Promise(() => {}));

    const { container } = render(<LoginForm onLoginSuccess={mockOnLoginSuccess} />);

    const emailInput = container.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Entrando...')).toBeInTheDocument();
    });
  });
});
