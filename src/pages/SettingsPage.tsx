import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/api/settings';
import { extractErrorMessage } from '@/api/client';
import { Card, CardBody, CardHeader, ErrorState, LoadingState, PageHeader } from '@/components/ui';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['platform-settings'],
    queryFn: () => settingsApi.get(),
  });

  const mutation = useMutation({
    mutationFn: (autoApproveSignups: boolean) => settingsApi.update(autoApproveSignups),
    onSuccess: (data) => {
      queryClient.setQueryData(['platform-settings'], data);
      setError(null);
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Platform-wide toggles that apply across every school." />

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        query.data && (
          <Card>
            <CardHeader
              title="Self-service provisioning"
              subtitle="MT-6f — the graduation of the manual approval queue into an automatic trigger."
            />
            <CardBody className="space-y-3">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={query.data.autoApproveSignups}
                  disabled={mutation.isPending}
                  onChange={(e) => mutation.mutate(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">Auto-approve new signup requests</span>
                  <span className="block text-sm text-slate-500">
                    When on, new signup requests from the marketing site provision instantly — no
                    review needed. When off (default), they stay in the Signup Requests queue for
                    an operator to approve or reject, same as today. Trial signups already
                    auto-provision regardless of this setting.
                  </span>
                </span>
              </label>
              {mutation.isPending && <p className="text-xs text-slate-400">Saving…</p>}
            </CardBody>
          </Card>
        )
      )}
    </div>
  );
}
