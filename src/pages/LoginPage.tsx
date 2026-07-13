import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { usePlatformAuth } from '@/context/PlatformAuthContext';
import { extractErrorMessage } from '@/api/client';
import { Button, Input } from '@/components/ui';

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const { login, isAuthenticated, isBootstrapping } = usePlatformAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showMfaField, setShowMfaField] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isBootstrapping && isAuthenticated) {
    return <Navigate to="/signup-requests" replace />;
  }

  const from = (location.state as LocationState | null)?.from?.pathname ?? '/signup-requests';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password, mfaCode || undefined);
      navigate(from, { replace: true });
    } catch (err) {
      const message = extractErrorMessage(err, 'Invalid email or password');
      if (message.toLowerCase().includes('mfa')) {
        setShowMfaField(true);
      }
      setError(message);
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
            🛠️
          </span>
          <h1 className="text-gradient mt-4 text-3xl font-extrabold tracking-tight">Operator Console</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in with your platform admin account</p>
        </div>

        <form onSubmit={onSubmit} className="glass space-y-4 rounded-3xl p-7 shadow-card" noValidate>
          {error && (
            <div
              role="alert"
              className="animate-scale-in rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700"
            >
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="operator@school.app"
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
          {showMfaField && (
            <Input
              label="Authenticator code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              placeholder="123456"
            />
          )}

          <Button type="submit" className="w-full" loading={submitting}>
            Sign in
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-400">
          High-privilege surface — every action here is audited.
        </p>
      </div>
    </div>
  );
}
