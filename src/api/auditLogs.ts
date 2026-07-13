import { api } from './client';
import type { AuditLogDto, Page } from '@/types';

export const auditLogsApi = {
  list(page: number, size = 20) {
    return api.get<Page<AuditLogDto>>('/audit-logs', { params: { page, size } }).then((r) => r.data);
  },
};
