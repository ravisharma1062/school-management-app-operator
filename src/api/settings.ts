import { api } from './client';
import type { PlatformSettingsDto } from '@/types';

export const settingsApi = {
  get() {
    return api.get<PlatformSettingsDto>('/settings').then((r) => r.data);
  },
  update(autoApproveSignups: boolean) {
    return api.patch<PlatformSettingsDto>('/settings', { autoApproveSignups }).then((r) => r.data);
  },
};
