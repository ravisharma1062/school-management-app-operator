import type { PlatformRole } from '@/types';

const ACCESS_KEY = 'ops.accessToken';
const REFRESH_KEY = 'ops.refreshToken';
const ROLE_KEY = 'ops.platformRole';

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  platformRole: PlatformRole;
}

export const tokenStorage = {
  get(): StoredSession | null {
    const accessToken = localStorage.getItem(ACCESS_KEY);
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    const platformRole = localStorage.getItem(ROLE_KEY) as PlatformRole | null;
    if (!accessToken || !refreshToken || !platformRole) return null;
    return { accessToken, refreshToken, platformRole };
  },

  set(session: StoredSession): void {
    localStorage.setItem(ACCESS_KEY, session.accessToken);
    localStorage.setItem(REFRESH_KEY, session.refreshToken);
    localStorage.setItem(ROLE_KEY, session.platformRole);
  },

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },

  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(ROLE_KEY);
  },
};
