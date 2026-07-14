import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '@/api/payments';
import { extractErrorMessage } from '@/api/client';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
  PageHeader,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Textarea,
} from '@/components/ui';
import type { PlatformPaymentDto } from '@/types';

const METHOD_LABEL: Record<string, string> = {
  DEMAND_DRAFT: 'Demand Draft',
  CHEQUE: 'Cheque',
  NEFT: 'NEFT',
};

export function PaymentsPage() {
  const queryClient = useQueryClient();
  const [deciding, setDeciding] = useState<{ claim: PlatformPaymentDto; action: 'verify' | 'reject' } | null>(null);
  const [notes, setNotes] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['pending-payments'],
    queryFn: () => paymentsApi.listPending(),
  });

  const decideMutation = useMutation({
    mutationFn: () => {
      if (!deciding) return Promise.reject(new Error('no claim selected'));
      return deciding.action === 'verify'
        ? paymentsApi.verify(deciding.claim.id, notes)
        : paymentsApi.reject(deciding.claim.id, notes);
    },
    onSuccess: () => {
      setDeciding(null);
      setNotes('');
      void queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
    },
    onError: (err) => setActionError(extractErrorMessage(err)),
  });

  function openDecision(claim: PlatformPaymentDto, action: 'verify' | 'reject') {
    setActionError(null);
    setNotes('');
    setDeciding({ claim, action });
  }

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Demand Draft, Cheque, and NEFT payments schools have self-reported — check your bank statement and verify or reject each one."
      />

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : !query.data || query.data.length === 0 ? (
        <EmptyState title="No payments awaiting verification" message="Reported payments will show up here." />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>School</TH>
                <TH>Amount</TH>
                <TH>Method</TH>
                <TH>Reference</TH>
                <TH>Period</TH>
                <TH>Submitted by</TH>
                <TH>Actions</TH>
              </TR>
            </THead>
            <TBody>
              {query.data.map((p) => (
                <TR key={p.id}>
                  <TD className="font-semibold text-slate-900">{p.schoolName}</TD>
                  <TD>₹{p.amount.toLocaleString('en-IN')}</TD>
                  <TD>{METHOD_LABEL[p.method] ?? p.method}</TD>
                  <TD className="font-mono text-xs">{p.referenceNumber}</TD>
                  <TD className="text-xs">
                    {p.periodStart} – {p.periodEnd}
                  </TD>
                  <TD className="text-xs text-slate-500">{p.submittedByEmail}</TD>
                  <TD>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => openDecision(p, 'verify')}>
                        Verify
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => openDecision(p, 'reject')}>
                        Reject
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      <Modal
        open={!!deciding}
        onClose={() => setDeciding(null)}
        title={`${deciding?.action === 'verify' ? 'Verify' : 'Reject'} payment from ${deciding?.claim.schoolName ?? ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeciding(null)}>
              Cancel
            </Button>
            <Button
              variant={deciding?.action === 'reject' ? 'danger' : 'primary'}
              loading={decideMutation.isPending}
              onClick={() => decideMutation.mutate()}
            >
              {deciding?.action === 'verify' ? 'Confirm verification' : 'Confirm rejection'}
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
          {deciding && (
            <div className="space-y-1 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-800">₹{deciding.claim.amount.toLocaleString('en-IN')}</span>{' '}
                via {METHOD_LABEL[deciding.claim.method] ?? deciding.claim.method}, ref{' '}
                <span className="font-mono">{deciding.claim.referenceNumber}</span>
              </p>
              <p>
                Period {deciding.claim.periodStart} – {deciding.claim.periodEnd}
              </p>
              {deciding.action === 'verify' && (
                <p className="text-xs text-slate-500">
                  This extends the subscription to this period and reactivates the school immediately.
                </p>
              )}
            </div>
          )}
          <Textarea
            label={deciding?.action === 'reject' ? 'Reason (shown to the school)' : 'Notes (optional)'}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={deciding?.action === 'reject' ? "e.g. reference number doesn't match our bank statement" : ''}
          />
        </div>
      </Modal>
    </div>
  );
}
