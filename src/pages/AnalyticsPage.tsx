import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics';
import { Card, CardBody, CardHeader, ErrorState, LoadingState, PageHeader } from '@/components/ui';

export function AnalyticsPage() {
  const query = useQuery({
    queryKey: ['platform-analytics'],
    queryFn: () => analyticsApi.get(),
  });

  return (
    <div>
      <PageHeader title="Analytics" description="Active tenants, plan distribution, and status breakdown." />

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        query.data && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
              <Card>
                <CardBody>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total schools</p>
                  <p className="text-4xl font-extrabold text-slate-900">{query.data.totalSchools}</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Active students</p>
                  <p className="text-4xl font-extrabold text-slate-900">{query.data.totalActiveStudents}</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Emails this month</p>
                  <p className="text-4xl font-extrabold text-slate-900">{query.data.totalEmailsSentThisMonth}</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">SMS this month</p>
                  <p className="text-4xl font-extrabold text-slate-900">{query.data.totalSmsSentThisMonth}</p>
                </CardBody>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Card>
                <CardHeader title="By status" />
                <CardBody className="space-y-2">
                  {Object.entries(query.data.schoolsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{status.replace('_', ' ')}</span>
                      <span className="font-bold text-slate-900">{count}</span>
                    </div>
                  ))}
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="By plan" />
                <CardBody className="space-y-2">
                  {Object.entries(query.data.schoolsByPlan).map(([plan, count]) => (
                    <div key={plan} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{plan}</span>
                      <span className="font-bold text-slate-900">{count}</span>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </div>
          </div>
        )
      )}
    </div>
  );
}
