import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { activationApi } from '@/api/activation';
import { extractErrorMessage } from '@/api/client';
import type { ActivationInfoDto } from '@/types';
import { Button, Input } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/ui/States';

const WEB_APP_URL = import.meta.env.VITE_WEB_APP_URL ?? 'http://localhost:5173';
const MIN_PASSWORD_LENGTH = 8;

/**
 * Public (no-JWT), single-use page a newly-provisioned school's founding admin lands on from
 * their activation email (see ProvisioningService#sendActivationEmail — the link is
 * {app.operator.activation-base-url}?token={rawToken}, which defaults to this page). Sets the
 * admin's password via the tenant-realm /api/v1/auth/activate endpoint, then points them at the
 * school-facing web app to actually log in — this console never authenticates tenant users.
 */
export function ActivatePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [info, setInfo] = useState<ActivationInfoDto | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    activationApi
      .getInfo(token)
      .then(setInfo)
      .catch(setLoadError)
      .finally(() => setLoading(false));
  }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setSubmitError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await activationApi.activate(token!, password);
      setActivated(true);
    } catch (err) {
      setSubmitError(extractErrorMessage(err, 'Could not activate your account. The link may have expired.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-mesh relative flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-300/25 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent-300/25 blur-3xl" />
      </div>
      <div className="relative w-full max-w-sm animate-fade-up">
        <div className="mb-8 text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-accent-500 text-3xl shadow-glow-lg">
            🎉
          </span>
          <h1 className="text-gradient mt-4 text-3xl font-extrabold tracking-tight">Activate your account</h1>
          <p className="mt-2 text-sm text-slate-500">Set a password to finish setting up your school</p>
        </div>

        <div className="glass rounded-3xl p-7 shadow-card">
          {!token ? (
            <ErrorState
              error={new Error('This activation link is missing its token. Check the link in your email and try again.')}
            />
          ) : loading ? (
            <LoadingState label="Checking your invite…" />
          ) : loadError ? (
            <ErrorState error={loadError} />
          ) : activated ? (
            <div className="animate-scale-in space-y-4 text-center">
              <p className="text-sm font-semibold text-slate-800">
                Your account is active. Sign in at the school portal to get started.
              </p>
              <Button className="w-full" onClick={() => window.location.assign(`${WEB_APP_URL}/login`)}>
                Go to sign in
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              {info && (
                <p className="text-sm text-slate-600">
                  Activating <span className="font-semibold text-slate-800">{info.adminEmail}</span> for{' '}
                  <span className="font-semibold text-slate-800">{info.schoolName}</span>.
                </p>
              )}
              {submitError && (
                <div
                  role="alert"
                  className="animate-scale-in rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700"
                >
                  {submitError}
                </div>
              )}
              <Input
                label="New password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={MIN_PASSWORD_LENGTH}
                placeholder="••••••••"
              />
              <Input
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={MIN_PASSWORD_LENGTH}
                placeholder="••••••••"
              />
              <Button type="submit" className="w-full" loading={submitting}>
                Activate account
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
