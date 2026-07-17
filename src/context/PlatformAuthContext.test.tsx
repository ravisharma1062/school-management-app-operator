import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlatformAuthProvider, usePlatformAuth } from './PlatformAuthContext';
import { platformAuthApi } from '@/api/platformAuth';
import { SESSION_EXPIRED_EVENT } from '@/api/client';
import { tokenStorage } from '@/api/tokenStorage';

vi.mock('@/api/platformAuth', () => ({
  platformAuthApi: {
    login: vi.fn(),
    enrollMfa: vi.fn(),
    confirmMfa: vi.fn(),
  },
}));

const mockedLogin = vi.mocked(platformAuthApi.login);

const storedSession = {
  accessToken: 'acc-1',
  refreshToken: 'ref-1',
  platformRole: 'PLATFORM_ADMIN' as const,
};

function Probe() {
  const auth = usePlatformAuth();
  return (
    <div>
      <span data-testid="authed">{String(auth.isAuthenticated)}</span>
      <span data-testid="role">{auth.platformRole ?? 'none'}</span>
      <span data-testid="mfa">{String(auth.mfaEnrolled)}</span>
      <span data-testid="boot">{String(auth.isBootstrapping)}</span>
      <button onClick={() => void auth.login('ops@example.com', 'pw', '123456').catch(() => {})}>
        do-login
      </button>
      <button onClick={auth.logout}>do-logout</button>
    </div>
  );
}

function renderProbe() {
  return render(
    <PlatformAuthProvider>
      <Probe />
    </PlatformAuthProvider>,
  );
}

describe('PlatformAuthProvider', () => {
  it('starts unauthenticated when nothing is stored', () => {
    renderProbe();
    expect(screen.getByTestId('authed')).toHaveTextContent('false');
    expect(screen.getByTestId('role')).toHaveTextContent('none');
    expect(screen.getByTestId('boot')).toHaveTextContent('false');
  });

  it('restores the session from tokenStorage on boot', () => {
    tokenStorage.set(storedSession);
    renderProbe();
    expect(screen.getByTestId('authed')).toHaveTextContent('true');
    expect(screen.getByTestId('role')).toHaveTextContent('PLATFORM_ADMIN');
    expect(screen.getByTestId('boot')).toHaveTextContent('false');
  });

  it('login stores the token pair and flips to authenticated', async () => {
    mockedLogin.mockResolvedValue({
      accessToken: 'acc-new',
      refreshToken: 'ref-new',
      platformRole: 'PLATFORM_ADMIN',
      mfaEnrolled: true,
    });
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole('button', { name: 'do-login' }));

    expect(mockedLogin).toHaveBeenCalledWith('ops@example.com', 'pw', '123456');
    expect(screen.getByTestId('authed')).toHaveTextContent('true');
    expect(screen.getByTestId('mfa')).toHaveTextContent('true');
    expect(tokenStorage.get()).toEqual({
      accessToken: 'acc-new',
      refreshToken: 'ref-new',
      platformRole: 'PLATFORM_ADMIN',
    });
  });

  it('a failed login leaves the session untouched', async () => {
    mockedLogin.mockRejectedValue(new Error('Invalid email or password'));
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole('button', { name: 'do-login' }));

    expect(screen.getByTestId('authed')).toHaveTextContent('false');
    expect(tokenStorage.get()).toBeNull();
  });

  it('logout clears storage and state', async () => {
    tokenStorage.set(storedSession);
    const user = userEvent.setup();
    renderProbe();
    expect(screen.getByTestId('authed')).toHaveTextContent('true');

    await user.click(screen.getByRole('button', { name: 'do-logout' }));

    expect(screen.getByTestId('authed')).toHaveTextContent('false');
    expect(screen.getByTestId('role')).toHaveTextContent('none');
    expect(tokenStorage.get()).toBeNull();
  });

  it('logs out when the api layer fires the session-expired event', () => {
    tokenStorage.set(storedSession);
    renderProbe();
    expect(screen.getByTestId('authed')).toHaveTextContent('true');

    act(() => {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    });

    expect(screen.getByTestId('authed')).toHaveTextContent('false');
    expect(tokenStorage.get()).toBeNull();
  });
});

describe('usePlatformAuth', () => {
  it('throws when used outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(
      'usePlatformAuth must be used within a PlatformAuthProvider',
    );
  });
});
