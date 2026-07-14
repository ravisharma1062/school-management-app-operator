import { api } from './client';
import type { PlatformPaymentDto } from '@/types';

export const paymentsApi = {
  listPending() {
    return api.get<PlatformPaymentDto[]>('/payments/pending').then((r) => r.data);
  },
  verify(id: string, notes: string) {
    return api.patch<PlatformPaymentDto>(`/payments/${id}/verify`, { notes }).then((r) => r.data);
  },
  reject(id: string, notes: string) {
    return api.patch<PlatformPaymentDto>(`/payments/${id}/reject`, { notes }).then((r) => r.data);
  },
};
