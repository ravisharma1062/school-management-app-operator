import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { schoolsApi } from '@/api/schools';
import { subscriptionsApi } from '@/api/subscriptions';
import { extractErrorMessage } from '@/api/client';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ErrorState,
  LoadingState,
  PageHeader,
  SchoolStatusBadge,
  Select,
} from '@/components/ui';
import type { PlanCode, SchoolStatus } from '@/types';

const SCHOOL_STATUSES: SchoolStatus[] = ['TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED'];
const PLAN_CODES: PlanCode[] = ['BASIC', 'STANDARD', 'PREMIUM'];

export function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [pendingStatus, setPendingStatus] = useState<SchoolStatus | ''>('');
  const [pendingPlan, setPendingPlan] = useState<PlanCode | ''>('');
  const [error, setError] = useState<string | null>(null);

  const schoolQuery = useQuery({
    queryKey: ['school', id],
    queryFn: () => schoolsApi.get(id!),
    enabled: !!id,
  });
  const subscriptionQuery = useQuery({
    queryKey: ['subscription-admin', id],
    queryFn: () => subscriptionsApi.get(id!),
    enabled: !!id,
  });
  const usageQuery = useQuery({
    queryKey: ['school-usage', id],
    queryFn: () => schoolsApi.getUsage(id!),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: SchoolStatus) => schoolsApi.updateStatus(id!, status),
    onSuccess: () => {
      setPendingStatus('');
      void queryClient.invalidateQueries({ queryKey: ['school', id] });
      void queryClient.invalidateQueries({ queryKey: ['subscription-admin', id] });
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  const planMutation = useMutation({
    mutationFn: (planCode: PlanCode) => subscriptionsApi.updatePlan(id!, planCode),
    onSuccess: () => {
      setPendingPlan('');
      void queryClient.invalidateQueries({ queryKey: ['subscription-admin', id] });
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  if (schoolQuery.isLoading || subscriptionQuery.isLoading) return <LoadingState />;
  if (schoolQuery.isError) return <ErrorState error={schoolQuery.error} onRetry={() => schoolQuery.refetch()} />;
  if (!schoolQuery.data) return null;

  const school = schoolQuery.data;
  const subscription = subscriptionQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={school.name}
        description={
          <>
            <Link to="/schools" className="text-brand-600 hover:underline">
              ← All schools
            </Link>{' '}
            · <span className="font-mono">{school.slug}</span>
          </>
        }
        action={<SchoolStatusBadge status={school.status} />}
      />

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {usageQuery.data && (
        <Card>
          <CardHeader title="Usage" subtitle="Current consumption against this school's plan limits." />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Active students</p>
              <p className="text-2xl font-bold text-slate-900">
                {usageQuery.data.activeStudentCount}
                {usageQuery.data.maxStudentsLimit != null && (
                  <span className="text-base font-normal text-slate-400"> / {usageQuery.data.maxStudentsLimit}</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Emails sent this month</p>
              <p className="text-2xl font-bold text-slate-900">{usageQuery.data.emailsSentThisMonth}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">SMS sent this month</p>
              <p className="text-2xl font-bold text-slate-900">{usageQuery.data.smsSentThisMonth}</p>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="Lifecycle status" subtitle="Manually suspend, reactivate, or cancel this school." />
        <CardBody className="flex flex-wrap items-end gap-3">
          <div className="w-48">
            <Select
              label="New status"
              value={pendingStatus}
              onChange={(e) => setPendingStatus(e.target.value as SchoolStatus)}
            >
              <option value="" disabled>
                Select status
              </option>
              {SCHOOL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <Button
            disabled={!pendingStatus || pendingStatus === school.status}
            loading={statusMutation.isPending}
            onClick={() => pendingStatus && statusMutation.mutate(pendingStatus)}
          >
            Apply status change
          </Button>
        </CardBody>
      </Card>

      {subscriptionQuery.isError ? (
        <ErrorState error={subscriptionQuery.error} onRetry={() => subscriptionQuery.refetch()} />
      ) : (
        subscription && (
          <>
            <Card>
              <CardHeader
                title="Subscription"
                subtitle={`Currently on ${subscription.planName} (${subscription.planCode})`}
              />
              <CardBody className="flex flex-wrap items-end gap-3">
                <div className="w-48">
                  <Select
                    label="Change plan"
                    value={pendingPlan}
                    onChange={(e) => setPendingPlan(e.target.value as PlanCode)}
                  >
                    <option value="" disabled>
                      Select plan
                    </option>
                    {PLAN_CODES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  variant="secondary"
                  disabled={!pendingPlan || pendingPlan === subscription.planCode}
                  loading={planMutation.isPending}
                  onClick={() => pendingPlan && planMutation.mutate(pendingPlan)}
                >
                  Change plan
                </Button>
                <p className="w-full text-xs text-slate-500">
                  Changing plan recomputes every entitlement to the new plan&apos;s defaults — any manual overrides
                  are lost.
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Entitlements" />
              <CardBody className="p-0">
                <ul className="divide-y divide-slate-100 px-4 sm:px-6">
                  {subscription.entitlements.map((e) => (
                    <li key={e.featureKey} className="flex items-center justify-between py-3">
                      <span className="text-sm font-medium text-slate-700">{e.featureKey.replace(/_/g, ' ')}</span>
                      <span className="flex items-center gap-2">
                        {e.limitValue != null && (
                          <span className="text-xs text-slate-400">
                            {e.currentUsage != null ? `${e.currentUsage} / ${e.limitValue}` : `limit ${e.limitValue}`}
                          </span>
                        )}
                        <Badge tone={e.enabled ? 'green' : 'gray'}>{e.enabled ? 'Included' : 'Not included'}</Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </>
        )
      )}
    </div>
  );
}
