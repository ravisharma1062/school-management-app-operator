import { afterEach, describe, expect, it, vi } from 'vitest';
import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { api, extractErrorMessage, SESSION_EXPIRED_EVENT } from './client';
import { tokenStorage } from './tokenStorage';

const session = {
  accessToken: 'acc-1',
  refreshToken: 'ref-1',
  platformRole: 'PLATFORM_ADMIN' as const,
};

function respond(config: InternalAxiosRequestConfig, status: number, data: unknown): AxiosResponse {
  const response: AxiosResponse = { data, status, statusText: String(status), headers: {}, config };
  if (status >= 200 && status < 300) return response;
  // A custom adapter must reject non-2xx itself (axios only settles inside its built-in adapters).
  throw new AxiosError(
    `Request failed with status code ${status}`,
    'ERR_BAD_REQUEST',
    config,
    {},
    response,
  );
}

/** Refresh response the platform /auth/refresh endpoint returns. */
const refreshedAuth = {
  accessToken: 'acc-2',
  refreshToken: 'ref-2',
  platformRole: 'PLATFORM_ADMIN',
  mfaEnrolled: true,
};

function mockRefreshEndpoint() {
  // client.ts refreshes with a bare `axios.post`, so spy on the static method.
  return vi.spyOn(axios, 'post').mockImplementation(
    () =>
      new Promise((resolve) => {
        setTimeout(() => resolve({ data: refreshedAuth }), 0);
      }),
  );
}

afterEach(() => {
  api.defaults.adapter = undefined;
});

describe('request interceptor', () => {
  it('attaches Bearer <access token> when one is stored', async () => {
    let seen: InternalAxiosRequestConfig | undefined;
    api.defaults.adapter = async (config) => {
      seen = config;
      return respond(config, 200, {});
    };
    tokenStorage.set(session);

    await api.get('/schools');

    expect(seen?.headers.get('Authorization')).toBe('Bearer acc-1');
  });

  it('sends no Authorization header when no token is stored', async () => {
    let seen: InternalAxiosRequestConfig | undefined;
    api.defaults.adapter = async (config) => {
      seen = config;
      return respond(config, 200, {});
    };

    await api.get('/schools');

    expect(seen?.headers.get('Authorization')).toBeFalsy();
  });

  it('targets the platform API prefix', () => {
    expect(api.defaults.baseURL).toMatch(/\/api\/v1\/platform$/);
  });
});

describe('401 refresh flow', () => {
  it('refreshes the token, stores the new pair, and retries the original request', async () => {
    const seen: InternalAxiosRequestConfig[] = [];
    api.defaults.adapter = async (config) => {
      seen.push(config);
      if (seen.length === 1) return respond(config, 401, { message: 'expired' });
      return respond(config, 200, { ok: true });
    };
    tokenStorage.set(session);
    const postSpy = mockRefreshEndpoint();

    const res = await api.get('/schools');

    expect(res.data).toEqual({ ok: true });
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/platform\/auth\/refresh$/),
      { refreshToken: 'ref-1' },
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
    );
    // Retried request carries the fresh token.
    expect(seen[1]?.headers.get('Authorization')).toBe('Bearer acc-2');
    // New pair persisted.
    expect(tokenStorage.get()).toEqual({
      accessToken: 'acc-2',
      refreshToken: 'ref-2',
      platformRole: 'PLATFORM_ADMIN',
    });
  });

  it('deduplicates concurrent 401s into a single refresh call (single-flight)', async () => {
    api.defaults.adapter = async (config) => {
      if (!(config as InternalAxiosRequestConfig & { _retry?: boolean })._retry) {
        return respond(config, 401, { message: 'expired' });
      }
      return respond(config, 200, { ok: true });
    };
    tokenStorage.set(session);
    const postSpy = mockRefreshEndpoint();

    const [a, b] = await Promise.all([api.get('/schools'), api.get('/analytics')]);

    expect(a.data).toEqual({ ok: true });
    expect(b.data).toEqual({ ok: true });
    expect(postSpy).toHaveBeenCalledTimes(1);
  });

  it('clears tokens and fires the session-expired event when refresh fails', async () => {
    api.defaults.adapter = async (config) => respond(config, 401, { message: 'expired' });
    tokenStorage.set(session);
    const postSpy = vi.spyOn(axios, 'post').mockRejectedValue(new Error('refresh dead'));
    const expired = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, expired);

    try {
      await expect(api.get('/schools')).rejects.toThrow('refresh dead');
    } finally {
      window.removeEventListener(SESSION_EXPIRED_EVENT, expired);
    }

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(tokenStorage.get()).toBeNull();
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it('does not attempt a refresh when no refresh token is stored', async () => {
    api.defaults.adapter = async (config) => respond(config, 401, { message: 'expired' });
    const postSpy = vi.spyOn(axios, 'post');

    await expect(api.get('/schools')).rejects.toMatchObject({ response: { status: 401 } });

    expect(postSpy).not.toHaveBeenCalled();
  });

  it('does not attempt a refresh for a 401 from the login endpoint', async () => {
    api.defaults.adapter = async (config) => respond(config, 401, { message: 'bad credentials' });
    tokenStorage.set(session);
    const postSpy = vi.spyOn(axios, 'post');

    await expect(
      api.post('/auth/login', { email: 'a@b.c', password: 'x' }),
    ).rejects.toMatchObject({ response: { status: 401 } });

    expect(postSpy).not.toHaveBeenCalled();
    // Login 401 must not nuke an existing session.
    expect(tokenStorage.get()).toEqual(session);
  });

  it('gives up after one retry when the server keeps returning 401', async () => {
    let attempts = 0;
    api.defaults.adapter = async (config) => {
      attempts += 1;
      return respond(config, 401, { message: 'still expired' });
    };
    tokenStorage.set(session);
    const postSpy = mockRefreshEndpoint();

    await expect(api.get('/schools')).rejects.toMatchObject({ response: { status: 401 } });

    expect(attempts).toBe(2); // original + exactly one retry
    expect(postSpy).toHaveBeenCalledTimes(1);
  });

  it('passes non-401 errors straight through', async () => {
    api.defaults.adapter = async (config) => respond(config, 500, { message: 'boom' });
    tokenStorage.set(session);
    const postSpy = vi.spyOn(axios, 'post');

    await expect(api.get('/schools')).rejects.toMatchObject({ response: { status: 500 } });

    expect(postSpy).not.toHaveBeenCalled();
  });
});

describe('extractErrorMessage', () => {
  function axiosErrorWith(data: unknown): AxiosError {
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
    return new AxiosError('Request failed with status code 400', 'ERR_BAD_REQUEST', config, {}, {
      data,
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config,
    });
  }

  it('prefers the backend `message` field', () => {
    expect(extractErrorMessage(axiosErrorWith({ message: 'School not found' }))).toBe(
      'School not found',
    );
  });

  it('falls back to the backend `error` field', () => {
    expect(extractErrorMessage(axiosErrorWith({ error: 'Bad Request' }))).toBe('Bad Request');
  });

  it('falls back to the axios error message when the body has neither', () => {
    expect(extractErrorMessage(axiosErrorWith({}))).toBe('Request failed with status code 400');
  });

  it('uses the message of a plain Error', () => {
    expect(extractErrorMessage(new Error('offline'))).toBe('offline');
  });

  it('returns the fallback for non-Error values', () => {
    expect(extractErrorMessage('weird')).toBe('Something went wrong');
    expect(extractErrorMessage(undefined, 'Custom fallback')).toBe('Custom fallback');
  });
});
