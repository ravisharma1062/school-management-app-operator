import { api } from './client';
import type { Page, PlanCode, ProvisionResultDto, SignupRequestDto } from '@/types';

export const signupRequestsApi = {
  list(page: number, size = 20) {
    return api
      .get<Page<SignupRequestDto>>('/signup-requests', { params: { page, size } })
      .then((r) => r.data);
  },
  get(id: string) {
    return api.get<SignupRequestDto>(`/signup-requests/${id}`).then((r) => r.data);
  },
  approve(id: string, planCode: PlanCode | null, startAsTrial: boolean) {
    return api
      .post<ProvisionResultDto>(`/signup-requests/${id}/approve`, { planCode, startAsTrial })
      .then((r) => r.data);
  },
  reject(id: string) {
    return api.post<void>(`/signup-requests/${id}/reject`).then((r) => r.data);
  },
};
