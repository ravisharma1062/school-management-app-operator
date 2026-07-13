import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { signupRequestsApi } from '@/api/signupRequests';
import { extractErrorMessage } from '@/api/client';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
  PageHeader,
  Pagination,
  Select,
  SignupStatusBadge,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';
import type { PlanCode, SignupRequestDto } from '@/types';

const PLAN_CODES: PlanCode[] = ['BASIC', 'STANDARD', 'PREMIUM'];

export function SignupQueuePage() {
  const [page, setPage] = useState(0);
  const [approving, setApproving] = useState<SignupRequestDto | null>(null);
  const [planCode, setPlanCode] = useState<PlanCode>('BASIC');
  const [startAsTrial, setStartAsTrial] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['signup-requests', page],
    queryFn: () => signupRequestsApi.list(page),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => signupRequestsApi.approve(id, planCode, startAsTrial),
    onSuccess: () => {
      setApproving(null);
      void queryClient.invalidateQueries({ queryKey: ['signup-requests'] });
    },
    onError: (err) => setActionError(extractErrorMessage(err)),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => signupRequestsApi.reject(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['signup-requests'] }),
  });

  function openApprove(request: SignupRequestDto) {
    setActionError(null);
    setPlanCode(request.desiredPlan);
    setStartAsTrial(true);
    setApproving(request);
  }

  return (
    <div>
      <PageHeader
        title="Signup Requests"
        description="Review inbound school signups and provision the ones you approve."
      />

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : !query.data || query.data.content.length === 0 ? (
        <EmptyState title="No signup requests yet" message="Approved and rejected requests will also show up here." />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>School</TH>
                <TH>Contact</TH>
                <TH>Plan</TH>
                <TH>Channels</TH>
                <TH>Status</TH>
                <TH>Actions</TH>
              </TR>
            </THead>
            <TBody>
              {query.data.content.map((r) => (
                <TR key={r.id}>
                  <TD className="font-semibold text-slate-900">{r.schoolName}</TD>
                  <TD>
                    <div>{r.contactName}</div>
                    <div className="text-xs text-slate-400">{r.contactEmail}</div>
                  </TD>
                  <TD>{r.desiredPlan}</TD>
                  <TD className="text-xs">
                    {r.wantsEmail ? '📧 Email ' : ''}
                    {r.wantsSms ? '📱 SMS' : ''}
                    {!r.wantsEmail && !r.wantsSms && '—'}
                  </TD>
                  <TD>
                    <SignupStatusBadge status={r.status} />
                  </TD>
                  <TD>
                    {r.status === 'NEW' && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => openApprove(r)}>
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          loading={rejectMutation.isPending}
                          onClick={() => rejectMutation.mutate(r.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </TD>
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

      <Modal
        open={!!approving}
        onClose={() => setApproving(null)}
        title={`Approve ${approving?.schoolName ?? ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setApproving(null)}>
              Cancel
            </Button>
            <Button
              loading={approveMutation.isPending}
              onClick={() => approving && approveMutation.mutate(approving.id)}
            >
              Provision school
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {actionError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {actionError}
            </div>
          )}
          <Select label="Plan" value={planCode} onChange={(e) => setPlanCode(e.target.value as PlanCode)}>
            {PLAN_CODES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={startAsTrial}
              onChange={(e) => setStartAsTrial(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Start as a 14-day trial (unchecked = active, billed period starts now)
          </label>
          <p className="text-xs text-slate-500">
            This creates the school, subscription, and entitlements immediately, and emails{' '}
            <span className="font-semibold">{approving?.contactEmail}</span> a single-use invite link to set their
            password. This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
}
