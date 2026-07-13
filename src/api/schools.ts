import { api } from './client';
import type { Page, SchoolAdminDto, SchoolStatus } from '@/types';

export const schoolsApi = {
  list(page: number, size = 20) {
    return api.get<Page<SchoolAdminDto>>('/schools', { params: { page, size } }).then((r) => r.data);
  },
  get(id: string) {
    return api.get<SchoolAdminDto>(`/schools/${id}`).then((r) => r.data);
  },
  updateStatus(id: string, status: SchoolStatus) {
    return api.patch<SchoolAdminDto>(`/schools/${id}/status`, { status }).then((r) => r.data);
  },
};
