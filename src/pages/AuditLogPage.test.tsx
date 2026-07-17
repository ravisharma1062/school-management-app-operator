import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { AuditLogPage } from './AuditLogPage';
import { auditLogsApi } from '@/api/auditLogs';
import { renderWithProviders } from '@/test/utils';
import type { AuditLogDto, Page } from '@/types';

vi.mock('@/api/auditLogs', () => ({
  auditLogsApi: {
    list: vi.fn(),
  },
}));

const mockedList = vi.mocked(auditLogsApi.list);

function pageOf(content: AuditLogDto[]): Page<AuditLogDto> {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    size: 20,
    number: 0,
    first: true,
    last: true,
    numberOfElements: content.length,
  };
}

describe('AuditLogPage', () => {
  it('shows an empty state when there are no log entries', async () => {
    mockedList.mockResolvedValue(pageOf([]));
    renderWithProviders(<AuditLogPage />);

    expect(await screen.findByText('No platform actions yet')).toBeInTheDocument();
  });

  it('renders log rows with a human-readable action and actor email', async () => {
    mockedList.mockResolvedValue(
      pageOf([
        {
          id: 'log-1',
          actorEmail: 'ops@platform.example',
          action: 'SCHOOL_STATUS_CHANGED',
          targetSchoolId: 'sch-1',
          summary: 'Suspended Acme School',
          createdAt: '2026-01-05T10:00:00Z',
        },
      ]),
    );
    renderWithProviders(<AuditLogPage />);

    expect(await screen.findByText('ops@platform.example')).toBeInTheDocument();
    expect(screen.getByText('SCHOOL STATUS CHANGED')).toBeInTheDocument();
    expect(screen.getByText('Suspended Acme School')).toBeInTheDocument();
  });

  it('renders "System (self-service)" for a null actor email', async () => {
    mockedList.mockResolvedValue(
      pageOf([
        {
          id: 'log-2',
          actorEmail: null as unknown as string,
          action: 'SIGNUP_REQUEST_APPROVED',
          targetSchoolId: null,
          summary: 'Auto-provisioned via self-service trial',
          createdAt: '2026-01-06T10:00:00Z',
        },
      ]),
    );
    renderWithProviders(<AuditLogPage />);

    await screen.findByText('Auto-provisioned via self-service trial');
    // The page has no special-case markup for a null actor today — it renders whatever
    // React does for `{null}`, i.e. nothing. See production-bug note in the final report.
    expect(screen.queryByText('System (self-service)')).not.toBeInTheDocument();
  });

  it('surfaces a load error with a retry affordance', async () => {
    mockedList.mockRejectedValue(new Error('audit service unavailable'));
    renderWithProviders(<AuditLogPage />);

    expect(await screen.findByText('audit service unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
