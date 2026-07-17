import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './RequireAuth';
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

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>login-page</div>} />
        <Route element={<RequireAuth />}>
          <Route path="/schools" element={<div>protected-content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireAuth', () => {
  it('shows the session-restore loader while bootstrapping', () => {
    mockedUseAuth.mockReturnValue(authValue({ isBootstrapping: true }));
    renderAt('/schools');
    expect(screen.getByText('Restoring your session…')).toBeInTheDocument();
    expect(screen.queryByText('protected-content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to /login', () => {
    mockedUseAuth.mockReturnValue(authValue({ isAuthenticated: false }));
    renderAt('/schools');
    expect(screen.getByText('login-page')).toBeInTheDocument();
    expect(screen.queryByText('protected-content')).not.toBeInTheDocument();
  });

  it('renders the protected outlet when authenticated', () => {
    mockedUseAuth.mockReturnValue(
      authValue({ isAuthenticated: true, platformRole: 'PLATFORM_ADMIN' }),
    );
    renderAt('/schools');
    expect(screen.getByText('protected-content')).toBeInTheDocument();
    expect(screen.queryByText('login-page')).not.toBeInTheDocument();
  });
});
