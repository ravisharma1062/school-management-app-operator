import { api } from './client';
import type { PlatformSettingsDto } from '@/types';

export const settingsApi = {
  get() {
    return api.get<PlatformSettingsDto>('/settings').then((r) => r.data);
  },
  update(patch: { autoApproveSignups?: boolean; paymentInstructions?: string }) {
    return api.patch<PlatformSettingsDto>('/settings', patch).then((r) => r.data);
  },
};
