import { api } from './client';
import type { PlatformAnalyticsDto } from '@/types';

export const analyticsApi = {
  get() {
    return api.get<PlatformAnalyticsDto>('/analytics').then((r) => r.data);
  },
};
