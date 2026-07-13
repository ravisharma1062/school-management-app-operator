import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { platformAuthApi } from '@/api/platformAuth';
import { SESSION_EXPIRED_EVENT } from '@/api/client';
import { tokenStorage } from '@/api/tokenStorage';
import type { PlatformRole } from '@/types';

interface PlatformAuthContextValue {
  isAuthenticated: boolean;
  platformRole: PlatformRole | null;
  mfaEnrolled: boolean;
  /** True while we bootstrap the session on first load. */
  isBootstrapping: boolean;
  login: (email: string, password: string, mfaCode?: string) => Promise<void>;
  logout: () => void;
  setMfaEnrolled: (enrolled: boolean) => void;
}

const PlatformAuthContext = createContext<PlatformAuthContextValue | undefined>(undefined);

export function PlatformAuthProvider({ children }: { children: ReactNode }) {
  const [platformRole, setPlatformRole] = useState<PlatformRole | null>(null);
  const [mfaEnrolled, setMfaEnrolled] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setPlatformRole(null);
    setMfaEnrolled(false);
  }, []);

  // There is no /platform/auth/me — the token itself already carries the platform role, and an
  // invalid/expired session surfaces naturally as a 401 on the first real request, which the
  // axios layer turns into SESSION_EXPIRED_EVENT below.
  useEffect(() => {
    const stored = tokenStorage.get();
    if (stored) {
      setPlatformRole(stored.platformRole);
    }
    setIsBootstrapping(false);
  }, []);

  useEffect(() => {
    const handler = () => logout();
    window.addEventListener(SESSION_EXPIRED_EVENT, handler);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
  }, [logout]);

  const login = useCallback(async (email: string, password: string, mfaCode?: string) => {
    const auth = await platformAuthApi.login(email, password, mfaCode);
    tokenStorage.set({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      platformRole: auth.platformRole,
    });
    setPlatformRole(auth.platformRole);
    setMfaEnrolled(auth.mfaEnrolled);
  }, []);

  const value = useMemo<PlatformAuthContextValue>(
    () => ({
      isAuthenticated: !!platformRole,
      platformRole,
      mfaEnrolled,
      isBootstrapping,
      login,
      logout,
      setMfaEnrolled,
    }),
    [platformRole, mfaEnrolled, isBootstrapping, login, logout],
  );

  return <PlatformAuthContext.Provider value={value}>{children}</PlatformAuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlatformAuth(): PlatformAuthContextValue {
  const ctx = useContext(PlatformAuthContext);
  if (!ctx) throw new Error('usePlatformAuth must be used within a PlatformAuthProvider');
  return ctx;
}
