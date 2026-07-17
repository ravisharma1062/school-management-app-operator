import { describe, expect, it } from 'vitest';
import { tokenStorage, type StoredSession } from './tokenStorage';

const session: StoredSession = {
  accessToken: 'acc-123',
  refreshToken: 'ref-456',
  platformRole: 'PLATFORM_ADMIN',
};

describe('tokenStorage', () => {
  it('returns null when nothing is stored', () => {
    expect(tokenStorage.get()).toBeNull();
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it('round-trips a full session', () => {
    tokenStorage.set(session);
    expect(tokenStorage.get()).toEqual(session);
    expect(tokenStorage.getAccessToken()).toBe('acc-123');
    expect(tokenStorage.getRefreshToken()).toBe('ref-456');
  });

  it('persists under the ops.* localStorage keys', () => {
    tokenStorage.set(session);
    expect(localStorage.getItem('ops.accessToken')).toBe('acc-123');
    expect(localStorage.getItem('ops.refreshToken')).toBe('ref-456');
    expect(localStorage.getItem('ops.platformRole')).toBe('PLATFORM_ADMIN');
  });

  it('get() returns null when the access token is missing', () => {
    tokenStorage.set(session);
    localStorage.removeItem('ops.accessToken');
    expect(tokenStorage.get()).toBeNull();
  });

  it('get() returns null when the refresh token is missing', () => {
    tokenStorage.set(session);
    localStorage.removeItem('ops.refreshToken');
    expect(tokenStorage.get()).toBeNull();
  });

  it('get() returns null when the role is missing', () => {
    tokenStorage.set(session);
    localStorage.removeItem('ops.platformRole');
    expect(tokenStorage.get()).toBeNull();
  });

  it('clear() removes every key', () => {
    tokenStorage.set(session);
    tokenStorage.clear();
    expect(tokenStorage.get()).toBeNull();
    expect(localStorage.getItem('ops.accessToken')).toBeNull();
    expect(localStorage.getItem('ops.refreshToken')).toBeNull();
    expect(localStorage.getItem('ops.platformRole')).toBeNull();
  });
});
