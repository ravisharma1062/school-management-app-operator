import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { schoolsApi } from '@/api/schools';
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Pagination,
  SchoolStatusBadge,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';

export function SchoolsPage() {
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: ['schools', page],
    queryFn: () => schoolsApi.list(page),
  });

  return (
    <div>
      <PageHeader title="Schools" description="Every provisioned tenant. Click one to manage its status or plan." />

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : !query.data || query.data.content.length === 0 ? (
        <EmptyState title="No schools yet" message="Approve a signup request to provision the first one." />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Slug</TH>
                <TH>Status</TH>
                <TH>Created</TH>
              </TR>
            </THead>
            <TBody>
              {query.data.content.map((s) => (
                <TR key={s.id} className="cursor-pointer">
                  <TD className="font-semibold text-slate-900">
                    <Link to={`/schools/${s.id}`} className="hover:text-brand-700 hover:underline">
                      {s.name}
                    </Link>
                  </TD>
                  <TD className="font-mono text-xs text-slate-500">{s.slug}</TD>
                  <TD>
                    <SchoolStatusBadge status={s.status} />
                  </TD>
                  <TD>{new Date(s.createdAt).toLocaleDateString()}</TD>
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
