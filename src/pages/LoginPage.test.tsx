import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { usePlatformAuth } from '@/context/PlatformAuthContext';

vi.mock('@/context/PlatformAuthContext', () => ({
  usePlatformAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(usePlatformAuth);

function authValue(overrides: Partial<ReturnType<typeof usePlatformAuth>>) {
  return {
    isAuthenticated: false,
    platformRole: null,
    mfaEnrolled: false,
    isBootstrapping: false,
    login: vi.fn(),
    logout: vi.fn(),
    setMfaEnrolled: vi.fn(),
    ...overrides,
  };
}

function renderLoginPage(initialEntries = ['/login']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup-requests" element={<div>signup-queue</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  it('renders the sign-in form without an MFA field initially', () => {
    mockedUseAuth.mockReturnValue(authValue({}));
    renderLoginPage();

    expect(screen.getByLabelText(/^Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Authenticator code/)).not.toBeInTheDocument();
  });

  it('redirects to signup-requests when already authenticated', () => {
    mockedUseAuth.mockReturnValue(authValue({ isAuthenticated: true }));
    renderLoginPage();

    expect(screen.getByText('signup-queue')).toBeInTheDocument();
  });

  it('submits email/password and navigates on success', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue(authValue({ login }));
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/^Email/), 'ops@example.com');
    await user.type(screen.getByLabelText(/^Password/), 'hunter2');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(login).toHaveBeenCalledWith('ops@example.com', 'hunter2', undefined);
    expect(await screen.findByText('signup-queue')).toBeInTheDocument();
  });

  it('reveals the MFA field and shows the error when the backend demands MFA', async () => {
    const login = vi.fn().mockRejectedValue(new Error('MFA code required'));
    mockedUseAuth.mockReturnValue(authValue({ login }));
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/^Email/), 'ops@example.com');
    await user.type(screen.getByLabelText(/^Password/), 'hunter2');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('MFA code required')).toBeInTheDocument();
    expect(screen.getByLabelText(/Authenticator code/)).toBeInTheDocument();
  });

  it('shows a generic error message for invalid credentials', async () => {
    const login = vi.fn().mockRejectedValue({ isAxiosError: false });
    mockedUseAuth.mockReturnValue(authValue({ login }));
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/^Email/), 'ops@example.com');
    await user.type(screen.getByLabelText(/^Password/), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
  });

  it('submits the MFA code once the field is shown', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue(authValue({ login }));
    const user = userEvent.setup();
    const { rerender } = renderLoginPage();
    void rerender;

    await user.type(screen.getByLabelText(/^Email/), 'ops@example.com');
    await user.type(screen.getByLabelText(/^Password/), 'hunter2');
    // First submit fails and reveals the MFA field.
    login.mockRejectedValueOnce(new Error('MFA required'));
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByLabelText(/Authenticator code/)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Authenticator code/), '654321');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(login).toHaveBeenLastCalledWith('ops@example.com', 'hunter2', '654321');
  });
});
