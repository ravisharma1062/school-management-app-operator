import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogsApi } from '@/api/auditLogs';
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Pagination,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';

export function AuditLogPage() {
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () => auditLogsApi.list(page),
  });

  return (
    <div>
      <PageHeader title="Audit Log" description="Every cross-tenant platform action, newest first." />

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : !query.data || query.data.content.length === 0 ? (
        <EmptyState title="No platform actions yet" />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>When</TH>
                <TH>Actor</TH>
                <TH>Action</TH>
                <TH>Summary</TH>
              </TR>
            </THead>
            <TBody>
              {query.data.content.map((log) => (
                <TR key={log.id}>
                  <TD className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</TD>
                  <TD>{log.actorEmail}</TD>
                  <TD className="font-semibold text-slate-800">{log.action.replace(/_/g, ' ')}</TD>
                  <TD className="whitespace-normal text-slate-600">{log.summary}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <div className="px-4 pb-2 sm:px-6">
            <Pagination
              page={query.data.number}
              totalPages={query.data.totalPages}
              totalElements={query.data.totalElements}
              onPageChange={setPage}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
