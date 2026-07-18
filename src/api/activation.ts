import axios from 'axios';
import type { ActivationInfoDto } from '@/types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

// This endpoint lives under the tenant realm (/api/v1/auth/*), not the platform realm
// (/api/v1/platform/*) the rest of this app talks to — so it's a plain axios call, bypassing
// the platform-scoped `api` client in ./client.ts entirely (no bearer token needed either,
// it's a public, single-use-token-authorized endpoint).
export const activationApi = {
  getInfo: (token: string) =>
    axios.get<ActivationInfoDto>(`${BASE_URL}/api/v1/auth/activation/${encodeURIComponent(token)}`).then((r) => r.data),

  activate: (token: string, newPassword: string) =>
    axios.post<void>(`${BASE_URL}/api/v1/auth/activate`, { token, newPassword }).then(() => undefined),
};
