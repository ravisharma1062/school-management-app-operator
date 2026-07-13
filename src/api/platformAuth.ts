import { api } from './client';
import type { MfaEnrollResponse, PlatformAuthResponse } from '@/types';

export const platformAuthApi = {
  login(email: string, password: string, mfaCode?: string) {
    return api
      .post<PlatformAuthResponse>('/auth/login', { email, password, mfaCode: mfaCode || null })
      .then((r) => r.data);
  },
  enrollMfa() {
    return api.post<MfaEnrollResponse>('/auth/mfa/enroll').then((r) => r.data);
  },
  confirmMfa(secret: string, code: string) {
    return api.post<void>('/auth/mfa/confirm', { secret, code }).then((r) => r.data);
  },
};
