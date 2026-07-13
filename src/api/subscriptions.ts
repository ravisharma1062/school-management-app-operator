import { api } from './client';
import type { PlanCode, SubscriptionAdminDto } from '@/types';

export const subscriptionsApi = {
  get(schoolId: string) {
    return api.get<SubscriptionAdminDto>(`/subscriptions/${schoolId}`).then((r) => r.data);
  },
  updatePlan(schoolId: string, planCode: PlanCode) {
    return api.patch<SubscriptionAdminDto>(`/subscriptions/${schoolId}`, { planCode }).then((r) => r.data);
  },
};
